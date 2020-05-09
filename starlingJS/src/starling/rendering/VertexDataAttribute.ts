module StarlingJS {
    export class VertexDataAttribute {
        private static readonly FORMAT_SIZES: Object = {
            "bytes4": 4,
            "float1": 4,
            "float2": 8,
            "float3": 12,
            "float4": 16
        };

        name: string;
        format: string;
        isColor: boolean;
        offset: number; 
        size: number;   
        constructor(name: string, format: string, offset: number) {
            if (!(format in VertexDataAttribute.FORMAT_SIZES))
                throw new Error(
                    "Invalid attribute format: " + format + ". " +
                    "Use one of the following: 'float1'-'float4', 'bytes4'");

            this.name = name;
            this.format = format;
            this.offset = offset;
            this.size = VertexDataAttribute.FORMAT_SIZES[format];
            this.isColor = name.indexOf("color") != -1 || name.indexOf("Color") != -1
        }
    }
}
