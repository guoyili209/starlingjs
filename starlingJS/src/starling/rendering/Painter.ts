// =================================================================================================
//
//	Starling Framework
//	Copyright Gamua GmbH. All Rights Reserved.
//
//	This program is free software. You can redistribute and/or modify it
//	in accordance with the terms of the accompanying license agreement.
//
// =================================================================================================

module StarlingJS {
    export class Painter {
        // the key for the programs stored in 'sharedData'
        private static readonly PROGRAM_DATA_NAME: string = "starling.rendering.Painter.Programs";

        /** The value with which the stencil buffer will be cleared,
         *  and the default reference value used for stencil tests. */
        public static readonly DEFAULT_STENCIL_VALUE: number = 127;

        // members

        private _stage3D: Stage3D;
        private _context: Context3D;
        private _shareContext: boolean;
        private _drawCount: number;
        private _frameID: number;
        private _pixelSize: number;
        private _enableErrorChecking: boolean;
        private _stencilReferenceValues: Dictionary;
        private _clipRectStack: Array<Rectangle>;
        private _batchCacheExclusions: Array<DisplayObject>;
        private _batchTrimInterval: number = 250;

        private _batchProcessor: BatchProcessor;
        private _batchProcessorCurr: BatchProcessor; // current  processor
        private _batchProcessorPrev: BatchProcessor; // previous processor (cache)
        private _batchProcessorSpec: BatchProcessor; // special  processor (no cache)

        private _actualRenderTarget: TextureBase;
        private _actualRenderTargetOptions: number;
        private _actualCulling: string;
        private _actualBlendMode: string;
        private _actualDepthMask: boolean;
        private _actualDepthTest: string;

        private _backBufferWidth: number;
        private _backBufferHeight: number;
        private _backBufferScaleFactor: number;

        private _state: RenderState;
        private _stateStack: Vector.<RenderState>;
        private _stateStackPos: number;
        private _stateStackLength: number;

        // shared data
        private static var sSharedData: Dictionary = new Dictionary();

        // helper objects
        private static var sMatrix: Matrix = new Matrix();
        private static var sPoint3D: Vector3D = new Vector3D();
        private static var sMatrix3D: Matrix3D = new Matrix3D();
        private static var sClipRect: Rectangle = new Rectangle();
        private static var sBufferRect: Rectangle = new Rectangle();
        private static var sScissorRect: Rectangle = new Rectangle();
        private static var sMeshSubset: MeshSubset = new MeshSubset();

        // construction

        /** Creates a new Painter object. Normally, it's not necessary to create any custom
         *  painters; instead, use the global painter found on the Starling instance. */
        Painter(stage3D: Stage3D) {
            _stage3D = stage3D;
            _stage3D.addEventListener(Event.CONTEXT3D_CREATE, onContextCreated, false, 40, true);
            _context = _stage3D.context3D;
            _shareContext = _context && _context.driverInfo != "Disposed";
            _backBufferWidth = _context ? _context.backBufferWidth : 0;
            _backBufferHeight = _context ? _context.backBufferHeight : 0;
            _backBufferScaleFactor = _pixelSize = 1.0;
            _stencilReferenceValues = new Dictionary(true);
            _clipRectStack = new < Rectangle > [];

            _batchProcessorCurr = new BatchProcessor();
            _batchProcessorCurr.onBatchComplete = drawBatch;

            _batchProcessorPrev = new BatchProcessor();
            _batchProcessorPrev.onBatchComplete = drawBatch;

            _batchProcessorSpec = new BatchProcessor();
            _batchProcessorSpec.onBatchComplete = drawBatch;

            _batchProcessor = _batchProcessorCurr;
            _batchCacheExclusions = new Vector.<DisplayObject>();

            _state = new RenderState();
            _state.onDrawRequired = finishMeshBatch;
            _stateStack = new < RenderState > [];
            _stateStackPos = -1;
            _stateStackLength = 0;
        }

        /** Disposes all mesh batches, programs, and - if it is not being shared -
         *  the render context. */
        dispose(): void {
            _batchProcessorCurr.dispose();
            _batchProcessorPrev.dispose();
            _batchProcessorSpec.dispose();

            if (!_shareContext) {
                if (_context) _context.dispose(false);
                sSharedData = new Dictionary();
            }
        }

        // context handling

        /** Requests a context3D object from the stage3D object.
         *  This is called by Starling internally during the initialization process.
         *  You normally don't need to call this method yourself. (For a detailed description
         *  of the parameters, look at the documentation of the method with the same name in the
         *  "RenderUtil" class.)
         *
         *  @see starling.utils.RenderUtil
         */
        requestContext3D(renderMode: string, profile: *): void {
            RenderUtil.requestContext3D(_stage3D, renderMode, profile);
        }

        private function onContextCreated(event: Object): void {
            _context = _stage3D.context3D;
            _context.enableErrorChecking = _enableErrorChecking;
        }

        /** Sets the viewport dimensions and other attributes of the rendering buffer.
         *  Starling will call this method internally, so most apps won't need to mess with this.
         *
         *  <p>Beware: if <code>shareContext</code> is enabled, the method will only update the
         *  painter's context-related information (like the size of the back buffer), but won't
         *  make any actual changes to the context.</p>
         *
         * @param viewPort                the position and size of the area that should be rendered
         *                                into, in pixels.
         * @param contentScaleFactor      only relevant for Desktop (!) HiDPI screens. If you want
         *                                to support high resolutions, pass the 'contentScaleFactor'
         *                                of the Flash stage; otherwise, '1.0'.
         * @param antiAlias               from 0 (none) to 16 (very high quality).
         * @param enableDepthAndStencil   indicates whether the depth and stencil buffers should
         *                                be enabled. Note that on AIR, you also have to enable
         *                                this setting in the app-xml (application descriptor);
         *                                otherwise, this setting will be silently ignored.
         * @param supportBrowserZoom      if enabled, zooming a website will adapt the size of
         *                                the back buffer.
         */
        configureBackBuffer(viewPort: Rectangle, contentScaleFactor: number,
            antiAlias: number, enableDepthAndStencil: boolean,
            supportBrowserZoom: boolean = false): void {
            if (!_shareContext) {
                enableDepthAndStencil &&= SystemUtil.supportsDepthAndStencil;

                // Changing the stage3D position might move the back buffer to invalid bounds
                // temporarily. To avoid problems, we set it to the smallest possible size first.

                if (_context.profile == "baselineConstrained")
                    _context.configureBackBuffer(32, 32, antiAlias, enableDepthAndStencil);

                // If supporting HiDPI mode would exceed the maximum buffer size
                // (can happen e.g in software mode), we stick to the low resolution.

                if (viewPort.width * contentScaleFactor > _context.maxBackBufferWidth ||
                    viewPort.height * contentScaleFactor > _context.maxBackBufferHeight) {
                    contentScaleFactor = 1.0;
                }

                _stage3D.x = viewPort.x;
                _stage3D.y = viewPort.y;

                _context.configureBackBuffer(viewPort.width, viewPort.height, antiAlias,
                    enableDepthAndStencil, contentScaleFactor != 1.0, supportBrowserZoom);
            }

            _backBufferWidth = viewPort.width;
            _backBufferHeight = viewPort.height;
            _backBufferScaleFactor = contentScaleFactor;
        }

        // program management

        /** Registers a program under a certain name.
         *  If the name was already used, the previous program is overwritten. */
        registerProgram(name: string, program: Program): void {
            deleteProgram(name);
            programs[name] = program;
        }

        /** Deletes the program of a certain name. */
        deleteProgram(name: string): void {
            var program: Program = getProgram(name);
            if (program) {
                program.dispose();
                delete programs[name];
            }
        }

        /** Returns the program registered under a certain name, or null if no program with
         *  this name has been registered. */
        getProgram(name: string): Program {
            return programs[name] as Program;
        }

        /** Indicates if a program is registered under a certain name. */
        hasProgram(name: string): boolean {
            return name in programs;
        }

        // state stack

        /** Pushes the current render state to a stack from which it can be restored later.
         *
         *  <p>If you pass a BatchToken, it will be updated to point to the current location within
         *  the render cache. That way, you can later reference this location to render a subset of
         *  the cache.</p>
         */
        pushState(token: BatchToken = null): void {
            _stateStackPos++;

            if (_stateStackLength < _stateStackPos + 1) _stateStack[_stateStackLength++] = new RenderState();
            if (token) _batchProcessor.fillToken(token);

            _stateStack[_stateStackPos].copyFrom(_state);
        }

        /** Modifies the current state with a transformation matrix, alpha factor, and blend mode.
         *
         *  @param transformationMatrix Used to transform the current <code>modelviewMatrix</code>.
         *  @param alphaFactor          Multiplied with the current alpha value.
         *  @param blendMode            Replaces the current blend mode; except for "auto", which
         *                              means the current value remains unchanged.
         */
        setStateTo(transformationMatrix: Matrix, alphaFactor: number = 1.0,
            blendMode: string = "auto"): void {
            if (transformationMatrix) MatrixUtil.prependMatrix(_state._modelviewMatrix, transformationMatrix);
            if (alphaFactor != 1.0) _state._alpha *= alphaFactor;
            if (blendMode != BlendMode.AUTO) _state.blendMode = blendMode;
        }

        /** Restores the render state that was last pushed to the stack. If this changes
         *  blend mode, clipping rectangle, render target or culling, the current batch
         *  will be drawn right away.
         *
         *  <p>If you pass a BatchToken, it will be updated to point to the current location within
         *  the render cache. That way, you can later reference this location to render a subset of
         *  the cache.</p>
         */
        popState(token: BatchToken = null): void {
            if (_stateStackPos < 0)
                throw new IllegalOperationError("Cannot pop empty state stack");

            _state.copyFrom(_stateStack[_stateStackPos]); // -> might cause 'finishMeshBatch'
            _stateStackPos--;

            if (token) _batchProcessor.fillToken(token);
        }

        /** Restores the render state that was last pushed to the stack, but does NOT remove
         *  it from the stack. */
        restoreState(): void {
            if (_stateStackPos < 0)
                throw new IllegalOperationError("Cannot restore from empty state stack");

            _state.copyFrom(_stateStack[_stateStackPos]); // -> might cause 'finishMeshBatch'
        }

        /** Updates all properties of the given token so that it describes the current position
         *  within the render cache. */
        fillToken(token: BatchToken): void {
            if (token) _batchProcessor.fillToken(token);
        }

        // masks

        /** Draws a display object into the stencil buffer only; increments or decrements the
         *  entry value corresponding to the pixel of the shape in the stencil buffer, for the
         *  normal or inverted mask modes, respectively. Effectively, the stencil buffer
         *  modification is to mark only the appropriate pixel coordinates where the 'maskee'
         *  object is to be rendered.<br>
         *  The stencil reference value will be incremented in the normal mask mode only.
         *
         *  <p>If the 'mask' is part of the display list, it will be drawn at its conventional
         *  stage coordinates. Otherwise, it will be drawn with the current modelview matrix.</p>
         *
         *  <p>As an optimization, this method might update the clipping rectangle of the render
         *  state instead of utilizing the stencil buffer. This is possible when the mask object
         *  is of type <code>starling.display.Quad</code> and is aligned parallel to the stage
         *  axes.</p>
         *
         *  <p>Note that masking breaks the render cache; the masked object must be redrawn anew
         *  in the next frame. If you pass <code>maskee</code>, the method will automatically
         *  call <code>excludeFromCache(maskee)</code> for you.</p>
         */
        drawMask(mask: DisplayObject, maskee: DisplayObject = null): void {
            if (_context == null) return;

            finishMeshBatch();

            if (isRectangularMask(mask, maskee, sMatrix)) {
                mask.getBounds(mask, sClipRect);
                RectangleUtil.getBounds(sClipRect, sMatrix, sClipRect);
                pushClipRect(sClipRect);
            }
            else {
                if (maskee && maskee.maskInverted) {
                    _context.setStencilActions(Context3DTriangleFace.FRONT_AND_BACK,
                        Context3DCompareMode.ALWAYS, Context3DStencilAction.DECREMENT_SATURATE);

                    renderMask(mask);
                }
                else {
                    _context.setStencilActions(Context3DTriangleFace.FRONT_AND_BACK,
                        Context3DCompareMode.EQUAL, Context3DStencilAction.INCREMENT_SATURATE);

                    renderMask(mask);
                    stencilReferenceValue++;
                }

                _context.setStencilActions(
                    Context3DTriangleFace.FRONT_AND_BACK, Context3DCompareMode.EQUAL);
            }

            excludeFromCache(maskee);
        }

        /** Draws a display object into the stencil buffer only; increments or decrements the
         *  entry value corresponding to the pixel of the shape in the stencil buffer, for the
         *  inverted or normal mask modes, respectively. Effectively, The stencil buffer
         *  modification is to erase the object shape from the stencil buffer, restoring the
         *  previous state.<br>
         *  The stencil reference value will be decremented in the normal mask mode only.
         *
         *  <p>Note: if the mask object meets the requirements of using the clipping rectangle,
         *  it will be assumed that this erase operation undoes the clipping rectangle change
         *  caused by the corresponding <code>drawMask()</code> call.</p>
         */
        eraseMask(mask: DisplayObject, maskee: DisplayObject = null): void {
            if (_context == null) return;

            finishMeshBatch();

            if (isRectangularMask(mask, maskee, sMatrix)) {
                popClipRect();
            }
            else {
                if (maskee && maskee.maskInverted) {
                    _context.setStencilActions(Context3DTriangleFace.FRONT_AND_BACK,
                        Context3DCompareMode.ALWAYS, Context3DStencilAction.INCREMENT_SATURATE);

                    renderMask(mask);
                }
                else {
                    _context.setStencilActions(Context3DTriangleFace.FRONT_AND_BACK,
                        Context3DCompareMode.EQUAL, Context3DStencilAction.DECREMENT_SATURATE);

                    renderMask(mask);
                    stencilReferenceValue--;
                }

                // restore default stencil action ("keep")

                _context.setStencilActions(
                    Context3DTriangleFace.FRONT_AND_BACK, Context3DCompareMode.EQUAL);
            }
        }

        private function renderMask(mask: DisplayObject): void {
            var matrix: Matrix = null;
            var matrix3D: Matrix3D = null;
            var wasCacheEnabled: boolean = cacheEnabled;

            pushState();
            cacheEnabled = false;
            _state.alpha = 0.0;

            if (mask.stage) {
                _state.setModelviewMatricesToIdentity();

                if (mask.is3D) matrix3D = mask.getTransformationMatrix3D(null, sMatrix3D);
                else matrix = mask.getTransformationMatrix(null, sMatrix);
            }
            else {
                if (mask.is3D) matrix3D = mask.transformationMatrix3D;
                else matrix = mask.transformationMatrix;
            }

            if (matrix3D) _state.transformModelviewMatrix3D(matrix3D);
            else _state.transformModelviewMatrix(matrix);

            mask.render(this);
            finishMeshBatch();

            cacheEnabled = wasCacheEnabled;
            popState();
        }

        private function pushClipRect(clipRect: Rectangle): void {
            var stack: Vector.<Rectangle> = _clipRectStack;
            var stackLength: number = stack.length;
            var intersection: Rectangle = Pool.getRectangle();

            if (stackLength)
                RectangleUtil.intersect(stack[stackLength - 1], clipRect, intersection);
            else
                intersection.copyFrom(clipRect);

            stack[stackLength] = intersection;
            _state.clipRect = intersection;
        }

        private function popClipRect(): void {
            var stack: Vector.<Rectangle> = _clipRectStack;
            var stackLength: number = stack.length;

            if (stackLength == 0)
                throw new Error("Trying to pop from empty clip rectangle stack");

            stackLength--;
            Pool.putRectangle(stack.pop());
            _state.clipRect = stackLength ? stack[stackLength - 1] : null;
        }

        /** Figures out if the mask can be represented by a scissor rectangle; this is possible
         *  if it's just a simple (untextured) quad that is parallel to the stage axes. The 'out'
         *  parameter will be filled with the transformation matrix required to move the mask into
         *  stage coordinates. */
        private function isRectangularMask(mask: DisplayObject, maskee: DisplayObject, out: Matrix): boolean {
            var quad: Quad = mask as Quad;
            var isInverted: boolean = maskee && maskee.maskInverted;
            var is3D: boolean = mask.is3D || (maskee && maskee.is3D && mask.stage == null);

            if (quad && !isInverted && !is3D && quad.texture == null) {
                if (mask.stage) mask.getTransformationMatrix(null, out);
                else {
                    out.copyFrom(mask.transformationMatrix);
                    out.concat(_state.modelviewMatrix);
                }

                return (MathUtil.isEquivalent(out.a, 0) && MathUtil.isEquivalent(out.d, 0)) ||
                    (MathUtil.isEquivalent(out.b, 0) && MathUtil.isEquivalent(out.c, 0));
            }
            return false;
        }

        // mesh rendering

        /** Adds a mesh to the current batch of unrendered meshes. If the current batch is not
         *  compatible with the mesh, all previous meshes are rendered at once and the batch
         *  is cleared.
         *
         *  @param mesh    The mesh to batch.
         *  @param subset  The range of vertices to be batched. If <code>null</code>, the complete
         *                 mesh will be used.
         */
        batchMesh(mesh: Mesh, subset: MeshSubset = null): void {
            _batchProcessor.addMesh(mesh, _state, subset);
        }

        /** Finishes the current mesh batch and prepares the next one. */
        finishMeshBatch(): void {
            _batchProcessor.finishBatch();
        }

        /** Indicate how often the internally used batches are being trimmed to save memory.
         *
         *  <p>While rendering, the internally used MeshBatches are used in a different way in each
         *  frame. To save memory, they should be trimmed every once in a while. This method defines
         *  how often that happens, if at all. (Default: enabled = true, interval = 250)</p>
         *
         *  @param enabled   If trimming happens at all. Only disable temporarily!
         *  @param interval  The number of frames between each trim operation.
         */
        enableBatchTrimming(enabled: boolean = true, interval: number = 250): void {
            _batchTrimInterval = enabled ? interval : 0;
        }

        /** Completes all unfinished batches, cleanup procedures. */
        finishFrame(): void {
            if (_batchTrimInterval > 0) {
                const baseInterval: number = _batchTrimInterval | 0x1; // odd number -> alternating processors
                const specInterval: number = _batchTrimInterval * 1.5;

                if (_frameID % baseInterval == 0) _batchProcessorCurr.trim();
                if (_frameID % specInterval == 0) _batchProcessorSpec.trim();
            }

            _batchProcessor.finishBatch();
            _batchProcessor = _batchProcessorSpec; // no cache between frames
            processCacheExclusions();
        }

        private function processCacheExclusions(): void {
            var i: number, length: number = _batchCacheExclusions.length;
            for (i = 0; i < length; ++i) _batchCacheExclusions[i].excludeFromCache();
            _batchCacheExclusions.length = 0;
        }

        /** Makes sure that the default context settings Starling relies on will be refreshed
         *  before the next 'draw' operation. This includes blend mode, culling, and depth test. */
        setupContextDefaults(): void {
            _actualBlendMode = null;
            _actualCulling = null;
            _actualDepthMask = false;
            _actualDepthTest = null;
        }

        /** Resets the current state, state stack, batch processor, stencil reference value,
         *  clipping rectangle, and draw count. Furthermore, depth testing is disabled. */
        nextFrame(): void {
            // update batch processors
            _batchProcessor = swapBatchProcessors();
            _batchProcessor.clear();
            _batchProcessorSpec.clear();

            setupContextDefaults();

            // reset everything else
            stencilReferenceValue = DEFAULT_STENCIL_VALUE;
            _clipRectStack.length = 0;
            _drawCount = 0;
            _stateStackPos = -1;
            _state.reset();
        }

        private function swapBatchProcessors(): BatchProcessor {
            var tmp: BatchProcessor = _batchProcessorPrev;
            _batchProcessorPrev = _batchProcessorCurr;
            return _batchProcessorCurr = tmp;
        }

        /** Draws all meshes from the render cache between <code>startToken</code> and
         *  (but not including) <code>endToken</code>. The render cache contains all meshes
         *  rendered in the previous frame. */
        drawFromCache(startToken: BatchToken, endToken: BatchToken): void {
            var meshBatch: MeshBatch;
            var subset: MeshSubset = sMeshSubset;

            if (!startToken.equals(endToken)) {
                pushState();

                for (var i: number = startToken.batchID; i <= endToken.batchID; ++i) {
                    meshBatch = _batchProcessorPrev.getBatchAt(i);
                    subset.setTo(); // resets subset

                    if (i == startToken.batchID) {
                        subset.vertexID = startToken.vertexID;
                        subset.indexID = startToken.indexID;
                        subset.numVertices = meshBatch.numVertices - subset.vertexID;
                        subset.numIndices = meshBatch.numIndices - subset.indexID;
                    }

                    if (i == endToken.batchID) {
                        subset.numVertices = endToken.vertexID - subset.vertexID;
                        subset.numIndices = endToken.indexID - subset.indexID;
                    }

                    if (subset.numVertices) {
                        _state.alpha = 1.0;
                        _state.blendMode = meshBatch.blendMode;
                        _batchProcessor.addMesh(meshBatch, _state, subset, true);
                    }
                }

                popState();
            }
        }

        /** Prevents the object from being drawn from the render cache in the next frame.
         *  Different to <code>setRequiresRedraw()</code>, this does not indicate that the object
         *  has changed in any way, but just that it doesn't support being drawn from cache.
         *
         *  <p>Note that when a container is excluded from the render cache, its children will
         *  still be cached! This just means that batching is interrupted at this object when
         *  the display tree is traversed.</p>
         */
        excludeFromCache(object: DisplayObject): void {
            if (object) _batchCacheExclusions[_batchCacheExclusions.length] = object;
        }

        private function drawBatch(meshBatch: MeshBatch): void {
            pushState();

            state.blendMode = meshBatch.blendMode;
            state.modelviewMatrix.identity();
            state.alpha = 1.0;

            meshBatch.render(this);

            popState();
        }

        // helper methods

        /** Applies all relevant state settings to at the render context. This includes
         *  blend mode, render target and clipping rectangle. Always call this method before
         *  <code>context.drawTriangles()</code>.
         */
        prepareToDraw(): void {
            applyBlendMode();
            applyRenderTarget();
            applyClipRect();
            applyCulling();
            applyDepthTest();
        }

        /** Clears the render context with a certain color and alpha value. Since this also
         *  clears the stencil buffer, the stencil reference value is also reset to its default
         *  value. */
        clear(rgb: number = 0, alpha: number = 0.0): void {
            applyRenderTarget();
            stencilReferenceValue = DEFAULT_STENCIL_VALUE;
            RenderUtil.clear(rgb, alpha, 1.0, DEFAULT_STENCIL_VALUE);
        }

        /** Resets the render target to the back buffer and displays its contents. */
        present(): void {
            _state.renderTarget = null;
            _actualRenderTarget = null;
            _context.present();
        }

        private function applyBlendMode(): void {
            var blendMode: string = _state.blendMode;

            if (blendMode != _actualBlendMode) {
                BlendMode.get(_state.blendMode).activate();
                _actualBlendMode = blendMode;
            }
        }

        private function applyCulling(): void {
            var culling: string = _state.culling;

            if (culling != _actualCulling) {
                _context.setCulling(culling);
                _actualCulling = culling;
            }
        }

        private function applyDepthTest(): void {
            var depthMask: boolean = _state.depthMask;
            var depthTest: string = _state.depthTest;

            if (depthMask != _actualDepthMask || depthTest != _actualDepthTest) {
                _context.setDepthTest(depthMask, depthTest);
                _actualDepthMask = depthMask;
                _actualDepthTest = depthTest;
            }
        }

        private function applyRenderTarget(): void {
            var target: TextureBase = _state.renderTargetBase;
            var options: number = _state.renderTargetOptions;

            if (target != _actualRenderTarget || options != _actualRenderTargetOptions) {
                if (target) {
                    var antiAlias: number = _state.renderTargetAntiAlias;
                    var depthAndStencil: boolean = _state.renderTargetSupportsDepthAndStencil;
                    _context.setRenderToTexture(target, depthAndStencil, antiAlias);
                }
                else
                    _context.setRenderToBackBuffer();

                _context.setStencilReferenceValue(stencilReferenceValue);
                _actualRenderTargetOptions = options;
                _actualRenderTarget = target;
            }
        }

        private function applyClipRect(): void {
            var clipRect: Rectangle = _state.clipRect;

            if (clipRect) {
                var width: number, height: number;
                var projMatrix: Matrix3D = _state.projectionMatrix3D;
                var renderTarget: Texture = _state.renderTarget;

                if (renderTarget) {
                    width = renderTarget.root.nativeWidth;
                    height = renderTarget.root.nativeHeight;
                }
                else {
                    width = _backBufferWidth;
                    height = _backBufferHeight;
                }

                // convert to pixel coordinates (matrix transformation ends up in range [-1, 1])
                MatrixUtil.transformCoords3D(projMatrix, clipRect.x, clipRect.y, 0.0, sPoint3D);
                sPoint3D.project(); // eliminate w-coordinate
                sClipRect.x = (sPoint3D.x * 0.5 + 0.5) * width;
                sClipRect.y = (0.5 - sPoint3D.y * 0.5) * height;

                MatrixUtil.transformCoords3D(projMatrix, clipRect.right, clipRect.bottom, 0.0, sPoint3D);
                sPoint3D.project(); // eliminate w-coordinate
                sClipRect.right = (sPoint3D.x * 0.5 + 0.5) * width;
                sClipRect.bottom = (0.5 - sPoint3D.y * 0.5) * height;

                sBufferRect.setTo(0, 0, width, height);
                RectangleUtil.intersect(sClipRect, sBufferRect, sScissorRect);

                // an empty rectangle is not allowed, so we set it to the smallest possible size
                if (sScissorRect.width < 1 || sScissorRect.height < 1)
                    sScissorRect.setTo(0, 0, 1, 1);

                _context.setScissorRectangle(sScissorRect);
            }
            else {
                _context.setScissorRectangle(null);
            }
        }

        /** Refreshes the values of "backBufferWidth" and "backBufferHeight" from the current
         *  context dimensions and stores the given "backBufferScaleFactor". This method is
         *  called by Starling when the browser zoom factor changes (in case "supportBrowserZoom"
         *  is enabled).
         */
        refreshBackBufferSize(scaleFactor: number): void {
            _backBufferWidth = _context.backBufferWidth;
            _backBufferHeight = _context.backBufferHeight;
            _backBufferScaleFactor = scaleFactor;
        }

        // properties

        /** Indicates the number of stage3D draw calls. */
        get drawCount(): number { return _drawCount; }
        set drawCount(value: number): void { _drawCount = value; }

        /** The current stencil reference value of the active render target. This value
         *  is typically incremented when drawing a mask and decrementing when erasing it.
         *  The painter keeps track of one stencil reference value per render target.
         *  Only change this value if you know what you're doing!
         */
        get stencilReferenceValue(): number {
            var key: Object = _state.renderTarget ? _state.renderTargetBase : this;
            if (key in _stencilReferenceValues) return _stencilReferenceValues[key];
            else return DEFAULT_STENCIL_VALUE;
        }

        set stencilReferenceValue(value: number): void {
            var key: Object = _state.renderTarget ? _state.renderTargetBase : this;
            _stencilReferenceValues[key] = value;

            if (contextValid)
                _context.setStencilReferenceValue(value);
        }

        /** Indicates if the render cache is enabled. Normally, this should be left at the default;
         *  however, some custom rendering logic might require to change this property temporarily.
         *  Also note that the cache is automatically reactivated each frame, right before the
         *  render process.
         *
         *  @default true
         */
        get cacheEnabled(): boolean { return _batchProcessor == _batchProcessorCurr; }
        set cacheEnabled(value: boolean): void {
            if (value != cacheEnabled) {
                finishMeshBatch();

                if (value) _batchProcessor = _batchProcessorCurr;
                else _batchProcessor = _batchProcessorSpec;
            }
        }

        /** The current render state, containing some of the context settings, projection- and
         *  modelview-matrix, etc. Always returns the same instance, even after calls to "pushState"
         *  and "popState".
         *
         *  <p>When you change the current RenderState, and this change is not compatible with
         *  the current render batch, the batch will be concluded right away. Thus, watch out
         *  for changes of blend mode, clipping rectangle, render target or culling.</p>
         */
        get state(): RenderState { return _state; }

        /** The Stage3D instance this painter renders into. */
        get stage3D(): Stage3D { return _stage3D; }

        /** The Context3D instance this painter renders into. */
        get context(): Context3D { return _context; }

        /** Returns the index of the current frame <strong>if</strong> the render cache is enabled;
         *  otherwise, returns zero. To get the frameID regardless of the render cache, call
         *  <code>Starling.frameID</code> instead. */
        set frameID(value: number): void { _frameID = value; }
        get frameID(): number {
            return _batchProcessor == _batchProcessorCurr ? _frameID : 0;
        }

        /** The size (in points) that represents one pixel in the back buffer. */
        get pixelSize(): number { return _pixelSize; }
        set pixelSize(value: number): void { _pixelSize = value; }

        /** Indicates if another Starling instance (or another Stage3D framework altogether)
         *  uses the same render context. @default false */
        get shareContext(): boolean { return _shareContext; }
        set shareContext(value: boolean): void { _shareContext = value; }

        /** Indicates if Stage3D render methods will report errors. Activate only when needed,
         *  as this has a negative impact on performance. @default false */
        get enableErrorChecking(): boolean { return _enableErrorChecking; }
        set enableErrorChecking(value: boolean): void {
            _enableErrorChecking = value;
            if (_context) _context.enableErrorChecking = value;
            if (value) trace("[Starling] Warning: 'enableErrorChecking' has a " +
                "negative impact on performance. Never activate for release builds!");
        }

        /** Returns the current width of the back buffer. In most cases, this value is in pixels;
         *  however, if the app is running on an HiDPI display with an activated
         *  'supportHighResolutions' setting, you have to multiply with 'backBufferScaleFactor'
         *  for the actual pixel count. Alternatively, use the Context3D-property with the
         *  same name: it will return the exact pixel values. */
        get backBufferWidth(): number { return _backBufferWidth; }

        /** Returns the current height of the back buffer. In most cases, this value is in pixels;
         *  however, if the app is running on an HiDPI display with an activated
         *  'supportHighResolutions' setting, you have to multiply with 'backBufferScaleFactor'
         *  for the actual pixel count. Alternatively, use the Context3D-property with the
         *  same name: it will return the exact pixel values. */
        get backBufferHeight(): number { return _backBufferHeight; }

        /** The number of pixels per point returned by the 'backBufferWidth/Height' properties.
         *  Except for desktop HiDPI displays with an activated 'supportHighResolutions' setting,
         *  this will always return '1'. */
        get backBufferScaleFactor(): number { return _backBufferScaleFactor; }

        /** Indicates if the Context3D object is currently valid (i.e. it hasn't been lost or
         *  disposed). */
        get contextValid(): boolean {
            if (_context) {
                const driverInfo: string = _context.driverInfo;
                return driverInfo != null && driverInfo != "" && driverInfo != "Disposed";
            }
            else return false;
        }

        /** The Context3D profile of the current render context, or <code>null</code>
         *  if the context has not been created yet. */
        get profile(): string {
            if (_context) return _context.profile;
            else return null;
        }

        /** A dictionary that can be used to save custom data related to the render context.
         *  If you need to share data that is bound to the render context (e.g. textures), use
         *  this dictionary instead of creating a static class variable. That way, the data will
         *  be available for all Starling instances that use this stage3D / context. */
        get sharedData(): Dictionary {
            var data: Dictionary = sSharedData[stage3D] as Dictionary;
            if (data == null) {
                data = new Dictionary();
                sSharedData[stage3D] = data;
            }
            return data;
        }

        private get programs(): Dictionary {
            var programs: Dictionary = sharedData[PROGRAM_DATA_NAME] as Dictionary;
            if (programs == null) {
                programs = new Dictionary();
                sharedData[PROGRAM_DATA_NAME] = programs;
            }
            return programs;
        }
    }
}
