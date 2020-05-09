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
    export class Align {
        /** @private */
        constructor() { throw new AbstractClassError(); }

        /** Horizontal left alignment. */
        public static readonly LEFT: string = "left";

        /** Horizontal right alignment. */
        public static readonly RIGHT: string = "right";

        /** Vertical top alignment. */
        public static readonly TOP: string = "top";

        /** Vertical bottom alignment. */
        public static readonly BOTTOM: string = "bottom";

        /** Centered alignment. */
        public static readonly CENTER: string = "center";

        /** Indicates whether the given alignment string is valid. */
        static isValid(align: string): Boolean {
            return align == Align.LEFT || align == Align.RIGHT || align == Align.CENTER ||
                align == Align.TOP || align == Align.BOTTOM;
        }

        /** Indicates if the given string is a valid horizontal alignment. */
        static isValidHorizontal(align: string): Boolean {
            return align == Align.LEFT || align == Align.CENTER || align == Align.RIGHT;
        }

        /** Indicates if the given string is a valid vertical alignment. */
        static isValidVertical(align: string): Boolean {
            return align == Align.TOP || align == Align.CENTER || align == Align.BOTTOM;
        }
    }
}