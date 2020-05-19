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
    export class DelayedCall extends EventDispatcher implements IAnimatable {
        private _currentTime: number;
        private _totalTime: number;
        private _callback: Function;
        private _args: Array<any>;
        private _repeatCount: number;

        /** Creates a delayed call. */
        constructor(callback: Function, delay: number, args: Array<any> = null) {
            super();
            this.reset(callback, delay, args);
        }

        /** Resets the delayed call to its default values, which is useful for pooling. */
        reset(callback: Function, delay: number, args: Array<any> = null): DelayedCall {
            this._currentTime = 0;
            this._totalTime = Math.max(delay, 0.0001);
            this._callback = callback;
            this._args = args;
            this._repeatCount = 1;

            return this;
        }

        /** @inheritDoc */
        advanceTime(time: number): void {
            var previousTime: number = this._currentTime;
            this._currentTime += time;

            if (this._currentTime > this._totalTime)
                this._currentTime = this._totalTime;

            if (previousTime < this._totalTime && this._currentTime >= this._totalTime) {
                if (this._repeatCount == 0 || this._repeatCount > 1) {
                    this._callback.apply(null, this._args);

                    if (this._repeatCount > 0) this._repeatCount -= 1;
                    this._currentTime = 0;
                    this.advanceTime((previousTime + time) - this._totalTime);
                }
                else {
                    // save call & args: they might be changed through an event listener
                    var call: Function = this._callback;
                    var args: Array<any> = this._args;

                    // in the callback, people might want to call "reset" and re-add it to the
                    // juggler; so this event has to be dispatched *before* executing 'call'.
                    this.dispatchEventWith(Event.REMOVE_FROM_JUGGLER);
                    call.apply(null, args);
                }
            }
        }

        /** Advances the delayed call so that it is executed right away. If 'repeatCount' is
          * anything else than '1', this method will complete only the current iteration. */
        complete(): void {
            var restTime: number = this._totalTime - this._currentTime;
            if (restTime > 0) this.advanceTime(restTime);
        }

        /** Indicates if enough time has passed, and the call has already been executed. */
        get isComplete(): Boolean {
            return this._repeatCount == 1 && this._currentTime >= this._totalTime;
        }

        /** The time for which calls will be delayed (in seconds). */
        get totalTime(): number { return this._totalTime; }

        /** The time that has already passed (in seconds). */
        get currentTime(): number { return this._currentTime; }

        /** The number of times the call will be repeated. 
         *  Set to '0' to repeat indefinitely. @default 1 */
        get repeatCount(): number { return this._repeatCount; }
        set repeatCount(value: number) { this._repeatCount = value; }

        /** The callback that will be executed when the time is up. */
        get callback(): Function { return this._callback; }

        /** The arguments that the callback will be executed with.
         *  Beware: not a copy, but the actual object! */
        get arguments(): Array<any> { return this._args; }

        // delayed call pooling

        private static sPool: Array<DelayedCall> = new Array<DelayedCall>();

        /** @private */
        static fromPool(call: Function, delay: number,
            args: Array<any> = null): DelayedCall {
            if (DelayedCall.sPool.length) return DelayedCall.sPool.pop().reset(call, delay, args);
            else return new DelayedCall(call, delay, args);
        }

        /** @private */
        static toPool(delayedCall: DelayedCall): void {
            // reset any object-references, to make sure we don't prevent any garbage collection
            delayedCall._callback = null;
            delayedCall._args = null;
            delayedCall.removeEventListeners();
            DelayedCall.sPool.push(delayedCall);
        }
    }
}