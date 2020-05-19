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
    export class Tween extends EventDispatcher implements IAnimatable {
        private static readonly HINT_MARKER: string = '#';

        private _target: Object;
        private _transitionFunc: Function;
        private _transitionName: string;

        private _properties: Array<string>;
        private _startValues: Array<number>;
        private _endValues: Array<number>;
        private _updateFuncs: Array<Function>;

        private _onStart: Function;
        private _onUpdate: Function;
        private _onRepeat: Function;
        private _onComplete: Function;

        private _onStartArgs: Array<any>;
        private _onUpdateArgs: Array<any>;
        private _onRepeatArgs: Array<any>;
        private _onCompleteArgs: Array<any>;

        private _totalTime: number;
        private _currentTime: number;
        private _progress: number;
        private _delay: number;
        private _roundToInt: boolean;
        private _nextTween: Tween;
        private _repeatCount: number;
        private _repeatDelay: number;
        private _reverse: boolean;
        private _currentCycle: number;

        /** Creates a tween with a target, duration (in seconds) and a transition function.
         *  @param target the object that you want to animate
         *  @param time the duration of the Tween (in seconds)
         *  @param transition can be either a string (e.g. one of the constants defined in the
         *         Transitions class) or a function. Look up the 'Transitions' class for a   
         *         documentation about the required function signature. */
        constructor(target: Object, time: number, transition: Object = "linear") {
            super();
            this.reset(target, time, transition);
        }

        /** Resets the tween to its default values. Useful for pooling tweens. */
        reset(target: Object, time: number, transition: Object = "linear"): Tween {
            this._target = target;
            this._currentTime = 0.0;
            this._totalTime = Math.max(0.0001, time);
            this._progress = 0.0;
            this._delay = this._repeatDelay = 0.0;
            this._onStart = this._onUpdate = this._onRepeat = this._onComplete = null;
            this._onStartArgs = this._onUpdateArgs = this._onRepeatArgs = this._onCompleteArgs = null;
            this._roundToInt = this._reverse = false;
            this._repeatCount = 1;
            this._currentCycle = -1;
            this._nextTween = null;

            if (typeof transition == 'string')
                transition = transition as string;
            else if (transition instanceof Function)
                this.transitionFunc = transition as Function;
            else
                throw new Error("Transition must be either a string or a function");

            if (this._properties) this._properties.length = 0; else this._properties = new Array<string>();
            if (this._startValues) this._startValues.length = 0; else this._startValues = new Array<number>();
            if (this._endValues) this._endValues.length = 0; else this._endValues = new Array<number>();
            if (this._updateFuncs) this._updateFuncs.length = 0; else this._updateFuncs = new Array<Function>();

            return this;
        }

        /** Animates the property of the target to a certain value. You can call this method
         *  multiple times on one tween.
         *
         *  <p>Some property types are handled in a special way:</p>
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
        animate(property: string, endValue: number): void {
            if (this._target == null) return; // tweening null just does nothing.

            var pos: number = this._properties.length;
            var updateFunc: Function = this.getUpdateFuncFromProperty(property);

            this._properties[pos] = Tween.getPropertyName(property);
            this._startValues[pos] = Number.NaN;
            this._endValues[pos] = endValue;
            this._updateFuncs[pos] = updateFunc;
        }

        /** Animates the 'scaleX' and 'scaleY' properties of an object simultaneously. */
        scaleTo(factor: number): void {
            this.animate("scaleX", factor);
            this.animate("scaleY", factor);
        }

        /** Animates the 'x' and 'y' properties of an object simultaneously. */
        moveTo(x: number, y: number): void {
            this.animate("x", x);
            this.animate("y", y);
        }

        /** Animates the 'alpha' property of an object to a certain target value. */
        fadeTo(alpha: number): void {
            this.animate("alpha", alpha);
        }

        /** Animates the 'rotation' property of an object to a certain target value, using the
         *  smallest possible arc. 'type' may be either 'rad' or 'deg', depending on the unit of
         *  measurement. */
        rotateTo(angle: number, type: string = "rad"): void {
            this.animate("rotation#" + type, angle);
        }

        /** @inheritDoc */
        advanceTime(time: number): void {
            if (time == 0 || (this._repeatCount == 1 && this._currentTime == this._totalTime)) return;

            var i: number;
            var previousTime: number = this._currentTime;
            var restTime: number = this._totalTime - this._currentTime;
            var carryOverTime: number = time > restTime ? time - restTime : 0.0;

            this._currentTime += time;

            if (this._currentTime <= 0)
                return; // the delay is not over yet
            else if (this._currentTime > this._totalTime)
                this._currentTime = this._totalTime;

            if (this._currentCycle < 0 && previousTime <= 0 && this._currentTime > 0) {
                this._currentCycle++;
                if (this._onStart != null) this._onStart.apply(this, this._onStartArgs);
            }

            var ratio: number = this._currentTime / this._totalTime;
            var reversed: boolean = this._reverse && (this._currentCycle % 2 == 1);
            var numProperties: number = this._startValues.length;
            this._progress = reversed ? this._transitionFunc(1.0 - ratio) : this._transitionFunc(ratio);

            for (i = 0; i < numProperties; ++i) {
                if (this._startValues[i] != this._startValues[i]) // isNaN check - "isNaN" causes allocation!
                    this._startValues[i] = this._target[this._properties[i]] as number;

                var updateFunc: Function = this._updateFuncs[i] as Function;
                updateFunc(this._properties[i], this._startValues[i], this._endValues[i]);
            }

            if (this._onUpdate != null)
                this._onUpdate.apply(this, this._onUpdateArgs);

            if (previousTime < this._totalTime && this._currentTime >= this._totalTime) {
                if (this._repeatCount == 0 || this._repeatCount > 1) {
                    this._currentTime = -this._repeatDelay;
                    this._currentCycle++;
                    if (this._repeatCount > 1) this._repeatCount--;
                    if (this._onRepeat != null) this._onRepeat.apply(this, this._onRepeatArgs);
                }
                else {
                    // save callback & args: they might be changed through an event listener
                    var onComplete: Function = this._onComplete;
                    var onCompleteArgs: Array<any> = this._onCompleteArgs;

                    // in the 'onComplete' callback, people might want to call "tween.reset" and
                    // add it to another juggler; so this event has to be dispatched *before*
                    // executing 'onComplete'.
                    this.dispatchEventWith(Event.REMOVE_FROM_JUGGLER);
                    if (onComplete != null) onComplete.apply(this, onCompleteArgs);
                    if (this._currentTime == 0) carryOverTime = 0; // tween was reset
                }
            }

            if (carryOverTime)
                this.advanceTime(carryOverTime);
        }

        // animation hints

        private getUpdateFuncFromProperty(property: string): Function {
            var updateFunc: Function;
            var hint: string = Tween.getPropertyHint(property);

            switch (hint) {
                case null: updateFunc = this.updateStandard; break;
                case "rgb": updateFunc = this.updateRgb; break;
                case "rad": updateFunc = this.updateRad; break;
                case "deg": updateFunc = this.updateDeg; break;
                default:
                    console.log("[Starling] Ignoring unknown property hint:", hint);
                    updateFunc = this.updateStandard;
            }

            return updateFunc;
        }

        /** @private */
        static getPropertyHint(property: string): string {
            // colorization is special; it does not require a hint marker, just the word 'color'.
            if (property.indexOf("color") != -1 || property.indexOf("Color") != -1)
                return "rgb";

            var hintMarkerIndex: number = property.indexOf(Tween.HINT_MARKER);
            if (hintMarkerIndex != -1) return property.substr(hintMarkerIndex + 1);
            else return null;
        }

        /** @private */
        static getPropertyName(property: string): string {
            var hintMarkerIndex: number = property.indexOf(Tween.HINT_MARKER);
            if (hintMarkerIndex != -1) return property.substring(0, hintMarkerIndex);
            else return property;
        }

        private updateStandard(property: string, startValue: number, endValue: number): void {
            var newValue: number = startValue + this._progress * (endValue - startValue);
            if (this._roundToInt) newValue = Math.round(newValue);
            this._target[property] = newValue;
        }

        private updateRgb(property: string, startValue: number, endValue: number): void {
            this._target[property] = Color.interpolate(<number>(startValue), <number>(endValue), this._progress);
        }

        private updateRad(property: string, startValue: number, endValue: number): void {
            this.updateAngle(Math.PI, property, startValue, endValue);
        }

        private updateDeg(property: string, startValue: number, endValue: number): void {
            this.updateAngle(180, property, startValue, endValue);
        }

        private updateAngle(pi: number, property: string, startValue: number, endValue: number): void {
            while (Math.abs(endValue - startValue) > pi) {
                if (startValue < endValue) endValue -= 2.0 * pi;
                else endValue += 2.0 * pi;
            }

            this.updateStandard(property, startValue, endValue);
        }

        /** The end value a certain property is animated to. Throws an ArgumentError if the 
         *  property is not being animated. */
        getEndValue(property: string): number {
            var index: number = this._properties.indexOf(property);
            if (index == -1) throw new Error("The property '" + property + "' is not animated");
            else return this._endValues[index] as number;
        }

        /** Indicates if a property with the given name is being animated by this tween. */
        animatesProperty(property: string): boolean {
            return this._properties.indexOf(property) != -1;
        }

        /** Indicates if the tween is finished. */
        get isComplete(): boolean {
            return this._currentTime >= this._totalTime && this._repeatCount == 1;
        }

        /** The target object that is animated. */
        get target(): Object { return this._target; }

        /** The transition method used for the animation. @see Transitions */
        get transition(): string { return this._transitionName; }
        set transition(value: string) {
            this._transitionName = value;
            this._transitionFunc = Transitions.getTransition(value);

            if (this._transitionFunc == null)
                throw new Error("Invalid transiton: " + value);
        }

        /** The actual transition function used for the animation. */
        get transitionFunc(): Function { return this._transitionFunc; }
        set transitionFunc(value: Function) {
            this._transitionName = "custom";
            this._transitionFunc = value;
        }

        /** The total time the tween will take per repetition (in seconds). */
        get totalTime(): number { return this._totalTime; }

        /** The time that has passed since the tween was created (in seconds). */
        get currentTime(): number { return this._currentTime; }

        /** The current progress between 0 and 1, as calculated by the transition function. */
        get progress(): number { return this._progress; }

        /** The delay before the tween is started (in seconds). @default 0 */
        get delay(): number { return this._delay; }
        set delay(value: number) {
            this._currentTime = this._currentTime + this._delay - value;
            this._delay = value;
        }

        /** The number of times the tween will be executed. 
         *  Set to '0' to tween indefinitely. @default 1 */
        get repeatCount(): number { return this._repeatCount; }
        set repeatCount(value: number) { this._repeatCount = value; }

        /** The amount of time to wait between repeat cycles (in seconds). @default 0 */
        get repeatDelay(): number { return this._repeatDelay; }
        set repeatDelay(value: number) { this._repeatDelay = value; }

        /** Indicates if the tween should be reversed when it is repeating. If enabled, 
         *  every second repetition will be reversed. @default false */
        get reverse(): boolean { return this._reverse; }
        set reverse(value: boolean) { this._reverse = value; }

        /** Indicates if the numeric values should be cast to Integers. @default false */
        get roundToInt(): boolean { return this._roundToInt; }
        set roundToInt(value: boolean) { this._roundToInt = value; }

        /** A function that will be called when the tween starts (after a possible delay). */
        get onStart(): Function { return this._onStart; }
        set onStart(value: Function) { this._onStart = value; }

        /** A function that will be called each time the tween is advanced. */
        get onUpdate(): Function { return this._onUpdate; }
        set onUpdate(value: Function) { this._onUpdate = value; }

        /** A function that will be called each time the tween finishes one repetition
         *  (except the last, which will trigger 'onComplete'). */
        get onRepeat(): Function { return this._onRepeat; }
        set onRepeat(value: Function) { this._onRepeat = value; }

        /** A function that will be called when the tween is complete. */
        get onComplete(): Function { return this._onComplete; }
        set onComplete(value: Function) { this._onComplete = value; }

        /** The arguments that will be passed to the 'onStart' function. */
        get onStartArgs(): Array<any> { return this._onStartArgs; }
        set onStartArgs(value: Array<any>) { this._onStartArgs = value; }

        /** The arguments that will be passed to the 'onUpdate' function. */
        get onUpdateArgs(): Array<any> { return this._onUpdateArgs; }
        set onUpdateArgs(value: Array<any>) { this._onUpdateArgs = value; }

        /** The arguments that will be passed to the 'onRepeat' function. */
        get onRepeatArgs(): Array<any> { return this._onRepeatArgs; }
        set onRepeatArgs(value: Array<any>) { this._onRepeatArgs = value; }

        /** The arguments that will be passed to the 'onComplete' function. */
        get onCompleteArgs(): Array<any> { return this._onCompleteArgs; }
        set onCompleteArgs(value: Array<any>) { this._onCompleteArgs = value; }

        /** Another tween that will be started (i.e. added to the same juggler) as soon as 
         *  this tween is completed. */
        get nextTween(): Tween { return this._nextTween; }
        set nextTween(value: Tween) { this._nextTween = value; }

        // tween pooling

        private static sTweenPool: Array<Tween> = new Array<Tween>();

        /** @private */
        static fromPool(target: Object, time: number,
            transition: Object = "linear"): Tween {
            if (Tween.sTweenPool.length) return Tween.sTweenPool.pop().reset(target, time, transition);
            else return new Tween(target, time, transition);
        }

        /** @private */
        static toPool(tween: Tween): void {
            // reset any object-references, to make sure we don't prevent any garbage collection
            tween._onStart = tween._onUpdate = tween._onRepeat = tween._onComplete = null;
            tween._onStartArgs = tween._onUpdateArgs = tween._onRepeatArgs = tween._onCompleteArgs = null;
            tween._target = null;
            tween._transitionFunc = null;
            tween.removeEventListeners();
            Tween.sTweenPool.push(tween);
        }
    }
}
