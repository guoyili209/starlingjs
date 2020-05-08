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
        private _name: string="";
        private _useHandCursor: boolean=false;
        private _transformationMatrix: Matrix|null=null;
        private _transformationMatrix3D: Matrix3D|null=null;
        private _transformationChanged: boolean=false;
        private _is3D: boolean=false;
        private _maskee: DisplayObject|null=null;
        private _maskInverted: boolean = false;

        // internal members (for fast access on rendering)

        /** @private */ private _parent: DisplayObjectContainer;
        /** @private */ private _lastParentOrSelfChangeFrameID: uint;
        /** @private */ private _lastChildChangeFrameID: uint;
        /** @private */ private _tokenFrameID: uint;
        /** @private */ private _pushToken: BatchToken = new BatchToken();
        /** @private */ private _popToken: BatchToken = new BatchToken();
        /** @private */ private _hasVisibleArea: boolean;
        /** @private */ private _filter: FragmentFilter;
        /** @private */ private _mask: DisplayObject;

        // helper objects

        private static sAncestors: Vector.<DisplayObject> = new < DisplayObject > [];
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
            _transformationMatrix = new Matrix();
        }

        /** Disposes all resources of the display object. 
          * GPU buffers are released, event listeners are removed, filters and masks are disposed. */
        dispose(): void {
            if (_filter) _filter.dispose();
            if (_mask) _mask.dispose();
            removeEventListeners();
            mask = null; // clear 'mask._maskee', just to be sure.
        }

        /** Removes the object from its parent, if it has one, and optionally disposes it. */
        removeFromParent(dispose: boolean = false): void {
            if (_parent) _parent.removeChild(this, dispose);
            else if (dispose) this.dispose();
        }

        /** Creates a matrix that represents the transformation from the local coordinate system 
         *  to another. If you pass an <code>out</code>-matrix, the result will be stored in this
         *  matrix instead of creating a new object. */
        getTransformationMatrix(targetSpace: DisplayObject,
            out: Matrix = null): Matrix {
            var commonParent: DisplayObject;
            var currentObject: DisplayObject;

            if (out) out.identity();
            else out = new Matrix();

            if (targetSpace == this) {
                return out;
            }
            else if (targetSpace == _parent || (targetSpace == null && _parent == null)) {
                out.copyFrom(transformationMatrix);
                return out;
            }
            else if (targetSpace == null || targetSpace == base) {
                // targetCoordinateSpace 'null' represents the target space of the base object.
                // -> move up from this to base

                currentObject = this;
                while (currentObject != targetSpace) {
                    out.concat(currentObject.transformationMatrix);
                    currentObject = currentObject._parent;
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

            commonParent = findCommonParent(this, targetSpace);

            // 2. move up from this to common parent

            currentObject = this;
            while (currentObject != commonParent) {
                out.concat(currentObject.transformationMatrix);
                currentObject = currentObject._parent;
            }

            if (commonParent == targetSpace)
                return out;

            // 3. now move up from target until we reach the common parent

            sHelperMatrix.identity();
            currentObject = targetSpace;
            while (currentObject != commonParent) {
                sHelperMatrix.concat(currentObject.transformationMatrix);
                currentObject = currentObject._parent;
            }

            // 4. now combine the two matrices

            sHelperMatrix.invert();
            out.concat(sHelperMatrix);

            return out;
        }

        /** Returns a rectangle that completely encloses the object as it appears in another 
         *  coordinate system. If you pass an <code>out</code>-rectangle, the result will be
         *  stored in this rectangle instead of creating a new object. */
        getBounds(targetSpace: DisplayObject, out: Rectangle = null): Rectangle {
            throw new AbstractMethodError();
        }

        /** Returns the object that is found topmost beneath a point in local coordinates, or nil
         *  if the test fails. Untouchable and invisible objects will cause the test to fail. */
        hitTest(localPoint: Point): DisplayObject {
            // on a touch test, invisible or untouchable objects cause the test to fail
            if (!_visible || !_touchable) return null;

            // if we've got a mask and the hit occurs outside, fail
            if (_mask && !hitTestMask(localPoint)) return null;

            // otherwise, check bounding box
            if (getBounds(this, sHelperRect).containsPoint(localPoint)) return this;
            else return null;
        }

        /** Checks if a certain point is inside the display object's mask. If there is no mask,
         *  this method always returns <code>true</code> (because having no mask is equivalent
         *  to having one that's infinitely big). */
        hitTestMask(localPoint: Point): boolean {
            if (_mask) {
                if (_mask.stage) getTransformationMatrix(_mask, sHelperMatrixAlt);
                else {
                    sHelperMatrixAlt.copyFrom(_mask.transformationMatrix);
                    sHelperMatrixAlt.invert();
                }

                var helperPoint: Point = localPoint == sHelperPoint ? new Point() : sHelperPoint;
                MatrixUtil.transformPoint(sHelperMatrixAlt, localPoint, helperPoint);
                var isMaskHit: boolean = _mask.hitTest(helperPoint) != null;
                return _maskInverted ? !isMaskHit : isMaskHit;
            }
            else return true;
        }

        /** Transforms a point from the local coordinate system to global (stage) coordinates.
         *  If you pass an <code>out</code>-point, the result will be stored in this point instead
         *  of creating a new object. */
        localToGlobal(localPoint: Point, out: Point = null): Point {
            if (is3D) {
                sHelperPoint3D.setTo(localPoint.x, localPoint.y, 0);
                return local3DToGlobal(sHelperPoint3D, out);
            }
            else {
                getTransformationMatrix(base, sHelperMatrixAlt);
                return MatrixUtil.transformPoint(sHelperMatrixAlt, localPoint, out);
            }
        }

        /** Transforms a point from global (stage) coordinates to the local coordinate system.
         *  If you pass an <code>out</code>-point, the result will be stored in this point instead
         *  of creating a new object. */
        globalToLocal(globalPoint: Point, out: Point = null): Point {
            if (is3D) {
                globalToLocal3D(globalPoint, sHelperPoint3D);
                stage.getCameraPosition(this, sHelperPointAlt3D);
                return MathUtil.intersectLineWithXYPlane(sHelperPointAlt3D, sHelperPoint3D, out);
            }
            else {
                getTransformationMatrix(base, sHelperMatrixAlt);
                sHelperMatrixAlt.invert();
                return MatrixUtil.transformPoint(sHelperMatrixAlt, globalPoint, out);
            }
        }

        /** Renders the display object with the help of a painter object. Never call this method
         *  directly, except from within another render method.
         *
         *  @param painter Captures the current render state and provides utility functions
         *                 for rendering.
         */
        render(painter: Painter): void {
            throw new AbstractMethodError();
        }

        /** Moves the pivot point to a certain position within the local coordinate system
         *  of the object. If you pass no arguments, it will be centered. */
        alignPivot(horizontalAlign: string = "center",
            verticalAlign: string = "center"): void {
            var bounds: Rectangle = getBounds(this, sHelperRect);

            if (horizontalAlign == Align.LEFT) pivotX = bounds.x;
            else if (horizontalAlign == Align.CENTER) pivotX = bounds.x + bounds.width / 2.0;
            else if (horizontalAlign == Align.RIGHT) pivotX = bounds.x + bounds.width;
            else throw new ArgumentError("Invalid horizontal alignment: " + horizontalAlign);

            if (verticalAlign == Align.TOP) pivotY = bounds.y;
            else if (verticalAlign == Align.CENTER) pivotY = bounds.y + bounds.height / 2.0;
            else if (verticalAlign == Align.BOTTOM) pivotY = bounds.y + bounds.height;
            else throw new ArgumentError("Invalid vertical alignment: " + verticalAlign);
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
            color: uint = 0x0, alpha: number = 0.0): BitmapData {
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

            if (this is Stage)
            {
                projectionX = viewPort.x < 0 ? -viewPort.x / scaleX : 0.0;
                projectionY = viewPort.y < 0 ? -viewPort.y / scaleY : 0.0;

                out ||= new BitmapData(painter.backBufferWidth * backBufferScale,
                    painter.backBufferHeight * backBufferScale);
            }
            else
        {
        bounds = getBounds(_parent, sHelperRect);
        projectionX = bounds.x;
        projectionY = bounds.y;

        out ||= new BitmapData(Math.ceil(bounds.width * totalScaleX),
            Math.ceil(bounds.height * totalScaleY));
    }

    color = Color.multiply(color, alpha); // premultiply alpha

    painter.pushState();
    painter.setupContextDefaults();
    painter.state.renderTarget = null;
    painter.state.setModelviewMatricesToIdentity();
    painter.setStateTo(transformationMatrix);

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

            if (_mask) painter.drawMask(mask, this);

            if (_filter) _filter.render(painter);
            else render(painter);

            if (_mask) painter.eraseMask(mask, this);

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
getTransformationMatrix3D(targetSpace: DisplayObject,
    out: Matrix3D = null): Matrix3D {
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

    sHelperMatrix3D.identity();
    currentObject = targetSpace;
    while (currentObject != commonParent) {
        sHelperMatrix3D.append(currentObject.transformationMatrix3D);
        currentObject = currentObject._parent;
    }

    // 4. now combine the two matrices

    sHelperMatrix3D.invert();
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
    if (stage == null) throw new IllegalOperationError("Object not connected to stage");

    getTransformationMatrix3D(stage, sHelperMatrixAlt3D);
    MatrixUtil.transformPoint3D(sHelperMatrixAlt3D, localPoint, sHelperPoint3D);
    return MathUtil.intersectLineWithXYPlane(stage.cameraPosition, sHelperPoint3D, out);
}

/** Transforms a point from global (stage) coordinates to the 3D local coordinate system.
 *  If you pass an <code>out</code>-vector, the result will be stored in this vector
 *  instead of creating a new object. */
globalToLocal3D(globalPoint: Point, out: Vector3D = null): Vector3D {
    var stage: Stage = this.stage;
    if (stage == null) throw new IllegalOperationError("Object not connected to stage");

    getTransformationMatrix3D(stage, sHelperMatrixAlt3D);
    sHelperMatrixAlt3D.invert();
    return MatrixUtil.transformCoords3D(
        sHelperMatrixAlt3D, globalPoint.x, globalPoint.y, 0, out);
}

// internal methods

/** @private */
starling_internal function setParent(value: DisplayObjectContainer): void {
    // check for a recursion
    var ancestor: DisplayObject = value;
    while (ancestor != this && ancestor != null)
        ancestor = ancestor._parent;

    if (ancestor == this)
        throw new ArgumentError("An object cannot be added as a child to itself or one " +
            "of its children (or children's children, etc.)");
    else
        _parent = value;
}

/** @private */
internal function setIs3D(value: boolean): void {
    _is3D = value;
}

/** @private */
internal function get isMask(): boolean
{
    return _maskee != null;
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
setRequiresRedraw(): void {
    var parent: DisplayObject = _parent || _maskee;
    var frameID: int = Starling.frameID;

    _lastParentOrSelfChangeFrameID = frameID;
    _hasVisibleArea = _alpha != 0.0 && _visible && _maskee == null &&
    _scaleX != 0.0 && _scaleY != 0.0;

    while(parent && parent._lastChildChangeFrameID != frameID) {
    parent._lastChildChangeFrameID = frameID;
    parent = parent._parent || parent._maskee;
}
}

/** Indicates if the object needs to be redrawn in the upcoming frame, i.e. if it has
 *  changed its location relative to the stage or some other aspect of its appearance
 *  since it was last rendered. */
get requiresRedraw(): boolean
{
    var frameID: uint = Starling.frameID;

    return _lastParentOrSelfChangeFrameID == frameID ||
        _lastChildChangeFrameID == frameID;
}

/** @private Makes sure the object is not drawn from cache in the next frame.
 *  This method is meant to be called only from <code>Painter.finishFrame()</code>,
 *  since it requires rendering to be concluded. */
starling_internal function excludeFromCache(): void {
    var object: DisplayObject = this;
    var max: uint = 0xffffffff;

    while (object && object._tokenFrameID != max) {
        object._tokenFrameID = max;
        object = object._parent;
    }
}

// helpers

/** @private */
starling_internal function setTransformationChanged(): void {
    _transformationChanged = true;
    setRequiresRedraw();
}

/** @private */
starling_internal function updateTransformationMatrices(
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

private static function findCommonParent(object1: DisplayObject,
    object2: DisplayObject): DisplayObject {
    var currentObject: DisplayObject = object1;

    while (currentObject) {
        sAncestors[sAncestors.length] = currentObject; // avoiding 'push'
        currentObject = currentObject._parent;
    }

    currentObject = object2;
    while (currentObject && sAncestors.indexOf(currentObject) == -1)
        currentObject = currentObject._parent;

    sAncestors.length = 0;

    if (currentObject) return currentObject;
    else throw new ArgumentError("Object not connected to target");
}

// stage event handling

/** @private */
dispatchEvent(event: Event)
{
    if (event.type == Event.REMOVED_FROM_STAGE && stage == null)
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
        public override function addEventListener(type: string, listener: Function): void {
    if (type == Event.ENTER_FRAME && !hasEventListener(type)) {
        addEventListener(Event.ADDED_TO_STAGE, addEnterFrameListenerToStage);
        addEventListener(Event.REMOVED_FROM_STAGE, removeEnterFrameListenerFromStage);
        if (this.stage) addEnterFrameListenerToStage();
    }

    super.addEventListener(type, listener);
}

        /** @inheritDoc */
        public override function removeEventListener(type: string, listener: Function): void {
    super.removeEventListener(type, listener);

    if (type == Event.ENTER_FRAME && !hasEventListener(type)) {
        removeEventListener(Event.ADDED_TO_STAGE, addEnterFrameListenerToStage);
        removeEventListener(Event.REMOVED_FROM_STAGE, removeEnterFrameListenerFromStage);
        removeEnterFrameListenerFromStage();
    }
}

        /** @inheritDoc */
        public override function removeEventListeners(type: string = null): void {
    if ((type == null || type == Event.ENTER_FRAME) && hasEventListener(Event.ENTER_FRAME)) {
        removeEventListener(Event.ADDED_TO_STAGE, addEnterFrameListenerToStage);
        removeEventListener(Event.REMOVED_FROM_STAGE, removeEnterFrameListenerFromStage);
        removeEnterFrameListenerFromStage();
    }

    super.removeEventListeners(type);
}

private function addEnterFrameListenerToStage(): void {
    Starling.current.stage.addEnterFrameListener(this);
}

private function removeEnterFrameListenerFromStage(): void {
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
get transformationMatrix(): Matrix
{
    if (_transformationChanged) {
        _transformationChanged = false;

        if (_transformationMatrix3D == null && _is3D)
            _transformationMatrix3D = new Matrix3D();

        updateTransformationMatrices(
            _x, _y, _pivotX, _pivotY, _scaleX, _scaleY, _skewX, _skewY, _rotation,
            _transformationMatrix, _transformationMatrix3D);
    }

    return _transformationMatrix;
}

set transformationMatrix(matrix: Matrix): void
    {
        const PI_Q: number = Math.PI / 4.0;

        setRequiresRedraw();
            _transformationChanged = false;
        _transformationMatrix.copyFrom(matrix);
        _pivotX = _pivotY = 0;

        _x = matrix.tx;
        _y = matrix.ty;

        _skewX = Math.atan(-matrix.c / matrix.d);
        _skewY = Math.atan(matrix.b / matrix.a);

        // NaN check ("isNaN" causes allocation)
        if(_skewX != _skewX) _skewX = 0.0;
if (_skewY != _skewY) _skewY = 0.0;

_scaleY = (_skewX > -PI_Q && _skewX < PI_Q) ? matrix.d / Math.cos(_skewX)
    : -matrix.c / Math.sin(_skewX);
_scaleX = (_skewY > -PI_Q && _skewY < PI_Q) ? matrix.a / Math.cos(_skewY)
    : matrix.b / Math.sin(_skewY);

if (MathUtil.isEquivalent(_skewX, _skewY)) {
    _rotation = _skewX;
    _skewX = _skewY = 0;
}
else {
    _rotation = 0;
}
}

/** The 3D transformation matrix of the object relative to its parent.
 *
 *  <p>For 2D objects, this property returns just a 3D version of the 2D transformation
 *  matrix. Only the 'Sprite3D' class supports real 3D transformations.</p>
 *
 *  <p>CAUTION: not a copy, but the actual object!</p> */
get transformationMatrix3D(): Matrix3D
{
    if (_transformationMatrix3D == null)
        _transformationMatrix3D = MatrixUtil.convertTo3D(_transformationMatrix);

    if (_transformationChanged) {
        _transformationChanged = false;
        updateTransformationMatrices(
            _x, _y, _pivotX, _pivotY, _scaleX, _scaleY, _skewX, _skewY, _rotation,
            _transformationMatrix, _transformationMatrix3D);
    }

    return _transformationMatrix3D;
}

/** Indicates if this object or any of its parents is a 'Sprite3D' object. */
get is3D(): boolean { return _is3D; }

/** Indicates if the mouse cursor should transform into a hand while it's over the sprite.
 *  @default false */
get useHandCursor(): boolean { return _useHandCursor; }
set useHandCursor(value: boolean): void
    {
        if(value == _useHandCursor) return;
_useHandCursor = value;

if (_useHandCursor)
    addEventListener(TouchEvent.TOUCH, onTouch);
else
    removeEventListener(TouchEvent.TOUCH, onTouch);
        }

private function onTouch(event: TouchEvent): void {
    Mouse.cursor = event.interactsWith(this) ? MouseCursor.BUTTON : MouseCursor.AUTO;
}

/** The bounds of the object relative to the local coordinates of the parent. */
get bounds(): Rectangle
{
    return getBounds(_parent);
}

/** The width of the object in pixels.
 *  Note that for objects in a 3D space (connected to a Sprite3D), this value might not
 *  be accurate until the object is part of the display list. */
get width(): number { return getBounds(_parent, sHelperRect).width; }
set width(value: number): void
    {
        // this method calls 'this.scaleX' instead of changing _scaleX directly.
        // that way, subclasses reacting on size changes need to override only the scaleX method.

        var actualWidth: number;
        var scaleIsNaN: boolean = _scaleX != _scaleX; // avoid 'isNaN' call
        var scaleIsZero: boolean = _scaleX < 1e-8 && _scaleX > -1e-8;

        if(scaleIsZero || scaleIsNaN) { scaleX = 1.0; actualWidth = width; }
            else actualWidth = Math.abs(width / _scaleX);

if (actualWidth) scaleX = value / actualWidth;
        }

/** The height of the object in pixels.
 *  Note that for objects in a 3D space (connected to a Sprite3D), this value might not
 *  be accurate until the object is part of the display list. */
get height(): number { return getBounds(_parent, sHelperRect).height; }
set height(value: number): void
    {
        var actualHeight: number;
        var scaleIsNaN: boolean  = _scaleY != _scaleY; // avoid 'isNaN' call
        var scaleIsZero: boolean = _scaleY < 1e-8 && _scaleY > -1e-8;

        if(scaleIsZero || scaleIsNaN) { scaleY = 1.0; actualHeight = height; }
            else actualHeight = Math.abs(height / _scaleY);

if (actualHeight) scaleY = value / actualHeight;
        }

/** The x coordinate of the object relative to the local coordinates of the parent. */
get x(): number { return _x; }
set x(value: number): void
    {
        if(_x != value)
{
    _x = value;
    setTransformationChanged();
}
        }

/** The y coordinate of the object relative to the local coordinates of the parent. */
get y(): number { return _y; }
set y(value: number): void
    {
        if(_y != value)
{
    _y = value;
    setTransformationChanged();
}
        }

/** The x coordinate of the object's origin in its own coordinate space (default: 0). */
get pivotX(): number { return _pivotX; }
set pivotX(value: number): void
    {
        if(_pivotX != value)
{
    _pivotX = value;
    setTransformationChanged();
}
        }

/** The y coordinate of the object's origin in its own coordinate space (default: 0). */
get pivotY(): number { return _pivotY; }
set pivotY(value: number): void
    {
        if(_pivotY != value)
{
    _pivotY = value;
    setTransformationChanged();
}
        }

/** The horizontal scale factor. '1' means no scale, negative values flip the object.
 *  @default 1 */
get scaleX(): number { return _scaleX; }
set scaleX(value: number): void
    {
        if(_scaleX != value)
{
    _scaleX = value;
    setTransformationChanged();
}
        }

/** The vertical scale factor. '1' means no scale, negative values flip the object.
 *  @default 1 */
get scaleY(): number { return _scaleY; }
set scaleY(value: number): void
    {
        if(_scaleY != value)
{
    _scaleY = value;
    setTransformationChanged();
}
        }

/** Sets both 'scaleX' and 'scaleY' to the same value. The getter simply returns the
 *  value of 'scaleX' (even if the scaling values are different). @default 1 */
get scale(): number { return scaleX; }
set scale(value: number): void { scaleX = scaleY = value; }

/** The horizontal skew angle in radians. */
get skewX(): number { return _skewX; }
set skewX(value: number): void
    {
        value = MathUtil.normalizeAngle(value);

        if(_skewX != value)
{
    _skewX = value;
    setTransformationChanged();
}
        }

/** The vertical skew angle in radians. */
get skewY(): number { return _skewY; }
set skewY(value: number): void
    {
        value = MathUtil.normalizeAngle(value);

        if(_skewY != value)
{
    _skewY = value;
    setTransformationChanged();
}
        }

/** The rotation of the object in radians. (In Starling, all angles are measured 
 *  in radians.) */
get rotation(): number { return _rotation; }
set rotation(value: number): void
    {
        value = MathUtil.normalizeAngle(value);

        if(_rotation != value)
{
    _rotation = value;
    setTransformationChanged();
}
        }

/** @private Indicates if the object is rotated or skewed in any way. */
internal function get isRotated(): boolean
{
    return _rotation != 0.0 || _skewX != 0.0 || _skewY != 0.0;
}

/** The opacity of the object. 0 = transparent, 1 = opaque. @default 1 */
get alpha(): number { return _alpha; }
set alpha(value: number): void
    {
        if(value != _alpha)
{
    _alpha = value < 0.0 ? 0.0 : (value > 1.0 ? 1.0 : value);
    setRequiresRedraw();
}
        }

/** The visibility of the object. An invisible object will be untouchable. */
get visible(): boolean { return _visible; }
set visible(value: boolean): void
    {
        if(value != _visible)
{
    _visible = value;
    setRequiresRedraw();
}
        }

/** Indicates if this object (and its children) will receive touch events. */
get touchable(): boolean { return _touchable; }
set touchable(value: boolean): void { _touchable = value; }

/** The blend mode determines how the object is blended with the objects underneath. 
 *   @default auto
 *   @see starling.display.BlendMode */
get blendMode(): string { return _blendMode; }
set blendMode(value: string): void
    {
        if(value != _blendMode)
{
    _blendMode = value;
    setRequiresRedraw();
}
        }

/** The name of the display object (default: null). Used by 'getChildByName()' of 
 *  display object containers. */
get name(): string { return _name; }
set name(value: string): void { _name = value; }

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
get filter(): FragmentFilter { return _filter; }
set filter(value: FragmentFilter): void
    {
        if(value != _filter)
{
    if (_filter) _filter.setTarget(null);
    if (value) value.setTarget(this);

    _filter = value;
    setRequiresRedraw();
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
get mask(): DisplayObject { return _mask; }
set mask(value: DisplayObject): void
    {
        if(_mask != value)
{
    if (!sMaskWarningShown) {
        if (!SystemUtil.supportsDepthAndStencil)
            trace("[Starling] Full mask support requires 'depthAndStencil'" +
                " to be enabled in the application descriptor.");

        sMaskWarningShown = true;
    }

    if (_mask) _mask._maskee = null;
    if (value) {
        value._maskee = this;
        value._hasVisibleArea = false;
    }

    _mask = value;
    setRequiresRedraw();
}
        }

/** Indicates if the masked region of this object is set to be inverted.*/
get maskInverted(): boolean { return _maskInverted; }
set maskInverted(value: boolean): void { _maskInverted = value; }

/** The display object container that contains this display object. */
get parent(): DisplayObjectContainer { return _parent; }

/** The topmost object in the display tree the object is part of. */
get base(): DisplayObject
{
    var currentObject: DisplayObject = this;
    while (currentObject._parent) currentObject = currentObject._parent;
    return currentObject;
}

/** The root object the display object is connected to (i.e. an instance of the class 
 *  that was passed to the Starling constructor), or null if the object is not connected
 *  to the stage. */
get root(): DisplayObject
{
    var currentObject: DisplayObject = this;
    while (currentObject._parent) {
        if (currentObject._parent is Stage) return currentObject;
                else currentObject = currentObject.parent;
    }

    return null;
}

/** The stage the display object is connected to, or null if it is not connected 
 *  to the stage. */
get stage(): Stage { return this.base as Stage; }
    }
}
}
