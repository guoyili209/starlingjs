module StarlingJS {
    export class Starling extends EventDispatcher{
        private _rootClass: any;
        private _root:DisplayObject|null=null;
        private _viewPort: Rectangle;
        private _previousViewPort: Rectangle;
        private _stage: Stage|any;
        private _juggler:Juggler;
        private _painter:Painter;
        private _touchProcessor:TouchProcessor;
        private _antiAliasing:number;
        private _frameTimestamp:Number;
        private _frameID:number;
        private _leftMouseDown:Boolean;
        private _statsDisplay:StatsDisplay;
        private _statsDisplayAlign:Object;
        private _started:Boolean;
        private _rendering:Boolean;
        private _supportHighResolutions:Boolean;
        private _supportBrowserZoom:Boolean;
        private _skipUnchangedFrames:Boolean;
        private _showStats:Boolean;
        private _supportsCursor:Boolean;
        private _multitouchEnabled:Boolean;

        private _viewPort:Rectangle;
        private _previousViewPort:Rectangle;
        private _clippedViewPort:Rectangle;

        private _nativeStage:flash.display.Stage;
        private _nativeStageEmpty:Boolean;       

        private static sCurrent:Starling;
        private static sAll:Array<Starling> = new Array<Starling>();
        context3D;

        constructor(rootClass: any, viewPort: Rectangle, renderMode = "auto", profile = "auto") {
            super();
            let canvas: any = document.getElementById('starlingCanvas');
            viewPort = viewPort || new Rectangle(0, 0, canvas.width, canvas.height);

            SystemUtil.initialize();
            this._rootClass = rootClass;
            this._viewPort = viewPort;
            this._previousViewPort = new Rectangle();
            this._stage = new Stage(viewPort.width, viewPort.height, 0);
            this.context3D = this.createGLContext(canvas);


            this.initialize();
        }

        initialize() {
            this.initializeRoot();
        }

        initializeRoot() {
            if (this._root == null && this._rootClass != null) {
                this._root = new this._rootClass();
                if (this._root == null) throw new Error("Invalid root class: " + this._rootClass);
                (this._stage as DisplayObjectContainer).addChildAt(this._root, 0);

                super.dispatchEventWith(Event.ROOT_CREATED, false, this._root);
            }
        }

        createGLContext(canvas) {
            var names = ["webgl", "experimental-webgl"];
            var context:any = null;
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
}