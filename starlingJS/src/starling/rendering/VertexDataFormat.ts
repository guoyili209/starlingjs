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

    export class VertexDataFormat {
        private _format: string;
        private _vertexSize: number;
        private _attributes: VertexDataAttribute[];

        // format cache
        private static sFormats: Dictionary = new Dictionary();

        constructor() {
            this._attributes = new Array<VertexDataAttribute>();
        }
        static fromString(format: string): VertexDataFormat {
            if (format in VertexDataFormat.sFormats) return VertexDataFormat.sFormats[format];
            else {
                var instance: VertexDataFormat = new VertexDataFormat();
                instance.parseFormat(format);

                var normalizedFormat: string = instance._format;

                if (normalizedFormat in VertexDataFormat.sFormats)
                    instance = VertexDataFormat.sFormats[normalizedFormat];

                VertexDataFormat.sFormats[format] = instance;
                VertexDataFormat.sFormats[normalizedFormat] = instance;

                return instance;
            }
        }

        /** Creates a new VertexDataFormat instance by appending the given format string
         *  to the current instance's format. */
        extend(format: string): VertexDataFormat {
            return VertexDataFormat.fromString(this._format + ", " + format);
        }

        // query methods

        /** Returns the size of a certain vertex attribute in bytes. */
        getSize(attrName: string): number {
            return (this.getAttribute(attrName) as VertexDataAttribute).size;
        }

        /** Returns the size of a certain vertex attribute in 32 bit units. */
        getSizeIn32Bits(attrName: string): number {
            return (this.getAttribute(attrName) as VertexDataAttribute).size / 4;
        }

        /** Returns the offset (in bytes) of an attribute within a vertex. */
        getOffset(attrName: string): number {
            return (this.getAttribute(attrName) as VertexDataAttribute).offset;
        }

        /** Returns the offset (in 32 bit units) of an attribute within a vertex. */
        getOffsetIn32Bits(attrName: string): number {
            return (this.getAttribute(attrName) as VertexDataAttribute).offset / 4;
        }

        /** Returns the format of a certain vertex attribute, identified by its name.
         *  Typical values: <code>float1, float2, float3, float4, bytes4</code>. */
        getFormat(attrName: string): string {
            return (this.getAttribute(attrName) as VertexDataAttribute).format;
        }

        /** Returns the name of the attribute at the given position within the vertex format. */
        getName(attrIndex: number): string {
            return this._attributes[attrIndex].name;
        }

        /** Indicates if the format contains an attribute with the given name. */
        hasAttribute(attrName: string): boolean {
            var numAttributes: number = this._attributes.length;

            for (var i: number = 0; i < numAttributes; ++i)
                if (this._attributes[i].name == attrName) return true;

            return false;
        }

        // context methods

        /** Specifies which vertex data attribute corresponds to a single vertex shader
         *  program input. This wraps the <code>Context3D</code>-method with the same name,
         *  automatically replacing <code>attrName</code> with the corresponding values for
         *  <code>bufferOffset</code> and <code>format</code>. */
        setVertexBufferAt(index: number, buffer: VertexBuffer3D, attrName: string): void {
            var attribute: VertexDataAttribute = this.getAttribute(attrName) as VertexDataAttribute;
            Starling.context.setVertexBufferAt(index, buffer, attribute.offset / 4, attribute.format);
        }

        // parsing

        private parseFormat(format: string): void {
            if (format != null && format != "") {
                this._attributes.length = 0;
                this._format = "";

                var parts: Array<any> = format.split(",");
                var numParts: number = parts.length;
                var offset: number = 0;

                for (var i: number = 0; i < numParts; ++i) {
                    var attrDesc: string = parts[i];
                    var attrParts: Array<any> = attrDesc.split(":");

                    if (attrParts.length != 2)
                        throw new Error("Missing colon: " + attrDesc);

                    var attrName: string = StringUtil.trim(attrParts[0]);
                    var attrFormat: string = StringUtil.trim(attrParts[1]);

                    if (attrName.length == 0 || attrFormat.length == 0)
                        throw new Error(("Invalid format string: " + attrDesc));

                    var attribute: VertexDataAttribute =
                        new VertexDataAttribute(attrName, attrFormat, offset);

                    offset += attribute.size;

                    this._format += (i == 0 ? "" : ", ") + attribute.name + ":" + attribute.format;
                    this._attributes[this._attributes.length] = attribute; // avoid 'push'
                }

                this._vertexSize = offset;
            }
            else {
                this._format = "";
            }
        }

        /** Returns the normalized format string. */
        toString(): string {
            return this._format;
        }

        // internal methods

        /** @private */
        getAttribute(attrName: string): VertexDataAttribute | null {
            var i: number, attribute: VertexDataAttribute;
            var numAttributes: number = this._attributes.length;

            for (i = 0; i < numAttributes; ++i) {
                attribute = this._attributes[i];
                if (attribute.name == attrName) return attribute;
            }

            return null;
        }

        /** @private */
        get attributes(): Array<VertexDataAttribute> {
            return this._attributes;
        }

        // properties

        /** Returns the normalized format string. */
        get formatString(): string {
            return this._format;
        }

        /** The size (in bytes) of each vertex. */
        get vertexSize(): number {
            return this._vertexSize;
        }

        /** The size (in 32 bit units) of each vertex. */
        get vertexSizeIn32Bits(): number {
            return this._vertexSize / 4;
        }

        /** The number of attributes per vertex. */
        get numAttributes(): number {
            return this._attributes.length;
        }
    }
}
