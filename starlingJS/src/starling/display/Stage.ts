module StarlingJS {
    export class Stage extends DisplayObjectContainer {
        private _width:number;
        private _height:number;
        private _color:any;
        private _fieldOfView:number;
        private _projectionOffset:Point;
        private _cameraPosition:Vector3D;
        private _enterFrameEvent:EnterFrameEvent;
        private _enterFrameListeners:Array<DisplayObject>;

        private static sMatrix:Matrix = new Matrix();
        private static sMatrix3D:Matrix3D = new Matrix3D();

        constructor(width, height, color = 0) {
            super();
            this._width = width;
            this._height = height;
            this._color = color;
            this._fieldOfView = 1.0;
            this._projectionOffset = new Point();
            this._cameraPosition = new Vector3D();
            this._enterFrameEvent = new EnterFrameEvent(Event.ENTER_FRAME, 0.0);
            this._enterFrameListeners = [];
        }

        /** @inheritDoc */
        advanceTime(passedTime) {
            this._enterFrameEvent.reset(Event.ENTER_FRAME, false, passedTime);
            this.broadcastEvent(this._enterFrameEvent);
        }

        /** Returns the object that is found topmost beneath a point in stage coordinates, or  
         *  the stage itself if nothing else is found. */
        hitTest(localPoint) {
            if (!this.visible || !this.touchable) return null;

            // locations outside of the stage area shouldn't be accepted
            if (localPoint.x < 0 || localPoint.x > this._width ||
                localPoint.y < 0 || localPoint.y > this._height)
                return null;

            // if nothing else is hit, the stage returns itself as target
            var target = super.hitTest(localPoint);
            return target ? target : this;
        }

        /** Returns the stage bounds (i.e. not the bounds of its contents, but the rectangle
         *  spawned up by 'stageWidth' and 'stageHeight') in another coordinate system. */
        getStageBounds(targetSpace, out = null) {
            if (out == null) out = new Rectangle();

            out.setTo(0, 0, this._width, this._height);
            this.getTransformationMatrix(targetSpace, Stage.sMatrix);

            return RectangleUtil.getBounds(out, Stage.sMatrix, out);
        }

        /** Returns the bounds of the screen (or application window, on Desktop) relative to
         *  a certain coordinate system. In most cases, that's identical to the stage bounds;
         *  however, this changes if the viewPort is customized. */
        getScreenBounds(targetSpace, out = null) {
            var target = this.starling;
            if (target == null) return this.getStageBounds(targetSpace, out);
            if (out == null) out = new Rectangle();

            var nativeStage = target.nativeStage;
            var viewPort = target.viewPort;
            var scaleX = this._width / viewPort.width;
            var scaleY = this._height / viewPort.height;
            var x = -viewPort.x * scaleX;
            var y = -viewPort.y * scaleY;

            out.setTo(x, y, nativeStage.stageWidth * scaleX, nativeStage.stageHeight * scaleY);
            this.getTransformationMatrix(targetSpace, Stage.sMatrix);

            return RectangleUtil.getBounds(out, Stage.sMatrix, out);
        }

        getCameraPosition(space = null, out = null) {
            this.getTransformationMatrix3D(space, Stage.sMatrix3D);

            return MatrixUtil.transformCoords3D(Stage.sMatrix3D,
                this._width / 2 + this._projectionOffset.x, this._height / 2 + this._projectionOffset.y,
                -this.focalLength, out);
        }

        addEnterFrameListener(listener) {
            var index = this._enterFrameListeners.indexOf(listener);
            if (index < 0) this._enterFrameListeners[this._enterFrameListeners.length] = listener;
        }


        removeEnterFrameListener(listener) {
            var index = this._enterFrameListeners.indexOf(listener);
            if (index >= 0) this._enterFrameListeners.removeAt(index);
        }


        getChildEventListeners(object, eventType,
            listeners) {
            if (eventType == Event.ENTER_FRAME && object == this) {
                for (var i = 0, length = this._enterFrameListeners.length; i < length; ++i)
                    listeners[listeners.length] = this._enterFrameListeners[i]; // avoiding 'push'
            }
            else
                super.getChildEventListeners(object, eventType, listeners);
        }

        set width(value) {
            throw new Error("Cannot set width of stage");
        }

        set height(value) {
            throw new Error("Cannot set height of stage");
        }

        set x(value) {
            throw new Error("Cannot set x-coordinate of stage");
        }

        set y(value) {
            throw new Error("Cannot set y-coordinate of stage");
        }

        set scaleX(value) {
            throw new Error("Cannot scale stage");
        }

        set scaleY(value) {
            throw new Error("Cannot scale stage");
        }

        set rotation(value) {
            throw new Error("Cannot rotate stage");
        }


        set skewX(value) {
            throw new Error("Cannot skew stage");
        }


        set skewY(value) {
            throw new Error("Cannot skew stage");
        }


        set filter(value) {
            throw new Error("Cannot add filter to stage. Add it to 'root' instead!");
        }

        /** The background color of the stage.
         *  When Starling clears the render context (which happens automatically once per frame),
         *  it will use this this color. Note that it's actually an 'ARGB' value: if you need
         *  the context to be cleared with a specific alpha value, include it in the color. */
        get color() { return this._color; }
        set color(value) {
            if (this._color != value) {
                this._color = value;
                this.setRequiresRedraw();
            }
        }

        /** The width of the stage coordinate system. Change it to scale its contents relative
         *  to the <code>viewPort</code> property of the Starling object. */
        get stageWidth() { return this._width; }
        set stageWidth(value) {
            if (this._width != value) {
                this._width = value;
                this.setRequiresRedraw();
            }
        }

        /** The height of the stage coordinate system. Change it to scale its contents relative
         *  to the <code>viewPort</code> property of the Starling object. */
        get stageHeight() { return this._height; }
        set stageHeight(value) {
            if (this._height != value) {
                this._height = value;
                this.setRequiresRedraw();
            }
        }

        /** The Starling instance this stage belongs to. */
        get starling() {
            var instances = Starling.all;
            var numInstances = instances.length;

            for (var i = 0; i < numInstances; ++i)
                if (instances[i].stage == this) return instances[i];

            return null;
        }

        /** The distance between the stage and the camera. Changing this value will update the
         *  field of view accordingly. */
        get focalLength() {
            return this._width / (2 * Math.tan(this._fieldOfView / 2));
        }

        set focalLength(value) {
            this._fieldOfView = 2 * Math.atan(this.stageWidth / (2 * value));
            this.setRequiresRedraw();
        }

        /** Specifies an angle (radian, between zero and PI) for the field of view. This value
         *  determines how strong the perspective transformation and distortion apply to a Sprite3D
         *  object.
         *
         *  <p>A value close to zero will look similar to an orthographic projection; a value
         *  close to PI results in a fisheye lens effect. If the field of view is set to 0 or PI,
         *  nothing is seen on the screen.</p>
         *
         *  @default 1.0
         */
        get fieldOfView() { return this._fieldOfView; }
        set fieldOfView(value) {
            this._fieldOfView = value;
            this.setRequiresRedraw();
        }

        /** A vector that moves the camera away from its default position in the center of the
         *  stage. Use this property to change the center of projection, i.e. the vanishing
         *  point for 3D display objects. <p>CAUTION: not a copy, but the actual object!</p>
         */
        get projectionOffset() { return this._projectionOffset; }
        set projectionOffset(value) {
            this._projectionOffset.setTo(value.x, value.y);
            this.setRequiresRedraw();
        }

        /** The global position of the camera. This property can only be used to find out the
         *  current position, but not to modify it. For that, use the 'projectionOffset',
         *  'fieldOfView' and 'focalLength' properties. If you need the camera position in
         *  a certain coordinate space, use 'getCameraPosition' instead.
         *
         *  <p>CAUTION: not a copy, but the actual object!</p>
         */
        get cameraPosition() {
            return this.getCameraPosition(null, this._cameraPosition);
        }
    }
}