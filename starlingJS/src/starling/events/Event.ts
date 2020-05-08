module StarlingJS {
    export class Event {
        /** Event type for a display object that is added to a parent. */
        static readonly ADDED: string = "added";
        /** Event type for a display object that is added to the stage */
        static readonly ADDED_TO_STAGE: string = "addedToStage";
        /** Event type for a display object that is entering a new frame. */
        static readonly ENTER_FRAME: string = "enterFrame";
        /** Event type for a display object that is removed from its parent. */
        static readonly REMOVED: string = "removed";
        /** Event type for a display object that is removed from the stage. */
        static readonly REMOVED_FROM_STAGE: string = "removedFromStage";
        /** Event type for a triggered button. */
        static readonly TRIGGERED: string = "triggered";
        /** Event type for a resized Flash Player. */
        static readonly RESIZE: string = "resize";
        /** Event type that may be used whenever something finishes. */
        static readonly COMPLETE: string = "complete";
        /** Event type for a (re)created stage3D rendering context. */
        static readonly CONTEXT3D_CREATE: string = "context3DCreate";
        /** Event type that is dispatched by the Starling instance directly before rendering. */
        static readonly RENDER: string = "render";
        /** Event type that indicates that the root DisplayObject has been created. */
        static readonly ROOT_CREATED: string = "rootCreated";
        /** Event type for an animated object that requests to be removed from the juggler. */
        static readonly REMOVE_FROM_JUGGLER: string = "removeFromJuggler";
        /** Event type that is dispatched by the AssetManager after a context loss. */
        static readonly TEXTURES_RESTORED: string = "texturesRestored";
        /** Event type that is dispatched by the AssetManager when a file/url cannot be loaded. */
        static readonly IO_ERROR: string = "ioError";
        /** Event type that is dispatched by the AssetManager when a file/url cannot be loaded. */
        static readonly SECURITY_ERROR: string = "securityError";
        /** Event type that is dispatched by the AssetManager when an xml or json file couldn't
         *  be parsed. */
        static readonly PARSE_ERROR: string = "parseError";
        /** Event type that is dispatched by the Starling instance when it encounters a problem
         *  from which it cannot recover, e.g. a lost device context. */
        static readonly FATAL_ERROR: string = "fatalError";

        /** An event type to be utilized in custom events. Not used by Starling right now. */
        static readonly CHANGE: string = "change";
        /** An event type to be utilized in custom events. Not used by Starling right now. */
        static readonly CANCEL: string = "cancel";
        /** An event type to be utilized in custom events. Not used by Starling right now. */
        static readonly SCROLL: string = "scroll";
        /** An event type to be utilized in custom events. Not used by Starling right now. */
        static readonly OPEN: string = "open";
        /** An event type to be utilized in custom events. Not used by Starling right now. */
        static readonly CLOSE: string = "close";
        /** An event type to be utilized in custom events. Not used by Starling right now. */
        static readonly SELECT: string = "select";
        /** An event type to be utilized in custom events. Not used by Starling right now. */
        static readonly READY: string = "ready";
        /** An event type to be utilized in custom events. Not used by Starling right now. */
        static readonly UPDATE: string = "update";

        private static sEventPool: Array<Event> = new Array<Event>();

        private _target: EventDispatcher|null;
        private _currentTarget: EventDispatcher|null;
        private _type: string;
        private _bubbles: boolean;
        private _stopsPropagation: boolean=false;
        private _stopsImmediatePropagation: boolean=false;
        private _data: Object|null;

        /** Creates an event object that can be passed to listeners. */
        constructor(type: string, bubbles: boolean = false, data: any = null) {
            this._type = type;
            this._bubbles = bubbles;
            this._data = data;
            this._target=null;
            this._currentTarget=null;
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
                this.constructor.name, this._type, this._bubbles);
        }

        /** Indicates if event will bubble. */
        get bubbles(): boolean { return this._bubbles; }

        /** The object that dispatched the event. */
        get target(): EventDispatcher|null { return this._target; }

        /** The object the event is currently bubbling at. */
        get currentTarget(): EventDispatcher|null { return this._currentTarget; }

        /** A string that identifies the event. */
        get type(): string { return this._type; }

        /** Arbitrary data that is attached to the event. */
        get data(): Object|null { return this._data; }

        // properties for  use

        /** @private */
        setTarget(value: EventDispatcher): void { this._target = value; }

        /** @private */
        setCurrentTarget(value: EventDispatcher): void { this._currentTarget = value; }

        /** @private */
        setData(value: Object): void { this._data = value; }

        /** @private */
        get stopsPropagation(): boolean { return this._stopsPropagation; }

        /** @private */
        get stopsImmediatePropagation(): boolean { return this._stopsImmediatePropagation; }

        // event pooling

        /** @private */
        static fromPool(type: string, bubbles: boolean = false, data: Object | null = null): Event {
            if (this.sEventPool.length) return (this.sEventPool.pop() as Event).reset(type, bubbles, data);
            else return new Event(type, bubbles, data);
        }

        /** @private */
        static toPool(event: Event): void {
            event._data = event._target = event._currentTarget = null;
            this.sEventPool[this.sEventPool.length] = event; // avoiding 'push'
        }

        /** @private */
        reset(type: string, bubbles: boolean = false, data: Object|null = null): Event {
            this._type = type;
            this._bubbles = bubbles;
            this._data = data;
            this._target = this._currentTarget = null;
            this._stopsPropagation = this._stopsImmediatePropagation = false;
            return this;
        }
    }
}