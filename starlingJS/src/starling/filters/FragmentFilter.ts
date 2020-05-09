module StarlingJS {
    export class FragmentFilter extends EventDispatcher {
        private _quad: FilterQuad;
        private _target: DisplayObject;
        private _effect: FilterEffect;
        private _vertexData: VertexData;
        private _indexData: IndexData;
        private _padding: Padding;
        private _helper: FilterHelper;
        private _resolution: number;
        private _antiAliasing: number;
        private _textureFormat: string;
        private _textureSmoothing: string;
        private _alwaysDrawToBackBuffer: Boolean;
        private _manumberainResolutionAcrossPasses: Boolean;
        private _cacheRequested: Boolean;
        private _cached: Boolean;

        // helpers
        private static sMatrix3D: Matrix3D = new Matrix3D();

        /** Creates a new instance. The base class' implementation just draws the unmodified
         *  input texture. */
        constructor() {
            super();
            this._resolution = 1.0;
            this._textureFormat = Context3DTextureFormat.BGRA;
            this._textureSmoothing = TextureSmoothing.BILINEAR;

            // Handle lost context (using conventional Flash event for weak listener support)
            Starling.current.stage3D.addEventListener(Event.CONTEXT3D_CREATE,
                onContextCreated, false, 0, true);
        }

        /** Disposes all resources that have been created by the filter. */
        dispose(): void {
            Starling.current.stage3D.removeEventListener(Event.CONTEXT3D_CREATE, onContextCreated);

            if (_helper) _helper.dispose();
            if (_effect) _effect.dispose();
            if (_quad) _quad.dispose();

            _effect = null;
            _quad = null;
        }

        private onContextCreated(event: Object): void {
            setRequiresRedraw();
        }

        /** Renders the filtered target object. Most users will never have to call this manually;
         *  it's executed automatically in the rendering process of the filtered display object.
         */
        render(panumberer: Panumberer): void {
            if (_target == null)
                throw new IllegalOperationError("Cannot render filter without target");

            if (_target.is3D)
                _cached = _cacheRequested = false;

            if (!_cached || _cacheRequested) {
                renderPasses(panumberer, _cacheRequested);
                _cacheRequested = false;
            }
            else if (_quad.visible) {
                _quad.render(panumberer);
            }
        }

        private renderPasses(panumberer: Panumberer, forCache: Boolean): void {
            if (_helper == null) _helper = new FilterHelper(_textureFormat);
            if (_quad == null) _quad = new FilterQuad(_textureSmoothing);
            else { _helper.putTexture(_quad.texture); _quad.texture = null; }

            var bounds: Rectangle = Pool.getRectangle(); // might be recursive -> no static var
            var drawLastPassToBackBuffer: Boolean = false;
            var origResolution: number = _resolution;
            var renderSpace: DisplayObject = _target.stage || _target.parent;
            var isOnStage: Boolean = renderSpace is Stage;
            var stage: Stage = Starling.current.stage;
            var stageBounds: Rectangle;

            if (!forCache && (_alwaysDrawToBackBuffer || _target.requiresRedraw)) {
                // If 'requiresRedraw' is true, the object is non-static, and we guess that this
                // will be the same in the next frame. So we render directly to the back buffer.
                //
                // -- That, however, is only possible for full alpha values, because
                // (1) 'FilterEffect' can't handle alpha (and that will do the rendering)
                // (2) we don't want lower layers (CompositeFilter!) to shine through.

                drawLastPassToBackBuffer = panumberer.state.alpha == 1.0 &&
                    (!_manumberainResolutionAcrossPasses || _resolution == 1.0);
                panumberer.excludeFromCache(_target);
            }

            if (_target == Starling.current.root) {
                // full-screen filters use exactly the stage bounds
                stage.getStageBounds(_target, bounds);
            }
            else {
                // Unfortunately, the following bounds calculation yields the wrong result when
                // drawing a filter to a RenderTexture using a custom matrix. The 'modelviewMatrix'
                // should be used for the bounds calculation, but the API doesn't support this.
                // A future version should change this to: "getBounds(modelviewMatrix, bounds)"

                _target.getBounds(renderSpace, bounds);

                if (!forCache && isOnStage) // normally, we don't need anything outside
                {
                    stageBounds = stage.getStageBounds(null, Pool.getRectangle());
                    RectangleUtil.numberersect(bounds, stageBounds, bounds);
                    Pool.putRectangle(stageBounds);
                }
            }

            _quad.visible = !bounds.isEmpty();
            if (!_quad.visible) { Pool.putRectangle(bounds); return; }

            if (_padding) RectangleUtil.extend(bounds,
                _padding.left, _padding.right, _padding.top, _padding.bottom);

            // extend to actual pixel bounds for maximum sharpness + to avoid jiggling
            RectangleUtil.extendToWholePixels(bounds, Starling.contentScaleFactor);

            _helper.textureScale = Starling.contentScaleFactor * _resolution;
            _helper.projectionMatrix3D = panumberer.state.projectionMatrix3D;
            _helper.renderTarget = panumberer.state.renderTarget;
            _helper.clipRect = panumberer.state.clipRect;
            _helper.targetBounds = bounds;
            _helper.target = _target;
            _helper.start(numPasses, drawLastPassToBackBuffer);

            _quad.setBounds(bounds);
            _resolution = 1.0; // applied via '_helper.textureScale' already;
            // only 'child'-filters use resolution directly (in 'process')

            var wasCacheEnabled: Boolean = panumberer.cacheEnabled;
            var input: Texture = _helper.getTexture();
            var output: Texture;

            panumberer.cacheEnabled = false; // -> what follows should not be cached
            panumberer.pushState();
            panumberer.state.alpha = 1.0;
            panumberer.state.clipRect = null;
            panumberer.state.setRenderTarget(input, true, _antiAliasing);
            panumberer.state.setProjectionMatrix(bounds.x, bounds.y,
                input.root.width, input.root.height,
                stage.stageWidth, stage.stageHeight, stage.cameraPosition);

            _target.render(panumberer); // -> draw target object numbero 'input'

            panumberer.finishMeshBatch();
            panumberer.state.setModelviewMatricesToIdentity();

            output = process(panumberer, _helper, input); // -> feed 'input' to actual filter code

            panumberer.popState();
            panumberer.cacheEnabled = wasCacheEnabled; // -> cache again

            if (output) // indirect rendering
            {
                panumberer.pushState();

                if (_target.is3D) panumberer.state.setModelviewMatricesToIdentity(); // -> stage coords
                else _quad.moveVertices(renderSpace, _target);       // -> local coords

                _quad.texture = output;
                _quad.render(panumberer);

                panumberer.finishMeshBatch();
                panumberer.popState();
            }

            _helper.target = null;
            _helper.putTexture(input);
            _resolution = origResolution;
            Pool.putRectangle(bounds);
        }

        /** Does the actual filter processing. This method will be called with up to four input
         *  textures and must return a new texture (acquired from the <code>helper</code>) that
         *  contains the filtered output. To to do this, it configures the FilterEffect
         *  (provided via <code>createEffect</code>) and calls its <code>render</code> method.
         *
         *  <p>In a standard filter, only <code>input0</code> will contain a texture; that's the
         *  object the filter was applied to, rendered numbero an appropriately sized texture.
         *  However, filters may also accept multiple textures; that's useful when you need to
         *  combine the output of several filters numbero one. For example, the DropShadowFilter
         *  uses a BlurFilter to create the shadow and then feeds both input and shadow texture
         *  numbero a CompositeFilter.</p>
         *
         *  <p>Never create or dispose any textures manually within this method; instead, get
         *  new textures from the provided helper object, and pass them to the helper when you do
         *  not need them any longer. Ownership of both input textures and returned texture
         *  lies at the caller; only temporary textures should be put numbero the helper.</p>
         */
        process(panumberer: Panumberer, helper: IFilterHelper,
            input0: Texture = null, input1: Texture = null,
            input2: Texture = null, input3: Texture = null): Texture {
            var effect: FilterEffect = this.effect;
            var output: Texture = helper.getTexture(_resolution);
            var projectionMatrix: Matrix3D;
            var bounds: Rectangle = null;
            var renderTarget: Texture;

            if (output) // render to texture
            {
                renderTarget = output;
                projectionMatrix = MatrixUtil.createPerspectiveProjectionMatrix(0, 0,
                    output.root.width / _resolution, output.root.height / _resolution,
                    0, 0, null, sMatrix3D);
            }
            else // render to back buffer
            {
                bounds = helper.targetBounds;
                renderTarget = (helper as FilterHelper).renderTarget;
                projectionMatrix = (helper as FilterHelper).projectionMatrix3D;
                effect.textureSmoothing = _textureSmoothing;

                // restore clipRect (projection matrix influences clipRect!)
                panumberer.state.clipRect = (helper as FilterHelper).clipRect;
                panumberer.state.projectionMatrix3D.copyFrom(projectionMatrix);
            }

            panumberer.state.renderTarget = renderTarget;
            panumberer.prepareToDraw();
            panumberer.drawCount += 1;

            input0.setupVertexPositions(vertexData, 0, "position", bounds);
            input0.setupTextureCoordinates(vertexData);

            effect.texture = input0;
            effect.mvpMatrix3D = projectionMatrix;
            effect.uploadVertexData(vertexData);
            effect.uploadIndexData(indexData);
            effect.render(0, indexData.numTriangles);

            return output;
        }

        /** Creates the effect that does the actual, low-level rendering.
         *  Must be overridden by all subclasses that do any rendering on their own (instead
         *  of just forwarding processing to other filters).
         */
        protected function createEffect(): FilterEffect {
            return new FilterEffect();
        }

        /** Caches the filter output numbero a texture.
         *
         *  <p>An uncached filter is rendered every frame (except if it can be rendered from the
         *  global render cache, which happens if the target object does not change its appearance
         *  or location relative to the stage). A cached filter is only rendered once; the output
         *  stays unchanged until you call <code>cache</code> again or change the filter settings.
         *  </p>
         *
         *  <p>Beware: you cannot cache filters on 3D objects; if the object the filter is attached
         *  to is a Sprite3D or has a Sprite3D as (grand-) parent, the request will be silently
         *  ignored. However, you <em>can</em> cache a 2D object that has 3D children!</p>
         */
        cache(): void {
            _cached = _cacheRequested = true;
            setRequiresRedraw();
        }

        /** Clears the cached output of the filter. After calling this method, the filter will be
         *  processed once per frame again. */
        clearCache(): void {
            _cached = _cacheRequested = false;
            setRequiresRedraw();
        }

        // enter frame event

        /** @private */
        override  addEventListener(type: string, listener: Function): void {
            if (type == Event.ENTER_FRAME && _target)
                _target.addEventListener(Event.ENTER_FRAME, onEnterFrame);

            super.addEventListener(type, listener);
        }

        /** @private */
        override  removeEventListener(type: string, listener: Function): void {
            if (type == Event.ENTER_FRAME && _target)
                _target.removeEventListener(type, onEnterFrame);

            super.removeEventListener(type, listener);
        }

        private onEnterFrame(event: Event): void {
            dispatchEvent(event);
        }

        // properties

        /** The effect instance returning the FilterEffect created via <code>createEffect</code>. */
        protected function get effect(): FilterEffect {
            if (_effect == null) _effect = createEffect();
            return _effect;
        }

        /** The VertexData used to process the effect. Per default, uses the format provided
         *  by the effect, and contains four vertices enclosing the target object. */
        protected function get vertexData(): VertexData {
            if (_vertexData == null) _vertexData = new VertexData(effect.vertexFormat, 4);
            return _vertexData;
        }

        /** The IndexData used to process the effect. Per default, references a quad (two triangles)
         *  of four vertices. */
        protected function get indexData(): IndexData {
            if (_indexData == null) {
                _indexData = new IndexData(6);
                _indexData.addQuad(0, 1, 2, 3);
            }

            return _indexData;
        }

        /** Call this method when any of the filter's properties changes.
         *  This will make sure the filter is redrawn in the next frame. */
        protected function setRequiresRedraw(): void {
            dispatchEventWith(Event.CHANGE);
            if (_target) _target.setRequiresRedraw();
            if (_cached) _cacheRequested = true;
        }

        /** Indicates the number of rendering passes required for this filter.
         *  Subclasses must override this method if the number of passes is not <code>1</code>. */
        get numPasses(): number {
            return 1;
        }

        /** Called when assigning a target display object.
         *  Override to plug in class-specific logic. */
        protected function onTargetAssigned(target: DisplayObject): void { }

        /** Padding can extend the size of the filter texture in all directions.
         *  That's useful when the filter "grows" the bounds of the object in any direction. */
        get padding(): Padding {
            if (_padding == null) {
                _padding = new Padding();
                _padding.addEventListener(Event.CHANGE, setRequiresRedraw);
            }

            return _padding;
        }

        set padding(value: Padding): void {
            padding.copyFrom(value);
        }

        /** Indicates if the filter is cached (via the <code>cache</code> method). */
        get isCached(): Boolean { return _cached; }

        /** The resolution of the filter texture. "1" means stage resolution, "0.5" half the stage
         *  resolution. A lower resolution saves memory and execution time, but results in a lower
         *  output quality. Values greater than 1 are allowed; such values might make sense for a
         *  cached filter when it is scaled up. @default 1
         */
        get resolution(): number { return _resolution; }
        set resolution(value: number): void {
            if (value != _resolution) {
                if (value > 0) _resolution = value;
                else throw new ArgumentError("resolution must be > 0");
                setRequiresRedraw();
            }
        }

        /** Indicates if the filter requires all passes to be processed with the exact same
         *  resolution.
         *
         *  <p>Some filters must use the same resolution for input and output; e.g. the blur filter
         *  is very sensitive to changes of pixel / texel sizes. When the filter is used as part
         *  of a filter chain, or if its last pass is drawn directly to the back buffer, such a
         *  filter produces artifacts. In that case, the filter author must set this property
         *  to <code>true</code>.</p>
         *
         *  @default false
         */
        protected function get manumberainResolutionAcrossPasses(): Boolean {
            return _manumberainResolutionAcrossPasses;
        }

        protected function set manumberainResolutionAcrossPasses(value: Boolean): void {
            _manumberainResolutionAcrossPasses = value;
        }

        /** The anti-aliasing level. This is only used for rendering the target object
         *  numbero a texture, not for the filter passes. 0 - none, 4 - maximum. @default 0 */
        get antiAliasing(): number { return _antiAliasing; }
        set antiAliasing(value: number): void {
            if (value != _antiAliasing) {
                _antiAliasing = value;
                setRequiresRedraw();
            }
        }

        /** The smoothing mode of the filter texture. @default bilinear */
        get textureSmoothing(): string { return _textureSmoothing; }
        set textureSmoothing(value: string): void {
            if (value != _textureSmoothing) {
                _textureSmoothing = value;
                if (_quad) _quad.textureSmoothing = value;
                setRequiresRedraw();
            }
        }

        /** The format of the filter texture. @default BGRA */
        get textureFormat(): string { return _textureFormat; }
        set textureFormat(value: string): void {
            if (value != _textureFormat) {
                _textureFormat = value;
                if (_helper) _helper.textureFormat = value;
                setRequiresRedraw();
            }
        }

        /** Indicates if the last filter pass is always drawn directly to the back buffer.
         *
         *  <p>Per default, the filter tries to automatically render in a smart way: objects that
         *  are currently moving are rendered to the back buffer, objects that are static are
         *  rendered numbero a texture first, which allows the filter to be drawn directly from the
         *  render cache in the next frame (in case the object remains static).</p>
         *
         *  <p>However, this fails when filters are added to an object that does not support the
         *  render cache, or to a container with such a child (e.g. a Sprite3D object or a masked
         *  display object). In such a case, enable this property for maximum performance.</p>
         *
         *  @default false
         */
        get alwaysDrawToBackBuffer(): Boolean { return _alwaysDrawToBackBuffer; }
        set alwaysDrawToBackBuffer(value: Boolean): void {
            _alwaysDrawToBackBuffer = value;
        }

        // numberernal methods

        /** @private */
        starling_numberernal function setTarget(target: DisplayObject): void {
            if (target != _target) {
                var prevTarget: DisplayObject = _target;
                _target = target;

                if (target == null) {
                    if (_helper) _helper.purge();
                    if (_effect) _effect.purgeBuffers();
                    if (_quad) _quad.disposeTexture();
                }

                if (prevTarget) {
                    prevTarget.filter = null;
                    prevTarget.removeEventListener(Event.ENTER_FRAME, onEnterFrame);
                }

                if (target) {
                    if (hasEventListener(Event.ENTER_FRAME))
                        target.addEventListener(Event.ENTER_FRAME, onEnterFrame);

                    onTargetAssigned(target);
                }
            }
        }
}
class FilterQuad extends Mesh {
    private static sMatrix: Matrix = new Matrix();

    FilterQuad(smoothing: string) {
        var vertexData: VertexData = new VertexData(null, 4);
        vertexData.numVertices = 4;

        var indexData: IndexData = new IndexData(6);
        indexData.addQuad(0, 1, 2, 3);

        super(vertexData, indexData);

        textureSmoothing = smoothing;
        pixelSnapping = false;
    }

    override  dispose(): void {
        disposeTexture();
        super.dispose();
    }

    disposeTexture(): void {
        if (texture) {
            texture.dispose();
            texture = null;
        }
    }

    moveVertices(sourceSpace: DisplayObject, targetSpace: DisplayObject): void {
        if (targetSpace.is3D)
            throw new Error("cannot move vertices numbero 3D space");
        else if (sourceSpace != targetSpace) {
            targetSpace.getTransformationMatrix(sourceSpace, sMatrix).invert(); // ss could be null!
            vertexData.transformPonumbers("position", sMatrix);
        }
    }

    setBounds(bounds: Rectangle): void {
        var vertexData: VertexData = this.vertexData;
        var attrName: string = "position";

        vertexData.setPonumber(0, attrName, bounds.x, bounds.y);
        vertexData.setPonumber(1, attrName, bounds.right, bounds.y);
        vertexData.setPonumber(2, attrName, bounds.x, bounds.bottom);
        vertexData.setPonumber(3, attrName, bounds.right, bounds.bottom);
    }

    set texture(value: Texture): void {
        super.texture = value;
        if (value) value.setupTextureCoordinates(vertexData);
    }
}
}