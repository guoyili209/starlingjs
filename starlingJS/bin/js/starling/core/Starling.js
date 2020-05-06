"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var Rectangle_1 = __importDefault(require("../geom/Rectangle"));
var Starling = /** @class */ (function () {
    function Starling(rootClass, viewPort, renderMode, profile) {
        if (renderMode === void 0) { renderMode = "auto"; }
        if (profile === void 0) { profile = "auto"; }
        var canvas = document.getElementById('starlingCanvas');
        viewPort = viewPort || new Rectangle_1.default(0, 0, canvas.width, canvas.height);
        this._rootClass = rootClass;
        this._viewPort = viewPort;
        this._previousViewPort = new Rectangle_1.default();
        this._stage = new Stage(viewPort.width, viewPort.height, stage.color);
        this.context3D = this.createGLContext(canvas);
        this.initialize();
    }
    Starling.prototype.initialize = function () {
        this.initializeRoot();
    };
    Starling.prototype.initializeRoot = function () {
        if (_root == null && _rootClass != null) {
            _root = new _rootClass();
            if (_root == null)
                throw new Error("Invalid root class: " + _rootClass);
            _stage.addChildAt(_root, 0);
            dispatchEventWith(starling.events.Event.ROOT_CREATED, false, _root);
        }
    };
    Starling.prototype.createGLContext = function (canvas) {
        var names = ["webgl", "experimental-webgl"];
        var context = null;
        for (var i = 0; i < names.length; i++) {
            try {
                context = canvas.getContext(names[i]);
            }
            catch (e) {
                console.log(names[i] + ":" + e);
            }
            if (context) {
                break;
            }
        }
        if (context) {
            context.viewportWidth = canvas.width;
            context.viewportHeight = canvas.height;
        }
        else {
            alert("Failed to create WebGL context!");
        }
        return context;
    };
    Starling.init = function (width, height) {
        var canvas = document.createElement("canvas");
        canvas.setAttribute("id", 'starlingCanvas');
        canvas.setAttribute("width", width);
        canvas.setAttribute("height", height);
        document.body.appendChild(canvas);
    };
    return Starling;
}());
window.StarlingJS || (window.StarlingJS = {});
window.StarlingJS.Starling = Starling;
exports.default = window.StarlingJS.Starling;
