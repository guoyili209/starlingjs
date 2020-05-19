// =================================================================================================
//
//	Starling Framework
//	Copyright Gamua GmbH. All Rights Reserved.
//
//	This program is free software. You can redistribute and/or modify it
//	in accordance with the terms of the accompanying license agreement.
//
// =================================================================================================

module StarlingJS {
    export class Juggler implements IAnimatable {
        private _objects: Array<IAnimatable | EventDispatcher>;
        private _objectIDs: Dictionary;
        private _elapsedTime: number;
        private _timeScale: number;

        private static sCurrentObjectID: number;

        /** Create an empty juggler. */
        constructor() {
            this._elapsedTime = 0;
            this._timeScale = 1.0;
            this._objects = new Array<IAnimatable | EventDispatcher>();
            this._objectIDs = new Dictionary();
        }

        /** Adds an object to the juggler.
         *
         *  @return Unique numeric identifier for the animation. This identifier may be used
         *          to remove the object via <code>removeByID()</code>.
         */
        add(object: IAnimatable): number {
            return this.addWithID(object, Juggler.getNextID());
        }

        private addWithID(object: any | IAnimatable, objectID: number): number {
            if (object && !(object in this._objectIDs)) {
                var dispatcher: EventDispatcher = object as EventDispatcher;
                if (dispatcher) dispatcher.addEventListener(Event.REMOVE_FROM_JUGGLER, this.onRemove);

                this._objects[this._objects.length] = object;
                this._objectIDs[object] = objectID;

                return objectID;
            }
            else return 0;
        }

        /** Determines if an object has been added to the juggler. */
        contains(object: IAnimatable | any): Boolean {
            return object in this._objectIDs;
        }

        /** Removes an object from the juggler.
         *
         *  @return The (now meaningless) unique numeric identifier for the animation, or zero
         *          if the object was not found.
         */
        remove(object: IAnimatable | any): number {
            var objectID: number = 0;

            if (object && object in this._objectIDs) {
                var dispatcher: EventDispatcher = object as EventDispatcher;
                if (dispatcher) dispatcher.removeEventListener(Event.REMOVE_FROM_JUGGLER, this.onRemove);

                var index: number = this._objects.indexOf(object);
                this._objects[index] = null;

                objectID = this._objectIDs[object];
                delete this._objectIDs[object];
            }

            return objectID;
        }

        /** Removes an object from the juggler, identified by the unique numeric identifier you
         *  received when adding it.
         *
         *  <p>It's not uncommon that an animatable object is added to a juggler repeatedly,
         *  e.g. when using an object-pool. Thus, when using the <code>remove</code> method,
         *  you might accidentally remove an object that has changed its context. By using
         *  <code>removeByID</code> instead, you can be sure to avoid that, since the objectID
         *  will always be unique.</p>
         *
         *  @return if successful, the passed objectID; if the object was not found, zero.
         */
        removeByID(objectID: number): number {
            for (var i: number = this._objects.length - 1; i >= 0; --i) {
                var object: IAnimatable | any = this._objects[i];

                if (this._objectIDs[object] == objectID) {
                    this.remove(object);
                    return objectID;
                }
            }

            return 0;
        }

        /** Removes all tweens with a certain target. */
        removeTweens(target: Object): void {
            if (target == null) return;

            for (var i: number = this._objects.length - 1; i >= 0; --i) {
                var tween: Tween = this._objects[i] as Tween;
                if (tween && tween.target == target) {
                    tween.removeEventListener(Event.REMOVE_FROM_JUGGLER, this.onRemove);
                    this._objects[i] = null;
                    this._objectIDs.remove(tween);
                }
            }
        }

        /** Removes all delayed and repeated calls with a certain callback. */
        removeDelayedCalls(callback: Function): void {
            if (callback == null) return;

            for (var i: number = this._objects.length - 1; i >= 0; --i) {
                var delayedCall: DelayedCall = this._objects[i] as DelayedCall;
                if (delayedCall && delayedCall.callback == callback) {
                    delayedCall.removeEventListener(Event.REMOVE_FROM_JUGGLER, this.onRemove);
                    this._objects[i] = null;
                    this._objectIDs.remove(delayedCall);
                }
            }
        }

        /** Figures out if the juggler contains one or more tweens with a certain target. */
        containsTweens(target: Object): Boolean {
            if (target) {
                for (var i: number = this._objects.length - 1; i >= 0; --i) {
                    var tween: Tween = this._objects[i] as Tween;
                    if (tween && tween.target == target) return true;
                }
            }

            return false;
        }

        /** Figures out if the juggler contains one or more delayed calls with a certain callback. */
        containsDelayedCalls(callback: Function): Boolean {
            if (callback != null) {
                for (var i: number = this._objects.length - 1; i >= 0; --i) {
                    var delayedCall: DelayedCall = this._objects[i] as DelayedCall;
                    if (delayedCall && delayedCall.callback == callback) return true;
                }
            }

            return false;
        }

        /** Removes all objects at once. */
        purge(): void {
            // the object vector is not purged right away, because if this method is called 
            // from an 'advanceTime' call, this would make the loop crash. Instead, the
            // vector is filled with 'null' values. They will be cleaned up on the next call
            // to 'advanceTime'.

            for (var i: number = this._objects.length - 1; i >= 0; --i) {
                var object: IAnimatable | EventDispatcher = this._objects[i];
                var dispatcher: EventDispatcher = object as EventDispatcher;
                if (dispatcher) dispatcher.removeEventListener(Event.REMOVE_FROM_JUGGLER, this.onRemove);
                this._objects[i] = null;
                this._objectIDs.remove(object);
            }
        }

        /** Delays the execution of a function until <code>delay</code> seconds have passed.
         *  This method provides a convenient alternative for creating and adding a DelayedCall
         *  manually.
         *
         *  @return Unique numeric identifier for the delayed call. This identifier may be used
         *          to remove the object via <code>removeByID()</code>.
         */
        delayCall(call: Function, delay: number, ...args): number {
            if (call == null) throw new Error("call must not be null");

            var delayedCall: DelayedCall = DelayedCall.fromPool(call, delay, args);
            delayedCall.addEventListener(Event.REMOVE_FROM_JUGGLER, this.onPooledDelayedCallComplete);
            return this.add(delayedCall);
        }

        /** Runs a function at a specified interval (in seconds). A 'repeatCount' of zero
         *  means that it runs indefinitely.
         *
         *  @return Unique numeric identifier for the delayed call. This identifier may be used
         *          to remove the object via <code>removeByID()</code>.
         */
        repeatCall(call: Function, interval: number, repeatCount: number = 0, ...args): number {
            if (call == null) throw new Error("call must not be null");

            var delayedCall: DelayedCall = DelayedCall.fromPool(call, interval, args);
            delayedCall.repeatCount = repeatCount;
            delayedCall.addEventListener(Event.REMOVE_FROM_JUGGLER, this.onPooledDelayedCallComplete);
            return this.add(delayedCall);
        }

        private onPooledDelayedCallComplete(event: Event): void {
            DelayedCall.toPool(event.target as DelayedCall);
        }

        /** Utilizes a tween to animate the target object over <code>time</code> seconds. Internally,
         *  this method uses a tween instance (taken from an object pool) that is added to the
         *  juggler right away. This method provides a convenient alternative for creating 
         *  and adding a tween manually.
         *  
         *  <p>Fill 'properties' with key-value pairs that describe both the 
         *  tween and the animation target. Here is an example:</p>
         *  
         *  <pre>
         *  juggler.tween(object, 2.0, {
         *      transition: Transitions.EASE_IN_OUT,
         *      delay: 20, // -> tween.delay = 20
         *      x: 50      // -> tween.animate("x", 50)
         *  });
         *  </pre> 
         *
         *  <p>To cancel the tween, call 'Juggler.removeTweens' with the same target, or pass
         *  the returned 'IAnimatable' instance to 'Juggler.remove()'. Do not use the returned
         *  IAnimatable otherwise; it is taken from a pool and will be reused.</p>
         *
         *  <p>Note that some property types may be animated in a special way:</p>
         *  <ul>
         *    <li>If the property contains the string <code>color</code> or <code>Color</code>,
         *        it will be treated as an unsigned integer with a color value
         *        (e.g. <code>0xff0000</code> for red). Each color channel will be animated
         *        individually.</li>
         *    <li>The same happens if you append the string <code>#rgb</code> to the name.</li>
         *    <li>If you append <code>#rad</code>, the property is treated as an angle in radians,
         *        making sure it always uses the shortest possible arc for the rotation.</li>
         *    <li>The string <code>#deg</code> does the same for angles in degrees.</li>
         *  </ul>
         */
        tween(target: Object, time: number, properties: Object): number {
            if (target == null) throw new Error("target must not be null");

            var tween: Tween = Tween.fromPool(target, time);

            for (var property in properties) {
                var value: Object = properties[property];

                if (tween.hasOwnProperty(property))
                    tween[property] = value;
                else if (target.hasOwnProperty(Tween.getPropertyName(property)))
                    tween.animate(property, value as number);
                else
                    throw new Error("Invalid property: " + property);
            }

            tween.addEventListener(Event.REMOVE_FROM_JUGGLER, this.onPooledTweenComplete);
            return this.add(tween);
        }

        private onPooledTweenComplete(event: Event): void {
            Tween.toPool(event.target as Tween);
        }

        /** Advances all objects by a certain time (in seconds). */
        advanceTime(time: number): void {
            var numObjects: number = this._objects.length;
            var currentIndex: number = 0;
            var i: number;

            this._elapsedTime += time;
            time *= this._timeScale;

            if (numObjects == 0 || time == 0) return;

            // there is a high probability that the "advanceTime" function modifies the list 
            // of animatables. we must not process new objects right now (they will be processed
            // in the next frame), and we need to clean up any empty slots in the list.

            for (i = 0; i < numObjects; ++i) {
                var object: IAnimatable | EventDispatcher = this._objects[i];
                if (object) {
                    // shift objects into empty slots along the way
                    if (currentIndex != i) {
                        this._objects[currentIndex] = object;
                        this._objects[i] = null;
                    }

                    (object as IAnimatable).advanceTime(time);
                    ++currentIndex;
                }
            }

            if (currentIndex != i) {
                numObjects = this._objects.length; // count might have changed!

                while (i < numObjects)
                    this._objects[<number>(currentIndex++)] = this._objects[<number>(i++)];

                this._objects.length = currentIndex;
            }
        }

        private onRemove(event: Event): void {
            var objectID: number = this.remove(event.target);

            if (objectID) {
                var tween: Tween = event.target as Tween;
                if (tween && tween.isComplete)
                    this.addWithID(tween.nextTween, objectID);
            }
        }

        private static getNextID(): number { return ++Juggler.sCurrentObjectID; }

        /** The total life time of the juggler (in seconds). */
        get elapsedTime(): number { return this._elapsedTime; }

        /** The scale at which the time is passing. This can be used for slow motion or time laps
         *  effects. Values below '1' will make all animations run slower, values above '1' faster.
         *  @default 1.0 */
        get timeScale(): number { return this._timeScale; }
        set timeScale(value: number) { this._timeScale = value; }

        /** The actual vector that contains all objects that are currently being animated. */
        protected get objects(): Array<IAnimatable | EventDispatcher> { return this._objects; }
    }
}
