module StarlingJS {
    export class DisplayObject extends EventDispatcher {
        // private members

        private _x: number;
        private _y: number;
        private _pivotX: number;
        private _pivotY: number;
        private _scaleX: number;
        private _scaleY: number;
        private _skewX: number;
        private _skewY: number;
        private _rotation: number;
        private _alpha: number;
        private _visible: boolean;
        private _touchable: boolean;
        private _blendMode: string;
        private _name: string = "";
        private _useHandCursor: boolean = false;
        private _transformationMatrix: Matrix | null = null;
        private _transformationMatrix3D: Matrix3D | null = null;
        private _transformationChanged: boolean = false;
        private _is3D: boolean = false;
        private _maskee: DisplayObject | null = null;
        private _maskInverted: boolean = false;

        // internal members (for fast access on rendering)

        _parent: DisplayObjectContainer;
        _lastParentOrSelfChangeFrameID: number;
        _lastChildChangeFrameID: number;
        _tokenFrameID: number;
        _pushToken: BatchToken = new BatchToken();
        _popToken: BatchToken = new BatchToken();
        _hasVisibleArea: boolean;
        _filter: FragmentFilter;
        _mask: DisplayObject;

        // helper objects

        private static sAncestors: Array<DisplayObject> = new Array<DisplayObject>();
        private static sHelperPoint: Point = new Point();
        private static sHelperPoint3D: Vector3D = new Vector3D();
        private static sHelperPointAlt3D: Vector3D = new Vector3D();
        private static sHelperRect: Rectangle = new Rectangle();
        private static sHelperMatrix: Matrix = new Matrix();
        private static sHelperMatrixAlt: Matrix = new Matrix();
        private static sHelperMatrix3D: Matrix3D = new Matrix3D();
        private static sHelperMatrixAlt3D: Matrix3D = new Matrix3D();
        private static sMaskWarningShown: boolean = false;

        /** @private */
        constructor() {
            super();
            // if (Capabilities.isDebugger &&
            //     getQualifiedClassName(this) == "starling.display::DisplayObject") {
            //     throw new AbstractClassError();
            // }

            this._x = this._y = this._pivotX = this._pivotY = this._rotation = this._skewX = this._skewY = 0.0;
            this._scaleX = this._scaleY = this._alpha = 1.0;
            this._visible = this._touchable = this._hasVisibleArea = true;
            this._blendMode = BlendMode.AUTO;
            this._transformationMatrix = new Matrix();
        }

        /** Disposes all resources of the display object. 
          * GPU buffers are released, event listeners are removed, filters and masks are disposed. */
        dispose(): void {
            if (this._filter) this._filter.dispose();
            if (this._mask) this._mask.dispose();
            this.removeEventListeners();
            this.mask = null; // clear 'mask._maskee', just to be sure.
        }

        /** Removes the object from its parent, if it has one, and optionally disposes it. */
        removeFromParent(dispose: boolean = false): void {
            if (this._parent) this._parent.removeChild(this, dispose);
            else if (dispose) this.dispose();
        }

        /** Creates a matrix that represents the transformation from the local coordinate system 
         *  to another. If you pass an <code>out</code>-matrix, the result will be stored in this
         *  matrix instead of creating a new object. */
        getTransformationMatrix(targetSpace: DisplayObject,
            out: Matrix | null = null): Matrix {
            var commonParent: DisplayObject;
            var currentObject: DisplayObject;

            if (out) out.identity();
            else out = new Matrix();

            if (targetSpace == this) {
                return out;
            }
            else if (targetSpace == this._parent || (targetSpace == null && this._parent == null)) {
                out.copyFrom(this.transformationMatrix);
                return out;
            }
            else if (targetSpace == null || targetSpace == base) {
                // targetCoordinateSpace 'null' represents the target space of the base object.
                // -> move up from this to base

                currentObject = this;
                while (currentObject != targetSpace) {
                    out.concat(currentObject.transformationMatrix);
                    currentObject = currentObject._parent as DisplayObject;
                }

                return out;
            }
            else if (targetSpace._parent == this) // optimization
            {
                targetSpace.getTransformationMatrix(this, out);
                out.invert();

                return out;
            }

            // 1. find a common parent of this and the target space

            commonParent = DisplayObject.findCommonParent(this, targetSpace);

            // 2. move up from this to common parent

            currentObject = this;
            while (currentObject != commonParent) {
                out.concat(currentObject.transformationMatrix);
                currentObject = currentObject._parent as DisplayObject;
            }

            if (commonParent == targetSpace)
                return out;

            // 3. now move up from target until we reach the common parent

            DisplayObject.sHelperMatrix.identity();
            currentObject = targetSpace;
            while (currentObject != commonParent) {
                DisplayObject.sHelperMatrix.concat(currentObject.transformationMatrix);
                currentObject = currentObject._parent;
            }

            // 4. now combine the two matrices

            DisplayObject.sHelperMatrix.invert();
            out.concat(DisplayObject.sHelperMatrix);

            return out;
        }

        /** Returns a rectangle that completely encloses the object as it appears in another 
         *  coordinate system. If you pass an <code>out</code>-rectangle, the result will be
         *  stored in this rectangle instead of creating a new object. */
        getBounds(targetSpace: DisplayObject, out: Rectangle | null = null): Rectangle {
            throw new Error();
        }

        /** Returns the object that is found topmost beneath a point in local coordinates, or nil
         *  if the test fails. Untouchable and invisible objects will cause the test to fail. */
        hitTest(localPoint: Point): DisplayObject | null {
            // on a touch test, invisible or untouchable objects cause the test to fail
            if (!this._visible || !this._touchable) return null;

            // if we've got a mask and the hit occurs outside, fail
            if (this._mask && !this.hitTestMask(localPoint)) return null;

            // otherwise, check bounding box
            if (this.getBounds(this, DisplayObject.sHelperRect).containsPoint(localPoint)) return this;
            else return null;
        }

        /** Checks if a certain point is inside the display object's mask. If there is no mask,
         *  this method always returns <code>true</code> (because having no mask is equivalent
         *  to having one that's infinitely big). */
        hitTestMask(localPoint: Point): boolean {
            if (this._mask) {
                if (this._mask.stage) this.getTransformationMatrix(this._mask, DisplayObject.sHelperMatrixAlt);
                else {
                    DisplayObject.sHelperMatrixAlt.copyFrom(this._mask.transformationMatrix);
                    DisplayObject.sHelperMatrixAlt.invert();
                }

                var helperPoint: Point = localPoint == DisplayObject.sHelperPoint ? new Point() : DisplayObject.sHelperPoint;
                MatrixUtil.transformPoint(DisplayObject.sHelperMatrixAlt, localPoint, helperPoint);
                var isMaskHit: boolean = this._mask.hitTest(helperPoint) != null;
                return this._maskInverted ? !isMaskHit : isMaskHit;
            }
            else return true;
        }

        /** Transforms a point from the local coordinate system to global (stage) coordinates.
         *  If you pass an <code>out</code>-point, the result will be stored in this point instead
         *  of creating a new object. */
        localToGlobal(localPoint: Point, out: Point | null = null): Point {
            if (this.is3D) {
                DisplayObject.sHelperPoint3D.setTo(localPoint.x, localPoint.y, 0);
                return this.local3DToGlobal(DisplayObject.sHelperPoint3D, out);
            }
            else {
                this.getTransformationMatrix(this.base, DisplayObject.sHelperMatrixAlt);
                return MatrixUtil.transformPoint(DisplayObject.sHelperMatrixAlt, localPoint, out);
            }
        }

        /** Transforms a point from global (stage) coordinates to the local coordinate system.
         *  If you pass an <code>out</code>-point, the result will be stored in this point instead
         *  of creating a new object. */
        globalToLocal(globalPoint: Point, out?: Point): Point {
            if (this.is3D) {
                this.globalToLocal3D(globalPoint, DisplayObject.sHelperPoint3D);
                this.stage.getCameraPosition(this, DisplayObject.sHelperPointAlt3D);
                return MathUtil.intersectLineWithXYPlane(DisplayObject.sHelperPointAlt3D, DisplayObject.sHelperPoint3D, out);
            }
            else {
                this.getTransformationMatrix(this.base, DisplayObject.sHelperMatrixAlt);
                DisplayObject.sHelperMatrixAlt.invert();
                return MatrixUtil.transformPoint(DisplayObject.sHelperMatrixAlt, globalPoint, out);
            }
        }

        /** Renders the display object with the help of a painter object. Never call this method
         *  directly, except from within another render method.
         *
         *  @param painter Captures the current render state and provides utility functions
         *                 for rendering.
         */
        render(painter: Painter): void {
            throw new Error();
        }

        /** Moves the pivot point to a certain position within the local coordinate system
         *  of the object. If you pass no arguments, it will be centered. */
        alignPivot(horizontalAlign: string = "center",
            verticalAlign: string = "center"): void {
            var bounds: Rectangle = this.getBounds(this, DisplayObject.sHelperRect);

            if (horizontalAlign == Align.LEFT) this.pivotX = bounds.x;
            else if (horizontalAlign == Align.CENTER) this.pivotX = bounds.x + bounds.width / 2.0;
            else if (horizontalAlign == Align.RIGHT) this.pivotX = bounds.x + bounds.width;
            else throw new Error("Invalid horizontal alignment: " + horizontalAlign);

            if (verticalAlign == Align.TOP) this.pivotY = bounds.y;
            else if (verticalAlign == Align.CENTER) this.pivotY = bounds.y + bounds.height / 2.0;
            else if (verticalAlign == Align.BOTTOM) this.pivotY = bounds.y + bounds.height;
            else throw new Error("Invalid vertical alignment: " + verticalAlign);
        }

        /** Draws the object into a BitmapData object.
         *
         *  <p>This is achieved by drawing the object into the back buffer and then copying the
         *  pixels of the back buffer into a texture. Beware: image sizes bigger than the back
         *  buffer are only supported in AIR version 25 or higher and NOT in Flash Player.</p>
         *
         *  @param out   If you pass null, the object will be created for you.
         *               If you pass a BitmapData object, it should have the size of the
         *               object bounds, multiplied by the current contentScaleFactor.
         *  @param color The RGB color value with which the bitmap will be initialized.
         *  @param alpha The alpha value with which the bitmap will be initialized.
         */
        drawToBitmapData(out: BitmapData = null,
            color: number = 0x0, alpha: number = 0.0): BitmapData {
            var painter: Painter = Starling.painter;
            var stage: Stage = Starling.current.stage;
            var viewPort: Rectangle = Starling.current.viewPort;
            var stageWidth: number = stage.stageWidth;
            var stageHeight: number = stage.stageHeight;
            var scaleX: number = viewPort.width / stageWidth;
            var scaleY: number = viewPort.height / stageHeight;
            var backBufferScale: number = painter.backBufferScaleFactor;
            var totalScaleX: number = scaleX * backBufferScale;
            var totalScaleY: number = scaleY * backBufferScale;
            var projectionX: number, projectionY: number;
            var bounds: Rectangle;

            if (this instanceof Stage) {
                projectionX = viewPort.x < 0 ? -viewPort.x / scaleX : 0.0;
                projectionY = viewPort.y < 0 ? -viewPort.y / scaleY : 0.0;

                out = out || new BitmapData(painter.backBufferWidth * backBufferScale,
                    painter.backBufferHeight * backBufferScale);
            }
            else {
                bounds = this.getBounds(this._parent, DisplayObject.sHelperRect);
                projectionX = bounds.x;
                projectionY = bounds.y;

                out = out || new BitmapData(Math.ceil(bounds.width * totalScaleX),
                    Math.ceil(bounds.height * totalScaleY));
            }

            color = Color.multiply(color, alpha); // premultiply alpha

            painter.pushState();
            painter.setupContextDefaults();
            painter.state.renderTarget = null;
            painter.state.setModelviewMatricesToIdentity();
            painter.setStateTo(this.transformationMatrix);

            // Images that are bigger than the current back buffer are drawn in multiple steps.

            var stepX: number;
            var stepY: number = projectionY;
            var stepWidth: number = painter.backBufferWidth / scaleX;
            var stepHeight: number = painter.backBufferHeight / scaleY;
            var positionInBitmap: Point = Pool.getPoint(0, 0);
            var boundsInBuffer: Rectangle = Pool.getRectangle(0, 0,
                painter.backBufferWidth * backBufferScale,
                painter.backBufferHeight * backBufferScale);

            while (positionInBitmap.y < out.height) {
                stepX = projectionX;
                positionInBitmap.x = 0;

                while (positionInBitmap.x < out.width) {
                    painter.clear(color, alpha);
                    painter.state.setProjectionMatrix(stepX, stepY, stepWidth, stepHeight,
                        stageWidth, stageHeight, stage.cameraPosition);

                    if (this._mask) painter.drawMask(this.mask, this);

                    if (this._filter) this._filter.render(painter);
                    else this.render(painter);

                    if (this._mask) painter.eraseMask(this.mask, this);

                    painter.finishMeshBatch();
                    execute(painter.context.drawToBitmapData, out, boundsInBuffer, positionInBitmap);

                    stepX += stepWidth;
                    positionInBitmap.x += stepWidth * totalScaleX;
                }

                stepY += stepHeight;
                positionInBitmap.y += stepHeight * totalScaleY;
            }

            painter.popState();

            Pool.putRectangle(boundsInBuffer);
            Pool.putPoint(positionInBitmap);

            return out;
        }

        // 3D transformation

        /** Creates a matrix that represents the transformation from the local coordinate system
         *  to another. This method supports three dimensional objects created via 'Sprite3D'.
         *  If you pass an <code>out</code>-matrix, the result will be stored in this matrix
         *  instead of creating a new object. */
        getTransformationMatrix3D(targetSpace: DisplayObject, out?: Matrix3D): Matrix3D {
            var commonParent: DisplayObject;
            var currentObject: DisplayObject;

            if (out) out.identity();
            else out = new Matrix3D();

            if (targetSpace == this) {
                return out;
            }
            else if (targetSpace == _parent || (targetSpace == null && _parent == null)) {
                out.copyFrom(transformationMatrix3D);
                return out;
            }
            else if (targetSpace == null || targetSpace == base) {
                // targetCoordinateSpace 'null' represents the target space of the base object.
                // -> move up from this to base

                currentObject = this;
                while (currentObject != targetSpace) {
                    out.append(currentObject.transformationMatrix3D);
                    currentObject = currentObject._parent;
                }

                return out;
            }
            else if (targetSpace._parent == this) // optimization
            {
                targetSpace.getTransformationMatrix3D(this, out);
                out.invert();

                return out;
            }

            // 1. find a common parent of this and the target space

            commonParent = findCommonParent(this, targetSpace);

            // 2. move up from this to common parent

            currentObject = this;
            while (currentObject != commonParent) {
                out.append(currentObject.transformationMatrix3D);
                currentObject = currentObject._parent;
            }

            if (commonParent == targetSpace)
                return out;

            // 3. now move up from target until we reach the common parent

            DisplayObject.sHelperMatrix3D.identity();
            currentObject = targetSpace;
            while (currentObject != commonParent) {
                DisplayObject.sHelperMatrix3D.append(currentObject.transformationMatrix3D);
                currentObject = currentObject._parent;
            }

            // 4. now combine the two matrices

            DisplayObject.sHelperMatrix3D.invert();
            out.append(sHelperMatrix3D);

            return out;
        }

        /** Transforms a 3D point from the local coordinate system to global (stage) coordinates.
         *  This is achieved by projecting the 3D point onto the (2D) view plane.
         *
         *  <p>If you pass an <code>out</code>-point, the result will be stored in this point
         *  instead of creating a new object.</p> */
        local3DToGlobal(localPoint: Vector3D, out: Point = null): Point {
            var stage: Stage = this.stage;
            if (stage == null) throw new Error("Object not connected to stage");

            this.getTransformationMatrix3D(stage, DisplayObject.sHelperMatrixAlt3D);
            MatrixUtil.transformPoint3D(DisplayObject.sHelperMatrixAlt3D, localPoint, DisplayObject.sHelperPoint3D);
            return MathUtil.intersectLineWithXYPlane(stage.cameraPosition, DisplayObject.sHelperPoint3D, out);
        }

        /** Transforms a point from global (stage) coordinates to the 3D local coordinate system.
         *  If you pass an <code>out</code>-vector, the result will be stored in this vector
         *  instead of creating a new object. */
        globalToLocal3D(globalPoint: Point, out: Vector3D = null): Vector3D {
            var stage: Stage = this.stage;
            if (stage == null) throw new Error("Object not connected to stage");

            this.getTransformationMatrix3D(stage, DisplayObject.sHelperMatrixAlt3D);
            DisplayObject.sHelperMatrixAlt3D.invert();
            return MatrixUtil.transformCoords3D(
                DisplayObject.sHelperMatrixAlt3D, globalPoint.x, globalPoint.y, 0, out);
        }

        // internal methods

        /** @private */
        setParent(value: DisplayObjectContainer): void {
            // check for a recursion
            var ancestor: DisplayObject = value;
            while (ancestor != this && ancestor != null)
                ancestor = ancestor._parent;

            if (ancestor == this)
                throw new Error("An object cannot be added as a child to itself or one " +
                    "of its children (or children's children, etc.)");
            else
                this._parent = value;
        }

        /** @private */
        setIs3D(value: boolean): void {
            this._is3D = value;
        }

        /** @private */
        get isMask(): boolean {
            return this._maskee != null;
        }

        // render cache

        /** Forces the object to be redrawn in the next frame.
         *  This will prevent the object to be drawn from the render cache.
         *
         *  <p>This method is called every time the object changes in any way. When creating
         *  custom mesh styles or any other custom rendering code, call this method if the object
         *  needs to be redrawn.</p>
         *
         *  <p>If the object needs to be redrawn just because it does not support the render cache,
         *  call <code>painter.excludeFromCache()</code> in the object's render method instead.
         *  That way, Starling's <code>skipUnchangedFrames</code> policy won't be disrupted.</p>
         */
        setRequiresRedraw() {
            var parent: DisplayObject = this._parent || this._maskee;
            var frameID: number = Starling.frameID;

            this._lastParentOrSelfChangeFrameID = frameID;
            this._hasVisibleArea = this._alpha != 0.0 && this._visible && this._maskee == null &&
                this._scaleX != 0.0 && this._scaleY != 0.0;

            while (parent && parent._lastChildChangeFrameID != frameID) {
                parent._lastChildChangeFrameID = frameID;
                parent = parent._parent || parent._maskee;
            }
        }

        /** Indicates if the object needs to be redrawn in the upcoming frame, i.e. if it has
         *  changed its location relative to the stage or some other aspect of its appearance
         *  since it was last rendered. */
        get requiresRedraw(): boolean {
            var frameID: number = Starling.frameID;

            return this._lastParentOrSelfChangeFrameID == frameID ||
                this._lastChildChangeFrameID == frameID;
        }

        /** @private Makes sure the object is not drawn from cache in the next frame.
         *  This method is meant to be called only from <code>Painter.finishFrame()</code>,
         *  since it requires rendering to be concluded. */
        excludeFromCache() {
            var object: DisplayObject = this;
            var max: number = 0xffffffff;

            while (object && object._tokenFrameID != max) {
                object._tokenFrameID = max;
                object = object._parent;
            }
        }

        // helpers

        /** @private */
        setTransformationChanged() {
            this._transformationChanged = true;
            this.setRequiresRedraw();
        }

        /** @private */
        updateTransformationMatrices(
            x: number, y: number, pivotX: number, pivotY: number, scaleX: number, scaleY: number,
            skewX: number, skewY: number, rotation: number, out: Matrix, out3D: Matrix3D): void {
            if (skewX == 0.0 && skewY == 0.0) {
                // optimization: no skewing / rotation simplifies the matrix math

                if (rotation == 0.0) {
                    out.setTo(scaleX, 0.0, 0.0, scaleY,
                        x - pivotX * scaleX, y - pivotY * scaleY);
                }
                else {
                    var cos: number = Math.cos(rotation);
                    var sin: number = Math.sin(rotation);
                    var a: number = scaleX * cos;
                    var b: number = scaleX * sin;
                    var c: number = scaleY * -sin;
                    var d: number = scaleY * cos;
                    var tx: number = x - pivotX * a - pivotY * c;
                    var ty: number = y - pivotX * b - pivotY * d;

                    out.setTo(a, b, c, d, tx, ty);
                }
            }
            else {
                out.identity();
                out.scale(scaleX, scaleY);
                MatrixUtil.skew(out, skewX, skewY);
                out.rotate(rotation);
                out.translate(x, y);

                if (pivotX != 0.0 || pivotY != 0.0) {
                    // prepend pivot transformation
                    out.tx = x - out.a * pivotX - out.c * pivotY;
                    out.ty = y - out.b * pivotX - out.d * pivotY;
                }
            }

            if (out3D) MatrixUtil.convertTo3D(out, out3D);
        }

        private static findCommonParent(object1: DisplayObject,
            object2: DisplayObject): DisplayObject {
            var currentObject: DisplayObject = object1;

            while (currentObject) {
                DisplayObject.sAncestors[DisplayObject.sAncestors.length] = currentObject; // avoiding 'push'
                currentObject = currentObject._parent;
            }

            currentObject = object2;
            while (currentObject && DisplayObject.sAncestors.indexOf(currentObject) == -1)
                currentObject = currentObject._parent;

            DisplayObject.sAncestors.length = 0;

            if (currentObject) return currentObject;
            else throw new Error("Object not connected to target");
        }

        // stage event handling

        /** @private */
        dispatchEvent(event: Event) {
            if (event.type == Event.REMOVED_FROM_STAGE && this.stage == null)
                return; // special check to avoid double-dispatch of RfS-event.
            else
                super.dispatchEvent(event);
        }

        // enter frame event optimization

        // To avoid looping through the complete display tree each frame to find out who's
        // listening to ENTER_FRAME events, we manage a list of them manually in the Stage class.
        // We need to take care that (a) it must be dispatched only when the object is
        // part of the stage, (b) it must not cause memory leaks when the user forgets to call
        // dispose and (c) there might be multiple listeners for this event.

        /** @inheritDoc */
        addEventListener(type: string, listener: Function): void {
            if (type == Event.ENTER_FRAME && !this.hasEventListener(type)) {
                addEventListener(Event.ADDED_TO_STAGE, this.addEnterFrameListenerToStage);
                addEventListener(Event.REMOVED_FROM_STAGE, this.removeEnterFrameListenerFromStage);
                if (this.stage) this.addEnterFrameListenerToStage();
            }

            super.addEventListener(type, listener);
        }

        /** @inheritDoc */
        removeEventListener(type: string, listener: Function): void {
            super.removeEventListener(type, listener);

            if (type == Event.ENTER_FRAME && !this.hasEventListener(type)) {
                removeEventListener(Event.ADDED_TO_STAGE, this.addEnterFrameListenerToStage);
                removeEventListener(Event.REMOVED_FROM_STAGE, this.removeEnterFrameListenerFromStage);
                this.removeEnterFrameListenerFromStage();
            }
        }

        /** @inheritDoc */
        removeEventListeners(type: string = null): void {
            if ((type == null || type == Event.ENTER_FRAME) && this.hasEventListener(Event.ENTER_FRAME)) {
                removeEventListener(Event.ADDED_TO_STAGE, this.addEnterFrameListenerToStage);
                removeEventListener(Event.REMOVED_FROM_STAGE, this.removeEnterFrameListenerFromStage);
                this.removeEnterFrameListenerFromStage();
            }

            super.removeEventListeners(type);
        }

        private addEnterFrameListenerToStage() {
            Starling.current.stage.addEnterFrameListener(this);
        }

        private removeEnterFrameListenerFromStage() {
            Starling.current.stage.removeEnterFrameListener(this);
        }

        // properties

        /** The transformation matrix of the object relative to its parent.
         * 
         *  <p>If you assign a custom transformation matrix, Starling will try to figure out  
         *  suitable values for <code>x, y, scaleX, scaleY,</code> and <code>rotation</code>.
         *  However, if the matrix was created in a different way, this might not be possible. 
         *  In that case, Starling will apply the matrix, but not update the corresponding 
         *  properties.</p>
         * 
         *  <p>CAUTION: not a copy, but the actual object!</p> */
        get transformationMatrix(): Matrix {
            if (this._transformationChanged) {
                this._transformationChanged = false;

                if (this._transformationMatrix3D == null && this._is3D)
                    this._transformationMatrix3D = new Matrix3D();

                this.updateTransformationMatrices(
                    this._x, this._y, this._pivotX, this._pivotY, this._scaleX, this._scaleY, this._skewX, this._skewY, this._rotation,
                    this._transformationMatrix, this._transformationMatrix3D);
            }

            return this._transformationMatrix;
        }

        set transformationMatrix(matrix: Matrix) {
            const PI_Q: number = Math.PI / 4.0;

            this.setRequiresRedraw();
            this._transformationChanged = false;
            this._transformationMatrix.copyFrom(matrix);
            this._pivotX = this._pivotY = 0;

            this._x = matrix.tx;
            this._y = matrix.ty;

            this._skewX = Math.atan(-matrix.c / matrix.d);
            this._skewY = Math.atan(matrix.b / matrix.a);

            // NaN check ("isNaN" causes allocation)
            if (this._skewX != this._skewX) this._skewX = 0.0;
            if (this._skewY != this._skewY) this._skewY = 0.0;

            this._scaleY = (this._skewX > -PI_Q && this._skewX < PI_Q) ? matrix.d / Math.cos(this._skewX)
                : -matrix.c / Math.sin(this._skewX);
            this._scaleX = (this._skewY > -PI_Q && this._skewY < PI_Q) ? matrix.a / Math.cos(this._skewY)
                : matrix.b / Math.sin(this._skewY);

            if (MathUtil.isEquivalent(this._skewX, this._skewY)) {
                this._rotation = this._skewX;
                this._skewX = this._skewY = 0;
            }
            else {
                this._rotation = 0;
            }
        }

        /** The 3D transformation matrix of the object relative to its parent.
         *
         *  <p>For 2D objects, this property returns just a 3D version of the 2D transformation
         *  matrix. Only the 'Sprite3D' class supports real 3D transformations.</p>
         *
         *  <p>CAUTION: not a copy, but the actual object!</p> */
        get transformationMatrix3D(): Matrix3D {
            if (this._transformationMatrix3D == null)
                this._transformationMatrix3D = MatrixUtil.convertTo3D(this._transformationMatrix);

            if (this._transformationChanged) {
                this._transformationChanged = false;
                this.updateTransformationMatrices(
                    this._x, this._y, this._pivotX, this._pivotY, this._scaleX, this._scaleY, this._skewX, this._skewY, this._rotation,
                    this._transformationMatrix, this._transformationMatrix3D);
            }

            return this._transformationMatrix3D;
        }

        /** Indicates if this object or any of its parents is a 'Sprite3D' object. */
        get is3D(): boolean { return this._is3D; }

        /** Indicates if the mouse cursor should transform into a hand while it's over the sprite.
         *  @default false */
        get useHandCursor(): boolean { return this._useHandCursor; }
        set useHandCursor(value: boolean) {
            if (value == this._useHandCursor) return;
            this._useHandCursor = value;

            if (this._useHandCursor)
                addEventListener(TouchEvent.TOUCH, onTouch);
            else
                removeEventListener(TouchEvent.TOUCH, onTouch);
        }

        private onTouch(event: TouchEvent): void {
            Mouse.cursor = event.interactsWith(this) ? MouseCursor.BUTTON : MouseCursor.AUTO;
        }

        /** The bounds of the object relative to the local coordinates of the parent. */
        get bounds(): Rectangle {
            return this.getBounds(this._parent);
        }

        /** The width of the object in pixels.
         *  Note that for objects in a 3D space (connected to a Sprite3D), this value might not
         *  be accurate until the object is part of the display list. */
        get width(): number { return this.getBounds(this._parent, DisplayObject.sHelperRect).width; }
        set width(value: number) {
            // this method calls 'this.scaleX' instead of changing _scaleX directly.
            // that way, subclasses reacting on size changes need to override only the scaleX method.

            var actualWidth: number;
            var scaleIsNaN: boolean = this._scaleX != this._scaleX; // avoid 'isNaN' call
            var scaleIsZero: boolean = this._scaleX < 1e-8 && this._scaleX > -1e-8;

            if (scaleIsZero || scaleIsNaN) { this.scaleX = 1.0; actualWidth = this.width; }
            else actualWidth = Math.abs(this.width / this._scaleX);

            if (actualWidth) this.scaleX = value / actualWidth;
        }

        /** The height of the object in pixels.
         *  Note that for objects in a 3D space (connected to a Sprite3D), this value might not
         *  be accurate until the object is part of the display list. */
        get height(): number { return this.getBounds(this._parent, DisplayObject.sHelperRect).height; }
        set height(value: number) {
            var actualHeight: number;
            var scaleIsNaN: boolean = this._scaleY != this._scaleY; // avoid 'isNaN' call
            var scaleIsZero: boolean = this._scaleY < 1e-8 && this._scaleY > -1e-8;

            if (scaleIsZero || scaleIsNaN) { this.scaleY = 1.0; actualHeight = this.height; }
            else actualHeight = Math.abs(this.height / this._scaleY);

            if (actualHeight) this.scaleY = value / actualHeight;
        }

        /** The x coordinate of the object relative to the local coordinates of the parent. */
        get x(): number { return this._x; }
        set x(value: number) {
            if (this._x != value) {
                this._x = value;
                this.setTransformationChanged();
            }
        }

        /** The y coordinate of the object relative to the local coordinates of the parent. */
        get y(): number { return this._y; }
        set y(value: number) {
            if (this._y != value) {
                this._y = value;
                this.setTransformationChanged();
            }
        }

        /** The x coordinate of the object's origin in its own coordinate space (default: 0). */
        get pivotX(): number { return this._pivotX; }
        set pivotX(value: number) {
            if (this._pivotX != value) {
                this._pivotX = value;
                this.setTransformationChanged();
            }
        }

        /** The y coordinate of the object's origin in its own coordinate space (default: 0). */
        get pivotY(): number { return this._pivotY; }
        set pivotY(value: number) {
            if (this._pivotY != value) {
                this._pivotY = value;
                this.setTransformationChanged();
            }
        }

        /** The horizontal scale factor. '1' means no scale, negative values flip the object.
         *  @default 1 */
        get scaleX(): number { return this._scaleX; }
        set scaleX(value: number) {
            if (this._scaleX != value) {
                this._scaleX = value;
                this.setTransformationChanged();
            }
        }

        /** The vertical scale factor. '1' means no scale, negative values flip the object.
         *  @default 1 */
        get scaleY(): number { return this._scaleY; }
        set scaleY(value: number) {
            if (this._scaleY != value) {
                this._scaleY = value;
                this.setTransformationChanged();
            }
        }

        /** Sets both 'scaleX' and 'scaleY' to the same value. The getter simply returns the
         *  value of 'scaleX' (even if the scaling values are different). @default 1 */
        get scale(): number { return this.scaleX; }
        set scale(value: number) { this.scaleX = this.scaleY = value; }

        /** The horizontal skew angle in radians. */
        get skewX(): number { return this._skewX; }
        set skewX(value: number) {
            value = MathUtil.normalizeAngle(value);

            if (this._skewX != value) {
                this._skewX = value;
                this.setTransformationChanged();
            }
        }

        /** The vertical skew angle in radians. */
        get skewY(): number { return this._skewY; }
        set skewY(value: number) {
            value = MathUtil.normalizeAngle(value);

            if (this._skewY != value) {
                this._skewY = value;
                this.setTransformationChanged();
            }
        }

        /** The rotation of the object in radians. (In Starling, all angles are measured 
         *  in radians.) */
        get rotation(): number { return this._rotation; }
        set rotation(value: number) {
            value = MathUtil.normalizeAngle(value);

            if (this._rotation != value) {
                this._rotation = value;
                this.setTransformationChanged();
            }
        }

        /** @private Indicates if the object is rotated or skewed in any way. */
        get isRotated(): boolean {
            return this._rotation != 0.0 || this._skewX != 0.0 || this._skewY != 0.0;
        }

        /** The opacity of the object. 0 = transparent, 1 = opaque. @default 1 */
        get alpha(): number { return this._alpha; }
        set alpha(value: number) {
            if (value != this._alpha) {
                this._alpha = value < 0.0 ? 0.0 : (value > 1.0 ? 1.0 : value);
                this.setRequiresRedraw();
            }
        }

        /** The visibility of the object. An invisible object will be untouchable. */
        get visible(): boolean { return this._visible; }
        set visible(value: boolean) {
            if (value != this._visible) {
                this._visible = value;
                this.setRequiresRedraw();
            }
        }

        /** Indicates if this object (and its children) will receive touch events. */
        get touchable(): boolean { return this._touchable; }
        set touchable(value: boolean) { this._touchable = value; }

        /** The blend mode determines how the object is blended with the objects underneath. 
         *   @default auto
         *   @see starling.display.BlendMode */
        get blendMode(): string { return this._blendMode; }
        set blendMode(value: string) {
            if (value != this._blendMode) {
                this._blendMode = value;
                this.setRequiresRedraw();
            }
        }

        /** The name of the display object (default: null). Used by 'getChildByName()' of 
         *  display object containers. */
        get name(): string { return this._name; }
        set name(value: string) { this._name = value; }

        /** The filter that is attached to the display object. The <code>starling.filters</code>
         *  package contains several classes that define specific filters you can use. To combine
         *  several filters, assign an instance of the <code>FilterChain</code> class; to remove
         *  all filters, assign <code>null</code>.
         *
         *  <p>Beware that a filter instance may only be used on one object at a time! Furthermore,
         *  when you remove or replace a filter, it is NOT disposed automatically (since you might
         *  want to reuse it on a different object).</p>
         *
         *  @default null
         *  @see starling.filters.FragmentFilter
         *  @see starling.filters.FilterChain
         */
        get filter(): FragmentFilter { return this._filter; }
        set filter(value: FragmentFilter) {
            if (value != this._filter) {
                if (this._filter) this._filter.setTarget(null);
                if (value) value.setTarget(this);

                this._filter = value;
                this.setRequiresRedraw();
            }
        }

        /** The display object that acts as a mask for the current object.
         *  Assign <code>null</code> to remove it.
         *
         *  <p>A pixel of the masked display object will only be drawn if it is within one of the
         *  mask's polygons. Texture pixels and alpha values of the mask are not taken into
         *  account. The mask object itself is never visible.</p>
         *
         *  <p>If the mask is part of the display list, masking will occur at exactly the
         *  location it occupies on the stage. If it is not, the mask will be placed in the local
         *  coordinate system of the target object (as if it was one of its children).</p>
         *
         *  <p>For rectangular masks, you can use simple quads; for other forms (like circles
         *  or arbitrary shapes) it is recommended to use a 'Canvas' instance.</p>
         *
         *  <p><strong>Note:</strong> a mask will typically cause at least two additional draw
         *  calls: one to draw the mask to the stencil buffer and one to erase it. However, if the
         *  mask object is an instance of <code>starling.display.Quad</code> and is aligned
         *  parallel to the stage axes, rendering will be optimized: instead of using the
         *  stencil buffer, the object will be clipped using the scissor rectangle. That's
         *  faster and reduces the number of draw calls, so make use of this when possible.</p>
         *
         *  <p><strong>Note:</strong> AIR apps require the <code>depthAndStencil</code> node
         *  in the application descriptor XMLs to be enabled! Otherwise, stencil masking won't
         *  work.</p>
         *
         *  @see Canvas
         *  @default null
         */
        get mask(): DisplayObject { return this._mask; }
        set mask(value: DisplayObject) {
            if (this._mask != value) {
                if (!DisplayObject.sMaskWarningShown) {
                    if (!SystemUtil.supportsDepthAndStencil)
                        console.log("[Starling] Full mask support requires 'depthAndStencil'" +
                            " to be enabled in the application descriptor.");

                    DisplayObject.sMaskWarningShown = true;
                }

                if (this._mask) this._mask._maskee = null;
                if (value) {
                    value._maskee = this;
                    value._hasVisibleArea = false;
                }

                this._mask = value;
                this.setRequiresRedraw();
            }
        }

        /** Indicates if the masked region of this object is set to be inverted.*/
        get maskInverted(): boolean { return this._maskInverted; }
        set maskInverted(value: boolean): void { this._maskInverted = value; }

        /** The display object container that contains this display object. */
        get parent(): DisplayObjectContainer { return this._parent; }

        /** The topmost object in the display tree the object is part of. */
        get base(): DisplayObject {
            var currentObject: DisplayObject = this;
            while (currentObject._parent) currentObject = currentObject._parent;
            return currentObject;
        }

        /** The root object the display object is connected to (i.e. an instance of the class 
         *  that was passed to the Starling constructor), or null if the object is not connected
         *  to the stage. */
        get root(): DisplayObject {
            var currentObject: DisplayObject = this;
            while (currentObject._parent) {
                if (currentObject._parent instanceof Stage) return currentObject;
                else currentObject = currentObject.parent;
            }

            return null;
        }

        /** The stage the display object is connected to, or null if it is not connected 
         *  to the stage. */
        get stage(): Stage { return this.base as Stage; }
    }
}