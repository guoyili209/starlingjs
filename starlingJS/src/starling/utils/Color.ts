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
    export class Color {
        public static readonly WHITE: number = 0xffffff;
        public static readonly SILVER: number = 0xc0c0c0;
        public static readonly GRAY: number = 0x808080;
        public static readonly BLACK: number = 0x000000;
        public static readonly RED: number = 0xff0000;
        public static readonly MAROON: number = 0x800000;
        public static readonly YELLOW: number = 0xffff00;
        public static readonly OLIVE: number = 0x808000;
        public static readonly LIME: number = 0x00ff00;
        public static readonly GREEN: number = 0x008000;
        public static readonly AQUA: number = 0x00ffff;
        public static readonly TEAL: number = 0x008080;
        public static readonly BLUE: number = 0x0000ff;
        public static readonly NAVY: number = 0x000080;
        public static readonly FUCHSIA: number = 0xff00ff;
        public static readonly PURPLE: number = 0x800080;

        /** Returns the alpha part of an ARGB color (0 - 255). */
        static getAlpha(color: number): number { return (color >> 24) & 0xff; }

        /** Returns the red part of an (A)RGB color (0 - 255). */
        static getRed(color: number): number { return (color >> 16) & 0xff; }

        /** Returns the green part of an (A)RGB color (0 - 255). */
        static getGreen(color: number): number { return (color >> 8) & 0xff; }

        /** Returns the blue part of an (A)RGB color (0 - 255). */
        static getBlue(color: number): number { return color & 0xff; }

        /** Sets the alpha part of an ARGB color (0 - 255). */
        static setAlpha(color: number, alpha: number): number {
            return (color & 0x00ffffff) | (alpha & 0xff) << 24;
        }

        /** Sets the red part of an (A)RGB color (0 - 255). */
        static setRed(color: number, red: number): number {
            return (color & 0xff00ffff) | (red & 0xff) << 16;
        }

        /** Sets the green part of an (A)RGB color (0 - 255). */
        static setGreen(color: number, green: number): number {
            return (color & 0xffff00ff) | (green & 0xff) << 8;
        }

        /** Sets the blue part of an (A)RGB color (0 - 255). */
        static setBlue(color: number, blue: number): number {
            return (color & 0xffffff00) | (blue & 0xff);
        }

        /** Creates an RGB color, stored in an unsigned integer. Channels are expected
         *  in the range 0 - 255. */
        static rgb(red: number, green: number, blue: number): number {
            return (red << 16) | (green << 8) | blue;
        }

        /** Creates an ARGB color, stored in an unsigned integer. Channels are expected
         *  in the range 0 - 255. */
        static argb(alpha: number, red: number, green: number, blue: number): number {
            return (alpha << 24) | (red << 16) | (green << 8) | blue;
        }

        /** Creates an RGB color from hue, saturation and value (brightness).
         *  Assumes hue, saturation, and value are contained in the range [0, 1].
         */
        static hsv(hue: number, saturation: number, value: number): number {
            var r: number = 0, g: number = 0, b: number = 0;
            var i: number = Math.floor(hue * 6);
            var f: number = hue * 6 - i;
            var p: number = value * (1 - saturation);
            var q: number = value * (1 - f * saturation);
            var t: number = value * (1 - (1 - f) * saturation);

            switch (<Number>(i % 6)) {
                case 0: r = value; g = t; b = p; break;
                case 1: r = q; g = value; b = p; break;
                case 2: r = p; g = value; b = t; break;
                case 3: r = p; g = q; b = value; break;
                case 4: r = t; g = p; b = value; break;
                case 5: r = value; g = p; b = q; break;
            }

            return Color.rgb(Math.ceil(r * 255), Math.ceil(g * 255), Math.ceil(b * 255));
        }

        /** Creates an RGB color from hue, saturation and lightness.
         *  Assumes hue, saturation, and lightness are contained in the range [0, 1].
         */
        static hsl(hue: number, saturation: number, lightness: number): number {
            var r: number = 0, g: number = 0, b: number = 0;
            var c: number = (1.0 - Math.abs(2.0 * lightness - 1.0)) * saturation;
            var h2: number = hue * 6.0;
            var x: number = c * (1.0 - Math.abs(h2 % 2 - 1.0));
            var m: number = lightness - c / 2.0;

            switch (<Number>(h2 % 6)) {
                case 0: r = c + m; g = x + m; b = m; break;
                case 1: r = x + m; g = c + m; b = m; break;
                case 2: r = m; g = c + m; b = x + m; break;
                case 3: r = m; g = x + m; b = c + m; break;
                case 4: r = x + m; g = m; b = c + m; break;
                case 5: r = c + m; g = m; b = x + m; break;
            }

            return Color.rgb(Math.ceil(r * 255), Math.ceil(g * 255), Math.ceil(b * 255));
        }

        /** Converts an RGB color into a vector with HSV components.
         *
         *  @param rgb  the standard RGB color
         *  @param hsv  a vector to be used for the result; passing null will create a new one.
         *  @return     a vector containing hue, saturation, and value, in this order. Range: [0..1]
         */
        static rgbToHsv(rgb: number, hsv: Array<number>): Array<number> {
            if (hsv == null) hsv = new Array<number>(3);

            var r: number = Color.getRed(rgb) / 255.0;
            var g: number = Color.getGreen(rgb) / 255.0;
            var b: number = Color.getBlue(rgb) / 255.0;
            var cMax: number = Math.max(r, g, b);
            var cMin: number = Math.min(r, g, b);
            var delta: number = cMax - cMin;

            // hue
            if (delta == 0) hsv[0] = 0;
            else if (cMax == r) hsv[0] = (((g - b) / delta) % 6) / 6.0;
            else if (cMax == g) hsv[0] = ((b - r) / delta + 2) / 6.0;
            else if (cMax == b) hsv[0] = ((r - g) / delta + 4) / 6.0;

            // normalize [0..1]
            while (hsv[0] < 0.0) hsv[0] += 1.0;
            while (hsv[0] >= 1.0) hsv[0] -= 1.0;

            // value / brightness
            hsv[2] = cMax;

            // saturation
            hsv[1] = cMax == 0 ? 0 : delta / cMax;

            return hsv;
        }

        /** Converts an RGB color into a vector with HSV components.
         *
         *  @param rgb  the standard RGB color
         *  @param hsl  a vector to be used for the result; passing null will create a new one.
         *  @return     a vector containing hue, saturation, and lightness, in this order. Range: [0..1]
         */
        static rgbToHsl(rgb: number, hsl: Array<number>): Array<number> {
            if (hsl == null) hsl = new Array<number>(3);

            var r: number = Color.getRed(rgb) / 255.0;
            var g: number = Color.getGreen(rgb) / 255.0;
            var b: number = Color.getBlue(rgb) / 255.0;
            var cMax: number = Math.max(r, g, b);
            var cMin: number = Math.min(r, g, b);
            var delta: number = cMax - cMin;

            // hue
            if (delta == 0) hsl[0] = 0;
            else if (cMax == r) hsl[0] = (((g - b) / delta) % 6) / 6.0;
            else if (cMax == g) hsl[0] = ((b - r) / delta + 2) / 6.0;
            else if (cMax == b) hsl[0] = ((r - g) / delta + 4) / 6.0;

            // normalize [0..1]
            while (hsl[0] < 0.0) hsl[0] += 1.0;
            while (hsl[0] >= 1.0) hsl[0] -= 1.0;

            // lightness
            hsl[2] = (cMax + cMin) * 0.5;

            // saturation
            hsl[1] = delta == 0 ? 0 : delta / (1.0 - Math.abs(2.0 * hsl[2] - 1.0));

            return hsl;
        }

        /** Converts a color to a vector containing the RGBA components (in this order) scaled
         *  between 0 and 1. */
        static toVector(color: number, out: Array<number>): Array<number> {
            if (out == null) out = new Array<number>(4);

            out[0] = ((color >> 16) & 0xff) / 255.0;
            out[1] = ((color >> 8) & 0xff) / 255.0;
            out[2] = (color & 0xff) / 255.0;
            out[3] = ((color >> 24) & 0xff) / 255.0;

            return out;
        }

        /** Multiplies all channels of an (A)RGB color with a certain factor. */
        static multiply(color: number, factor: number): number {
            if (factor == 0.0) return 0x0;

            var alpha: number = ((color >> 24) & 0xff) * factor;
            var red: number = ((color >> 16) & 0xff) * factor;
            var green: number = ((color >> 8) & 0xff) * factor;
            var blue: number = (color & 0xff) * factor;

            if (alpha > 255) alpha = 255;
            if (red > 255) red = 255;
            if (green > 255) green = 255;
            if (blue > 255) blue = 255;

            return Color.argb(alpha, red, green, blue);
        }

        /** Calculates a smooth transition between one color to the next.
         *  <code>ratio</code> is expected between 0 and 1. */
        static interpolate(startColor: number, endColor: number, ratio: number): number {
            var startA: number = (startColor >> 24) & 0xff;
            var startR: number = (startColor >> 16) & 0xff;
            var startG: number = (startColor >> 8) & 0xff;
            var startB: number = (startColor) & 0xff;

            var endA: number = (endColor >> 24) & 0xff;
            var endR: number = (endColor >> 16) & 0xff;
            var endG: number = (endColor >> 8) & 0xff;
            var endB: number = (endColor) & 0xff;

            var newA: number = startA + (endA - startA) * ratio;
            var newR: number = startR + (endR - startR) * ratio;
            var newG: number = startG + (endG - startG) * ratio;
            var newB: number = startB + (endB - startB) * ratio;

            return (newA << 24) | (newR << 16) | (newG << 8) | newB;
        }

        /** @private */
        constructor() { throw new AbstractClassError(); }
    }
}