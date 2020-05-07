module StarlingJS {
    export class Event {
        /** Event type for a display object that is added to a parent. */
        public static const ADDED: string = "added";
        /** Event type for a display object that is added to the stage */
        public static const ADDED_TO_STAGE: string = "addedToStage";
        /** Event type for a display object that is entering a new frame. */
        public static const ENTER_FRAME: string = "enterFrame";
        /** Event type for a display object that is removed from its parent. */
        public static const REMOVED: string = "removed";
        /** Event type for a display object that is removed from the stage. */
        public static const REMOVED_FROM_STAGE: string = "removedFromStage";
        /** Event type for a triggered button. */
        public static const TRIGGERED: string = "triggered";
        /** Event type for a resized Flash Player. */
        public static const RESIZE: string = "resize";
        /** Event type that may be used whenever something finishes. */
        public static const COMPLETE: string = "complete";
        /** Event type for a (re)created stage3D rendering context. */
        public static const CONTEXT3D_CREATE: string = "context3DCreate";
        /** Event type that is dispatched by the Starling instance directly before rendering. */
        public static const RENDER: string = "render";
        /** Event type that indicates that the root DisplayObject has been created. */
        public static const ROOT_CREATED: string = "rootCreated";
        /** Event type for an animated object that requests to be removed from the juggler. */
        public static const REMOVE_FROM_JUGGLER: string = "removeFromJuggler";
        /** Event type that is dispatched by the AssetManager after a context loss. */
        public static const TEXTURES_RESTORED: string = "texturesRestored";
        /** Event type that is dispatched by the AssetManager when a file/url cannot be loaded. */
        public static const IO_ERROR: string = "ioError";
        /** Event type that is dispatched by the AssetManager when a file/url cannot be loaded. */
        public static const SECURITY_ERROR: string = "securityError";
        /** Event type that is dispatched by the AssetManager when an xml or json file couldn't
         *  be parsed. */
        public static const PARSE_ERROR: string = "parseError";
        /** Event type that is dispatched by the Starling instance when it encounters a problem
         *  from which it cannot recover, e.g. a lost device context. */
        public static const FATAL_ERROR: string = "fatalError";

        /** An event type to be utilized in custom events. Not used by Starling right now. */
        public static const CHANGE: string = "change";
        /** An event type to be utilized in custom events. Not used by Starling right now. */
        public static const CANCEL: string = "cancel";
        /** An event type to be utilized in custom events. Not used by Starling right now. */
        public static const SCROLL: string = "scroll";
        /** An event type to be utilized in custom events. Not used by Starling right now. */
        public static const OPEN: string = "open";
        /** An event type to be utilized in custom events. Not used by Starling right now. */
        public static const CLOSE: string = "close";
        /** An event type to be utilized in custom events. Not used by Starling right now. */
        public static const SELECT: string = "select";
        /** An event type to be utilized in custom events. Not used by Starling right now. */
        public static const READY: string = "ready";
        /** An event type to be utilized in custom events. Not used by Starling right now. */
        public static const UPDATE: string = "update";

        private static sEventPool: Array<Event> = new Array<Event>();

        private _target:EventDispatcher;
        private _currentTarget: EventDispatcher;
        private _type: string;
        private _bubbles: boolean;
        private _stopsPropagation: boolean;
        private _stopsImmediatePropagation: boolean;
        private _data: Object;

        /** Creates an event object that can be passed to listeners. */
        constructor(type: string, bubbles: boolean = false, data: any = null) {
            this._type = type;
            this._bubbles = bubbles;
            this._data = data;
        }

        /** Prevents listeners at the next bubble stage from receiving the event. */
        stopPropagation(): void {
            this._stopsPropagation = true;
        }

        /** Prevents any other listeners from receiving the event. */
        stopImmediatePropagation(): void {
           this._stopsPropagation = this._stopsImmediatePropagation = true;
        }

        /** Returns a description of the event, containing type and bubble information. */
        toString(): string {
            return StringUtil.format("[{0} type=\"{1}\" bubbles={2}]",
                getQualifiedClassName(this).split("::").pop(), _type, _bubbles);
        }

        /** Indicates if event will bubble. */
        get bubbles(): boolean { return _bubbles; }

        /** The object that dispatched the event. */
        get target(): EventDispatcher { return _target; }

        /** The object the event is currently bubbling at. */
        get currentTarget(): EventDispatcher { return _currentTarget; }

        /** A string that identifies the event. */
        get type(): string { return _type; }

        /** Arbitrary data that is attached to the event. */
        get data(): Object { return _data; }

        // properties for  use

        /** @private */
        setTarget(value: EventDispatcher): void { _target = value; }

        /** @private */
        setCurrentTarget(value: EventDispatcher): void { _currentTarget = value; }

        /** @private */
        setData(value: Object): void { _data = value; }

        /** @private */
        get stopsPropagation(): boolean { return _stopsPropagation; }

        /** @private */
        get stopsImmediatePropagation(): boolean { return _stopsImmediatePropagation; }

        // event pooling

        /** @private */
        static function fromPool(type: string, bubbles: boolean = false, data: Object = null): Event {
            if (sEventPool.length) return sEventPool.pop().reset(type, bubbles, data);
            else return new Event(type, bubbles, data);
        }

        /** @private */
        static function toPool(event: Event): void {
            event._data = event._target = event._currentTarget = null;
            sEventPool[sEventPool.length] = event; // avoiding 'push'
        }

        /** @private */
        reset(type: string, bubbles: boolean = false, data: Object = null): Event {
            _type = type;
            _bubbles = bubbles;
            _data = data;
            _target = _currentTarget = null;
            _stopsPropagation = _stopsImmediatePropagation = false;
            return this;
        }
    }
}