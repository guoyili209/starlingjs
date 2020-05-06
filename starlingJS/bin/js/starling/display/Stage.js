"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var Stage = /** @class */ (function (_super) {
    __extends(Stage, _super);
    function Stage(width, height, color) {
        if (color === void 0) { color = 0; }
        var _this = _super.call(this) || this;
        _this._width = width;
        _this._height = height;
        _this._color = color;
        _this._fieldOfView = 1.0;
        _this._projectionOffset = new Point();
        _this._cameraPosition = new Vector3D();
        _this._enterFrameEvent = new EnterFrameEvent(Event.ENTER_FRAME, 0.0);
        _this._enterFrameListeners = [];
        return _this;
    }
    /** @inheritDoc */
    Stage.prototype.advanceTime = function (passedTime) {
        _enterFrameEvent.reset(Event.ENTER_FRAME, false, passedTime);
        broadcastEvent(_enterFrameEvent);
    };
    /** Returns the object that is found topmost beneath a point in stage coordinates, or
     *  the stage itself if nothing else is found. */
    Stage.prototype.hitTest = function (localPoint) {
        if (!visible || !touchable)
            return null;
        // locations outside of the stage area shouldn't be accepted
        if (localPoint.x < 0 || localPoint.x > _width ||
            localPoint.y < 0 || localPoint.y > _height)
            return null;
        // if nothing else is hit, the stage returns itself as target
        var target = _super.prototype.hitTest.call(this, localPoint);
        return target ? target : this;
    };
    /** Returns the stage bounds (i.e. not the bounds of its contents, but the rectangle
     *  spawned up by 'stageWidth' and 'stageHeight') in another coordinate system. */
    Stage.prototype.getStageBounds = function (targetSpace, out) {
        if (out === void 0) { out = null; }
        if (out == null)
            out = new Rectangle();
        out.setTo(0, 0, _width, _height);
        getTransformationMatrix(targetSpace, sMatrix);
        return RectangleUtil.getBounds(out, sMatrix, out);
    };
    /** Returns the bounds of the screen (or application window, on Desktop) relative to
     *  a certain coordinate system. In most cases, that's identical to the stage bounds;
     *  however, this changes if the viewPort is customized. */
    Stage.prototype.getScreenBounds = function (targetSpace, out) {
        if (out === void 0) { out = null; }
        var target = this.starling;
        if (target == null)
            return getStageBounds(targetSpace, out);
        if (out == null)
            out = new Rectangle();
        var nativeStage = target.nativeStage;
        var viewPort = target.viewPort;
        var scaleX = _width / viewPort.width;
        var scaleY = _height / viewPort.height;
        var x = -viewPort.x * scaleX;
        var y = -viewPort.y * scaleY;
        out.setTo(x, y, nativeStage.stageWidth * scaleX, nativeStage.stageHeight * scaleY);
        getTransformationMatrix(targetSpace, sMatrix);
        return RectangleUtil.getBounds(out, sMatrix, out);
    };
    Stage.prototype.getCameraPosition = function (space, out) {
        if (space === void 0) { space = null; }
        if (out === void 0) { out = null; }
        getTransformationMatrix3D(space, sMatrix3D);
        return MatrixUtil.transformCoords3D(sMatrix3D, _width / 2 + _projectionOffset.x, _height / 2 + _projectionOffset.y, -focalLength, out);
    };
    Stage.prototype.addEnterFrameListener = function (listener) {
        var index = _enterFrameListeners.indexOf(listener);
        if (index < 0)
            _enterFrameListeners[_enterFrameListeners.length] = listener;
    };
    Stage.prototype.removeEnterFrameListener = function (listener) {
        var index = _enterFrameListeners.indexOf(listener);
        if (index >= 0)
            _enterFrameListeners.removeAt(index);
    };
    Stage.prototype.getChildEventListeners = function (object, eventType, _enterFrameListeners) {
        if (eventType == Event.ENTER_FRAME && object == this) {
            for (var i = 0, length = _enterFrameListeners.length; i < length; ++i)
                listeners[listeners.length] = _enterFrameListeners[i]; // avoiding 'push'
        }
        else
            _super.prototype.getChildEventListeners.call(this, object, eventType, listeners);
    };
    Object.defineProperty(Stage.prototype, "width", {
        set: function (value) {
            throw new IllegalOperationError("Cannot set width of stage");
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Stage.prototype, "height", {
        set: function (value) {
            throw new IllegalOperationError("Cannot set height of stage");
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Stage.prototype, "x", {
        set: function (value) {
            throw new IllegalOperationError("Cannot set x-coordinate of stage");
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Stage.prototype, "y", {
        set: function (value) {
            throw new IllegalOperationError("Cannot set y-coordinate of stage");
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Stage.prototype, "scaleX", {
        set: function (value) {
            throw new IllegalOperationError("Cannot scale stage");
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Stage.prototype, "scaleY", {
        set: function (value) {
            throw new IllegalOperationError("Cannot scale stage");
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Stage.prototype, "rotation", {
        set: function (value) {
            throw new IllegalOperationError("Cannot rotate stage");
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Stage.prototype, "skewX", {
        set: function (value) {
            throw new IllegalOperationError("Cannot skew stage");
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Stage.prototype, "skewY", {
        set: function (value) {
            throw new IllegalOperationError("Cannot skew stage");
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Stage.prototype, "filter", {
        set: function (value) {
            throw new IllegalOperationError("Cannot add filter to stage. Add it to 'root' instead!");
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Stage.prototype, "color", {
        /** The background color of the stage.
         *  When Starling clears the render context (which happens automatically once per frame),
         *  it will use this this color. Note that it's actually an 'ARGB' value: if you need
         *  the context to be cleared with a specific alpha value, include it in the color. */
        get: function () { return _color; },
        set: function (value) {
            if (_color != value) {
                _color = value;
                setRequiresRedraw();
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Stage.prototype, "stageWidth", {
        /** The width of the stage coordinate system. Change it to scale its contents relative
         *  to the <code>viewPort</code> property of the Starling object. */
        get: function () { return _width; },
        set: function (value) {
            if (_width != value) {
                _width = value;
                setRequiresRedraw();
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Stage.prototype, "stageHeight", {
        /** The height of the stage coordinate system. Change it to scale its contents relative
         *  to the <code>viewPort</code> property of the Starling object. */
        get: function () { return _height; },
        set: function (value) {
            if (_height != value) {
                _height = value;
                setRequiresRedraw();
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Stage.prototype, "starling", {
        /** The Starling instance this stage belongs to. */
        get: function () {
            var instances = Starling.all;
            var numInstances = instances.length;
            for (var i = 0; i < numInstances; ++i)
                if (instances[i].stage == this)
                    return instances[i];
            return null;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Stage.prototype, "focalLength", {
        /** The distance between the stage and the camera. Changing this value will update the
         *  field of view accordingly. */
        get: function () {
            return _width / (2 * Math.tan(_fieldOfView / 2));
        },
        set: function (value) {
            _fieldOfView = 2 * Math.atan(stageWidth / (2 * value));
            setRequiresRedraw();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Stage.prototype, "fieldOfView", {
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
        get: function () { return _fieldOfView; },
        set: function (value) {
            _fieldOfView = value;
            setRequiresRedraw();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Stage.prototype, "projectionOffset", {
        /** A vector that moves the camera away from its default position in the center of the
         *  stage. Use this property to change the center of projection, i.e. the vanishing
         *  point for 3D display objects. <p>CAUTION: not a copy, but the actual object!</p>
         */
        get: function () { return _projectionOffset; },
        set: function (value) {
            _projectionOffset.setTo(value.x, value.y);
            setRequiresRedraw();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Stage.prototype, "cameraPosition", {
        /** The global position of the camera. This property can only be used to find out the
         *  current position, but not to modify it. For that, use the 'projectionOffset',
         *  'fieldOfView' and 'focalLength' properties. If you need the camera position in
         *  a certain coordinate space, use 'getCameraPosition' instead.
         *
         *  <p>CAUTION: not a copy, but the actual object!</p>
         */
        get: function () {
            return getCameraPosition(null, _cameraPosition);
        },
        enumerable: true,
        configurable: true
    });
    return Stage;
}(DisplayObjectContainer));
exports.default = Stage;
