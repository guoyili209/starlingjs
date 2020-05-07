import Rectangle from './../geom/Rectangle';
import {starling} from './../display/Stage'; 
import { StarlingJS } from '../display/DisplayObjectContainer';
class Starling {
    private _rootClass:any;
    private _viewPort:Rectangle;
    private _previousViewPort:Rectangle;
    private _stage:starling.display.Stage;
    context3D;

    constructor(rootClass:any, viewPort:Rectangle, renderMode = "auto", profile = "auto") {
        let canvas:any = document.getElementById('starlingCanvas');
        viewPort = viewPort || new Rectangle(0, 0, canvas.width, canvas.height);

        this._rootClass = rootClass;
        this._viewPort = viewPort;
        this._previousViewPort = new Rectangle();
        this._stage = new starling.display.Stage(viewPort.width, viewPort.height, stage.color);
        this.context3D = this.createGLContext(canvas);

        this.initialize();
    }

    initialize() {
        this.initializeRoot();
    }

    initializeRoot() {
        if (_root == null && _rootClass != null) {
            _root = new _rootClass();
            if (_root == null) throw new Error("Invalid root class: " + _rootClass);
            _stage.addChildAt(_root, 0);

            dispatchEventWith(starling.events.Event.ROOT_CREATED, false, _root);
        }
    }

    createGLContext(canvas) {
        var names = ["webgl", "experimental-webgl"];
        var context = null;
        for (var i = 0; i < names.length; i++) {
            try {
                context = canvas.getContext(names[i]);
            } catch (e) {
                console.log(names[i] + ":" + e);
            }
            if (context) {
                break;
            }
        }
        if (context) {
            context.viewportWidth = canvas.width;
            context.viewportHeight = canvas.height;
        } else {
            alert("Failed to create WebGL context!");
        }
        return context;
    }

    static init(width, height) {
        let canvas = document.createElement("canvas");
        canvas.setAttribute("id", 'starlingCanvas');
        canvas.setAttribute("width", width);
        canvas.setAttribute("height", height);
        document.body.appendChild(canvas);
    }
}