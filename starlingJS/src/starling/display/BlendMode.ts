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
    export class BlendMode {
        private _name: string;
        private _sourceFactor: string;
        private _destinationFactor: string;

        private static sBlendModes: Object;

        /** Creates a new BlendMode instance. Don't call this method directly; instead,
         *  register a new blend mode using <code>BlendMode.register</code>. */
        constructor(name: string, sourceFactor: string, destinationFactor: string) {
            this._name = name;
            this._sourceFactor = sourceFactor;
            this._destinationFactor = destinationFactor;
        }

        /** Inherits the blend mode from this display object's parent. */
        static readonly AUTO: string = "auto";

        /** Deactivates blending, i.e. disabling any transparency. */
        static readonly NONE: string = "none";

        /** The display object appears in front of the background. */
        static readonly NORMAL: string = "normal";

        /** Adds the values of the colors of the display object to the colors of its background. */
        static readonly ADD: string = "add";

        /** Multiplies the values of the display object colors with the the background color. */
        static readonly MULTIPLY: string = "multiply";

        /** Multiplies the complement (inverse) of the display object color with the complement of 
          * the background color, resulting in a bleaching effect. */
        static readonly SCREEN: string = "screen";

        /** Erases the background when drawn on a RenderTexture. */
        static readonly ERASE: string = "erase";

        /** When used on a RenderTexture, the drawn object will act as a mask for the current
         *  content, i.e. the source alpha overwrites the destination alpha. */
        static readonly MASK: string = "mask";

        /** Draws under/below existing objects; useful especially on RenderTextures. */
        static readonly BELOW: string = "below";

        // static access methods

        /** Returns the blend mode with the given name.
         *  Throws an ArgumentError if the mode does not exist. */
        static get(modeName: string): BlendMode {
            if (BlendMode.sBlendModes == null) this.registerDefaults();
            if (modeName in BlendMode.sBlendModes) return BlendMode.sBlendModes[modeName];
            else throw new Error("Blend mode not found: " + modeName);
        }

        /** Registers a blending mode under a certain name. */
        static register(name: string, srcFactor: string, dstFactor: string): BlendMode {
            if (BlendMode.sBlendModes == null) this.registerDefaults();
            var blendMode: BlendMode = new BlendMode(name, srcFactor, dstFactor);
            BlendMode.sBlendModes[name] = blendMode;
            return blendMode;
        }

        private static registerDefaults(): void {
            if (BlendMode.sBlendModes) return;

            BlendMode.sBlendModes = {};
            this.register("none", Context3DBlendFactor.ONE, Context3DBlendFactor.ZERO);
            this.register("normal", Context3DBlendFactor.ONE, Context3DBlendFactor.ONE_MINUS_SOURCE_ALPHA);
            this.register("add", Context3DBlendFactor.ONE, Context3DBlendFactor.ONE);
            this.register("multiply", Context3DBlendFactor.DESTINATION_COLOR, Context3DBlendFactor.ONE_MINUS_SOURCE_ALPHA);
            this.register("screen", Context3DBlendFactor.ONE, Context3DBlendFactor.ONE_MINUS_SOURCE_COLOR);
            this.register("erase", Context3DBlendFactor.ZERO, Context3DBlendFactor.ONE_MINUS_SOURCE_ALPHA);
            this.register("mask", Context3DBlendFactor.ZERO, Context3DBlendFactor.SOURCE_ALPHA);
            this.register("below", Context3DBlendFactor.ONE_MINUS_DESTINATION_ALPHA, Context3DBlendFactor.DESTINATION_ALPHA);
        }

        // instance methods / properties

        /** Sets the appropriate blend factors for source and destination on the current context. */
        activate(): void {
            Starling.context.setBlendFactors(_sourceFactor, _destinationFactor);
        }

        /** Returns the name of the blend mode. */
        toString(): string { return _name; }

        /** The source blend factor of this blend mode. */
        get sourceFactor(): string { return _sourceFactor; }

        /** The destination blend factor of this blend mode. */
        get destinationFactor(): string { return _destinationFactor; }

        /** Returns the name of the blend mode. */
        get name(): string { return _name; }
    }
}