export module StarlingJS {
    export class DisplayObjectContainer {
        private _width: number;
        private _height: number;
        private _color: number;
        private _fieldOfView: number;
        private _projectionOffset: Point;
        private _cameraPosition: Vector3D;
        private _enterFrameEvent: EnterFrameEvent;
        private _enterFrameListeners: []<DisplayObject>;
        constructor() {

        }
    }
}