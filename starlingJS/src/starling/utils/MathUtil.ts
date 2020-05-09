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

    export class MathUtil {
        private static readonly TWO_PI: number = Math.PI * 2.0;

        /** @private */
        constructor() { throw new AbstractClassError(); }

        /** Calculates the intersection point between the xy-plane and an infinite line
         *  that is defined by two 3D points in the same coordinate system. */
        static intersectLineWithXYPlane(pointA: Vector3D, pointB: Vector3D,
            out?: Point): Point {
            if (!out) out = new Point();

            var vectorX: number = pointB.x - pointA.x;
            var vectorY: number = pointB.y - pointA.y;
            var vectorZ: number = pointB.z - pointA.z;
            var lambda: number = -pointA.z / vectorZ;

            out.x = pointA.x + lambda * vectorX;
            out.y = pointA.y + lambda * vectorY;

            return out;
        }

        /** Calculates if the point <code>p</code> is inside the triangle <code>a-b-c</code>. */
        static isPointInTriangle(p: Point, a: Point, b: Point, c: Point): boolean {
            // This algorithm is described well in this article:
            // http://www.blackpawn.com/texts/pointinpoly/default.html

            var v0x: number = c.x - a.x;
            var v0y: number = c.y - a.y;
            var v1x: number = b.x - a.x;
            var v1y: number = b.y - a.y;
            var v2x: number = p.x - a.x;
            var v2y: number = p.y - a.y;

            var dot00: number = v0x * v0x + v0y * v0y;
            var dot01: number = v0x * v1x + v0y * v1y;
            var dot02: number = v0x * v2x + v0y * v2y;
            var dot11: number = v1x * v1x + v1y * v1y;
            var dot12: number = v1x * v2x + v1y * v2y;

            var invDen: number = 1.0 / (dot00 * dot11 - dot01 * dot01);
            var u: number = (dot11 * dot02 - dot01 * dot12) * invDen;
            var v: number = (dot00 * dot12 - dot01 * dot02) * invDen;

            return (u >= 0) && (v >= 0) && (u + v < 1);
        }

        /** Moves a radian angle into the range [-PI, +PI], while keeping the direction intact. */
        static normalizeAngle(angle: number): number {
            // move to equivalent value in range [0 deg, 360 deg] without a loop
            angle = angle % MathUtil.TWO_PI;

            // move to [-180 deg, +180 deg]
            if (angle < -Math.PI) angle += MathUtil.TWO_PI;
            if (angle > Math.PI) angle -= MathUtil.TWO_PI;

            return angle;
        }

        /** Returns the next power of two that is equal to or bigger than the specified number. */
        static getNextPowerOfTwo(number: number): number {
            if (typeof number=='number' && number > 0 && (number & (number - 1)) == 0) // see: http://goo.gl/D9kPj
                return number;
            else {
                var result: number = 1;
                number -= 0.000000001; // avoid floating point rounding errors

                while (result < number) result <<= 1;
                return result;
            }
        }

        /** Indicates if two float (number) values are equal, give or take <code>epsilon</code>. */
        static isEquivalent(a: number, b: number, epsilon: number = 0.0001): boolean {
            return (a - epsilon < b) && (a + epsilon > b);
        }

        /** Returns the larger of the two values. Different to the native <code>Math.max</code>,
         *  this doesn't create any temporary objects when using the AOT compiler. */
        static max(a: number, b: number): number {
            return a > b ? a : b;
        }

        /** Returns the smaller of the two values. Different to the native <code>Math.min</code>,
         *  this doesn't create any temporary objects when using the AOT compiler. */
        static min(a: number, b: number): number {
            return a < b ? a : b;
        }

        /** Moves <code>value</code> into the range between <code>min</code> and <code>max</code>. */
        static clamp(value: number, min: number, max: number): number {
            return value < min ? min : (value > max ? max : value);
        }
    }
}