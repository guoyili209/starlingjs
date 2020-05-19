// =================================================================================================
//
//	Starling Framework
//	Copyright Gamua GmbH. All Rights Reserved.
//
//	This program is free software. You can redistribute and/or modify it
//	in accordance with the terms of the accompanying license agreement.
//
// =================================================================================================
//
// easing functions thankfully taken from http://dojotoolkit.org
//                                    and http://www.robertpenner.com/easing
//

module StarlingJS {
    export class Transitions {
        static readonly LINEAR: string = "linear";
        static readonly EASE_IN: string = "easeIn";
        static readonly EASE_OUT: string = "easeOut";
        static readonly EASE_IN_OUT: string = "easeInOut";
        static readonly EASE_OUT_IN: string = "easeOutIn";
        static readonly EASE_IN_BACK: string = "easeInBack";
        static readonly EASE_OUT_BACK: string = "easeOutBack";
        static readonly EASE_IN_OUT_BACK: string = "easeInOutBack";
        static readonly EASE_OUT_IN_BACK: string = "easeOutInBack";
        static readonly EASE_IN_ELASTIC: string = "easeInElastic";
        static readonly EASE_OUT_ELASTIC: string = "easeOutElastic";
        static readonly EASE_IN_OUT_ELASTIC: string = "easeInOutElastic";
        static readonly EASE_OUT_IN_ELASTIC: string = "easeOutInElastic";
        static readonly EASE_IN_BOUNCE: string = "easeInBounce";
        static readonly EASE_OUT_BOUNCE: string = "easeOutBounce";
        static readonly EASE_IN_OUT_BOUNCE: string = "easeInOutBounce";
        static readonly EASE_OUT_IN_BOUNCE: string = "easeOutInBounce";

        private static sTransitions: Dictionary;

        /** @private */
        constructor() { throw new AbstractClassError(); }

        /** Returns the transition function that was registered under a certain name. */
        static getTransition(name: string): Function {
            if (Transitions.sTransitions == null) Transitions.registerDefaults();
            return Transitions.sTransitions[name];
        }

        /** Registers a new transition function under a certain name. */
        static register(name: string, func: Function): void {
            if (Transitions.sTransitions == null) Transitions.registerDefaults();
            Transitions.sTransitions[name] = func;
        }

        private static registerDefaults(): void {
            Transitions.sTransitions = new Dictionary();

            Transitions.register(Transitions.LINEAR, this.linear);
            Transitions.register(Transitions.EASE_IN, this.easeIn);
            Transitions.register(Transitions.EASE_OUT, this.easeOut);
            Transitions.register(Transitions.EASE_IN_OUT, this.easeInOut);
            Transitions.register(Transitions.EASE_OUT_IN, this.easeOutIn);
            Transitions.register(Transitions.EASE_IN_BACK, this.easeInBack);
            Transitions.register(Transitions.EASE_OUT_BACK, this.easeOutBack);
            Transitions.register(Transitions.EASE_IN_OUT_BACK, this.easeInOutBack);
            Transitions.register(Transitions.EASE_OUT_IN_BACK, this.easeOutInBack);
            Transitions.register(Transitions.EASE_IN_ELASTIC, this.easeInElastic);
            Transitions.register(Transitions.EASE_OUT_ELASTIC, this.easeOutElastic);
            Transitions.register(Transitions.EASE_IN_OUT_ELASTIC, this.easeInOutElastic);
            Transitions.register(Transitions.EASE_OUT_IN_ELASTIC, this.easeOutInElastic);
            Transitions.register(Transitions.EASE_IN_BOUNCE, this.easeInBounce);
            Transitions.register(Transitions.EASE_OUT_BOUNCE, this.easeOutBounce);
            Transitions.register(Transitions.EASE_IN_OUT_BOUNCE, this.easeInOutBounce);
            Transitions.register(Transitions.EASE_OUT_IN_BOUNCE, this.easeOutInBounce);
        }

        // transition functions

        protected static linear(ratio: number): number {
            return ratio;
        }

        protected static easeIn(ratio: number): number {
            return ratio * ratio * ratio;
        }

        protected static easeOut(ratio: number): number {
            var invRatio: number = ratio - 1.0;
            return invRatio * invRatio * invRatio + 1;
        }

        protected static easeInOut(ratio: number): number {
            return Transitions.easeCombined(this.easeIn, this.easeOut, ratio);
        }

        protected static easeOutIn(ratio: number): number {
            return Transitions.easeCombined(this.easeOut, this.easeIn, ratio);
        }

        protected static easeInBack(ratio: number): number {
            var s: number = 1.70158;
            return Math.pow(ratio, 2) * ((s + 1.0) * ratio - s);
        }

        protected static easeOutBack(ratio: number): number {
            var invRatio: number = ratio - 1.0;
            var s: number = 1.70158;
            return Math.pow(invRatio, 2) * ((s + 1.0) * invRatio + s) + 1.0;
        }

        protected static easeInOutBack(ratio: number): number {
            return Transitions.easeCombined(this.easeInBack, this.easeOutBack, ratio);
        }

        protected static easeOutInBack(ratio: number): number {
            return Transitions.easeCombined(this.easeOutBack, this.easeInBack, ratio);
        }

        protected static easeInElastic(ratio: number): number {
            if (ratio == 0 || ratio == 1) return ratio;
            else {
                var p: number = 0.3;
                var s: number = p / 4.0;
                var invRatio: number = ratio - 1;
                return -1.0 * Math.pow(2.0, 10.0 * invRatio) * Math.sin((invRatio - s) * (2.0 * Math.PI) / p);
            }
        }

        protected static easeOutElastic(ratio: number): number {
            if (ratio == 0 || ratio == 1) return ratio;
            else {
                var p: number = 0.3;
                var s: number = p / 4.0;
                return Math.pow(2.0, -10.0 * ratio) * Math.sin((ratio - s) * (2.0 * Math.PI) / p) + 1;
            }
        }

        protected static easeInOutElastic(ratio: number): number {
            return Transitions.easeCombined(this.easeInElastic, this.easeOutElastic, ratio);
        }

        protected static easeOutInElastic(ratio: number): number {
            return Transitions.easeCombined(this.easeOutElastic, this.easeInElastic, ratio);
        }

        protected static easeInBounce(ratio: number): number {
            return 1.0 - Transitions.easeOutBounce(1.0 - ratio);
        }

        protected static easeOutBounce(ratio: number): number {
            var s: number = 7.5625;
            var p: number = 2.75;
            var l: number;
            if (ratio < (1.0 / p)) {
                l = s * Math.pow(ratio, 2);
            }
            else {
                if (ratio < (2.0 / p)) {
                    ratio -= 1.5 / p;
                    l = s * Math.pow(ratio, 2) + 0.75;
                }
                else {
                    if (ratio < 2.5 / p) {
                        ratio -= 2.25 / p;
                        l = s * Math.pow(ratio, 2) + 0.9375;
                    }
                    else {
                        ratio -= 2.625 / p;
                        l = s * Math.pow(ratio, 2) + 0.984375;
                    }
                }
            }
            return l;
        }

        protected static easeInOutBounce(ratio: number): number {
            return Transitions.easeCombined(this.easeInBounce, this.easeOutBounce, ratio);
        }

        protected static easeOutInBounce(ratio: number): number {
            return Transitions.easeCombined(this.easeOutBounce, this.easeInBounce, ratio);
        }

        protected static easeCombined(startFunc: Function, endFunc: Function, ratio: number): number {
            if (ratio < 0.5) return 0.5 * startFunc(ratio * 2.0);
            else return 0.5 * endFunc((ratio - 0.5) * 2.0) + 0.5;
        }
    }
}