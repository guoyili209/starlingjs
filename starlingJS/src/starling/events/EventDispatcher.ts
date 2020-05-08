module StarlingJS {
    export class EventDispatcher {
        private _eventListeners: Dictionary | null = null;
        private _eventStack: Array<string> = new Array<string>();

        /** Helper object. */
        private static sBubbleChains: Array<any> = [];

        /** Creates an EventDispatcher. */
        constructor() { }

        /** Registers an event listener at a certain object. */
        addEventListener(type: string, listener: Function): void {
            if (!this._eventListeners)
                this._eventListeners = new Dictionary();

            var listeners: Array<any> = this._eventListeners[type] as Array<any>;
            if (listeners == null)
                this._eventListeners[type] = [listener];
            else if (listeners.indexOf(listener) == -1) // check for duplicates
                listeners[listeners.length] = listener; // avoid 'push'
        }

        /** Removes an event listener from the object. */
        removeEventListener(type: string, listener: Function): void {
            if (this._eventListeners) {
                var listeners: Array<any> = this._eventListeners[type] as Array<any>;
                var numListeners: number = listeners ? listeners.length : 0;

                if (numListeners > 0) {
                    // we must not modify the original vector, but work on a copy.
                    // (see comment in 'invokeEvent')

                    var index: number = listeners.indexOf(listener);

                    if (index != -1) {
                        if (this._eventStack.indexOf(type) == -1) {
                            listeners.splice(index, 1);
                        }
                        else {
                            var restListeners: Array<any> = listeners.slice(0, index);

                            for (var i: number = index + 1; i < numListeners; ++i)
                                restListeners[i - 1] = listeners[i];

                            this._eventListeners[type] = restListeners;
                        }
                    }
                }
            }
        }

        /** Removes all event listeners with a certain type, or all of them if type is null. 
         *  Be careful when removing all event listeners: you never know who else was listening. */
        removeEventListeners(type?: string): void {
            if (type && this._eventListeners)
                delete this._eventListeners[type];
            else
                this._eventListeners = null;
        }

        /** Dispatches an event to all objects that have registered listeners for its type. 
         *  If an event with enabled 'bubble' property is dispatched to a display object, it will 
         *  travel up along the line of parents, until it either hits the root object or someone
         *  stops its propagation manually. */
        dispatchEvent(event: Event): void {
            var bubbles: boolean = event.bubbles;

            if (!bubbles && (this._eventListeners == null || !(event.type in this._eventListeners)))
                return; // no need to do anything

            // we save the current target and restore it later;
            // this allows users to re-dispatch events without creating a clone.

            var previousTarget: EventDispatcher | null = event.target;
            event.setTarget(this);

            if (bubbles && this instanceof DisplayObject) this.bubbleEvent(event);
            else this.invokeEvent(event);

            if (previousTarget) event.setTarget(previousTarget);
        }

        /** @private
         *  Invokes an event on the current object. This method does not do any bubbling, nor
         *  does it back-up and restore the previous target on the event. The 'dispatchEvent' 
         *  method uses this method internally. */
        invokeEvent(event: Event): boolean {
            var listeners: any = this._eventListeners ? this._eventListeners[event.type] as Array<any> : null;
            var numListeners: number = listeners == null ? 0 : listeners.length;

            if (numListeners) {
                event.setCurrentTarget(this);
                this._eventStack[this._eventStack.length] = event.type;

                // we can enumerate directly over the vector, because:
                // when somebody modifies the list while we're looping, "addEventListener" is not
                // problematic, and "removeEventListener" will create a new Vector, anyway.

                for (var i: number = 0; i < numListeners; ++i) {
                    var listener: Function = listeners[i] as Function;
                    var numArgs: number = listener.length;

                    if (numArgs == 0) listener();
                    else if (numArgs == 1) listener(event);
                    else listener(event, event.data);

                    if (event.stopsImmediatePropagation) {
                        this._eventStack.pop();
                        return true;
                    }
                }

                this._eventStack.pop();

                return event.stopsPropagation;
            }
            else {
                return false;
            }
        }

        /** @private */
        bubbleEvent(event: Event): void {
            // we determine the bubble chain before starting to invoke the listeners.
            // that way, changes done by the listeners won't affect the bubble chain.

            var chain: Array<EventDispatcher>;
            var element: DisplayObject | any = this;
            var length: number = 1;

            if (EventDispatcher.sBubbleChains.length > 0) { chain = EventDispatcher.sBubbleChains.pop(); chain[0] = element; }
            else {
                chain = new Array<EventDispatcher>();
                chain.push(element);
            }

            while ((element = element.parent) != null)
                chain[<number>(length++)] = element;

            for (var i: number = 0; i < length; ++i) {
                var stopPropagation: boolean = chain[i].invokeEvent(event);
                if (stopPropagation) break;
            }

            chain.length = 0;
            EventDispatcher.sBubbleChains[EventDispatcher.sBubbleChains.length] = chain; // avoid 'push'
        }

        /** Dispatches an event with the given parameters to all objects that have registered 
         *  listeners for the given type. The method uses an internal pool of event objects to 
         *  avoid allocations. */
        dispatchEventWith(type: string, bubbles: boolean = false, data: Object | null = null): void {
            if (bubbles || this.hasEventListener(type)) {
                var event: Event = Event.fromPool(type, bubbles, data);
                this.dispatchEvent(event);
                Event.toPool(event);
            }
        }

        /** If called with one argument, figures out if there are any listeners registered for
         *  the given event type. If called with two arguments, also determines if a specific
         *  listener is registered. */
        hasEventListener(type: string, listener: Function | null = null): boolean {
            var listeners: any = this._eventListeners ? this._eventListeners[type] as Array<Function> : null;
            if (listeners == null) return false;
            else {
                if (listener != null) return listeners.indexOf(listener) != -1;
                else return listeners.length != 0;
            }
        }
    }
}