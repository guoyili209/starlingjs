// =================================================================================================
//
//  Starling Framework
//  Copyright Gamua GmbH. All Rights Reserved.
//
//	This program is free software. You can redistribute and/or modify it
//	in accordance with the terms of the accompanying license agreement.
//
// =================================================================================================

module StarlingJS {

    export class VertexData {
        private _rawData: ByteArray;
        private _numVertices: number;
        private _format: VertexDataFormat;
        private _attributes: Array<VertexDataAttribute>;
        private _numAttributes: number;
        private _premultipliedAlpha: boolean;
        private _tinted: boolean;

        private _posOffset: number;  // in bytes
        private _colOffset: number;  // in bytes
        private _vertexSize: number; // in bytes

        // helper objects
        private static sHelperPoint: Point = new Point();
        private static sHelperPoint3D: Vector3D = new Vector3D();
        private static sBytes: ByteArray = new ByteArray();

        /** Creates an empty VertexData object with the given format and initial capacity.
         *
         *  @param format
         *
         *  Either a VertexDataFormat instance or a string that describes the data format.
         *  Refer to the VertexDataFormat class for more information. If you don't pass a format,
         *  the default <code>MeshStyle.VERTEX_FORMAT</code> will be used.
         *
         *  @param initialCapacity
         *
         *  The initial capacity affects just the way the internal ByteArray is allocated, not the
         *  <code>numIndices</code> value, which will always be zero when the constructor returns.
         *  The reason for this behavior is the peculiar way in which ByteArrays organize their
         *  memory:
         *
         *  <p>The first time you set the length of a ByteArray, it will adhere to that:
         *  a ByteArray with length 20 will take up 20 bytes (plus some overhead). When you change
         *  it to a smaller length, it will stick to the original value, e.g. with a length of 10
         *  it will still take up 20 bytes. However, now comes the weird part: change it to
         *  anything above the original length, and it will allocate 4096 bytes!</p>
         *
         *  <p>Thus, be sure to always make a generous educated guess, depending on the planned
         *  usage of your VertexData instances.</p>
         */
        constructor(format: any = null, initialCapacity: number = 32) {
            if (format == null) this._format = MeshStyle.VERTEX_FORMAT;
            else if (format instanceof VertexDataFormat) this._format = format;
            else if (typeof format == "string") this._format = VertexDataFormat.fromString(format as string);
            else throw new Error("'format' must be string or VertexDataFormat");

            this._attributes = this._format.attributes;
            this._numAttributes = this._attributes.length;
            this._posOffset = this._format.hasAttribute("position") ? this._format.getOffset("position") : 0;
            this._colOffset = this._format.hasAttribute("color") ? this._format.getOffset("color") : 0;
            this._vertexSize = this._format.vertexSize;
            this._numVertices = 0;
            this._premultipliedAlpha = true;
            this._rawData = new ByteArray();
            this._rawData.endian = VertexData.sBytes.endian = Byte.LITTLE_ENDIAN;
            this._rawData.length = initialCapacity * this._vertexSize; // just for the initial allocation
            this._rawData.length = 0;                             // changes length, but not memory!
        }

        /** Explicitly frees up the memory used by the ByteArray. */
        clear(): void {
            this._rawData.clear();
            this._numVertices = 0;
            this._tinted = false;
        }

        /** Creates a duplicate of the vertex data object. */
        clone(): VertexData {
            var clone: VertexData = new VertexData(this._format, this._numVertices);
            clone._rawData.writeBytes(this._rawData);
            clone._numVertices = this._numVertices;
            clone._premultipliedAlpha = this._premultipliedAlpha;
            clone._tinted = this._tinted;
            return clone;
        }

        /** Copies the vertex data (or a range of it, defined by 'vertexID' and 'numVertices')
         *  of this instance to another vertex data object, starting at a certain target index.
         *  If the target is not big enough, it will be resized to fit all the new vertices.
         *
         *  <p>If you pass a non-null matrix, the 2D position of each vertex will be transformed
         *  by that matrix before storing it in the target object. (The position being either an
         *  attribute with the name "position" or, if such an attribute is not found, the first
         *  attribute of each vertex. It must consist of two float values containing the x- and
         *  y-coordinates of the vertex.)</p>
         *
         *  <p>Source and target do not need to have the exact same format. Only properties that
         *  exist in the target will be copied; others will be ignored. If a property with the
         *  same name but a different format exists in the target, an exception will be raised.
         *  Beware, though, that the copy-operation becomes much more expensive when the formats
         *  differ.</p>
         */
        copyTo(target: VertexData, targetVertexID: number = 0, matrix: Matrix = null,
            vertexID: number = 0, numVertices: number = -1): void {
            if (numVertices < 0 || vertexID + numVertices > this._numVertices)
                numVertices = this._numVertices - vertexID;

            if (this._format === target._format) {
                if (target._numVertices < targetVertexID + numVertices)
                    target._numVertices = targetVertexID + numVertices;

                target._tinted = target._tinted || this._tinted;

                // In this case, it's fastest to copy the complete range in one call
                // and then overwrite only the transformed positions.

                var targetRawData: ByteArray = target._rawData;
                targetRawData.position = targetVertexID * this._vertexSize;
                targetRawData.writeBytes(this._rawData, vertexID * this._vertexSize, numVertices * this._vertexSize);

                if (matrix) {
                    var x: number, y: number;
                    var pos: number = targetVertexID * this._vertexSize + this._posOffset;
                    var endPos: number = pos + (numVertices * this._vertexSize);

                    while (pos < endPos) {
                        targetRawData.position = pos;
                        x = targetRawData.readFloat();
                        y = targetRawData.readFloat();

                        targetRawData.position = pos;
                        targetRawData.writeFloat(matrix.a * x + matrix.c * y + matrix.tx);
                        targetRawData.writeFloat(matrix.d * y + matrix.b * x + matrix.ty);

                        pos += this._vertexSize;
                    }
                }
            }
            else {
                if (target._numVertices < targetVertexID + numVertices)
                    target.numVertices = targetVertexID + numVertices; // ensure correct alphas!

                for (var i: number = 0; i < this._numAttributes; ++i) {
                    var srcAttr: VertexDataAttribute = this._attributes[i];
                    var tgtAttr: VertexDataAttribute = target.getAttribute(srcAttr.name);

                    if (tgtAttr) // only copy attributes that exist in the target, as well
                    {
                        if (srcAttr.offset == this._posOffset)
                            this.copyAttributeTo_internal(target, targetVertexID, matrix,
                                srcAttr, tgtAttr, vertexID, numVertices);
                        else
                            this.copyAttributeTo_internal(target, targetVertexID, null,
                                srcAttr, tgtAttr, vertexID, numVertices);
                    }
                }
            }
        }

        /** Copies a specific attribute of all contained vertices (or a range of them, defined by
         *  'vertexID' and 'numVertices') to another VertexData instance. Beware that both name
         *  and format of the attribute must be identical in source and target.
         *  If the target is not big enough, it will be resized to fit all the new vertices.
         *
         *  <p>If you pass a non-null matrix, the specified attribute will be transformed by
         *  that matrix before storing it in the target object. It must consist of two float
         *  values.</p>
         */
        copyAttributeTo(target: VertexData, targetVertexID: number, attrName: string,
            matrix: Matrix = null, vertexID: number = 0, numVertices: number = -1): void {
            var sourceAttribute: VertexDataAttribute = this.getAttribute(attrName);
            var targetAttribute: VertexDataAttribute = target.getAttribute(attrName);

            if (sourceAttribute == null)
                throw new Error("Attribute '" + attrName + "' not found in source data");

            if (targetAttribute == null)
                throw new Error("Attribute '" + attrName + "' not found in target data");

            if (sourceAttribute.isColor)
                target._tinted = target._tinted || this._tinted;

            this.copyAttributeTo_internal(target, targetVertexID, matrix,
                sourceAttribute, targetAttribute, vertexID, numVertices);
        }

        private copyAttributeTo_internal(
            target: VertexData, targetVertexID: number, matrix: Matrix,
            sourceAttribute: VertexDataAttribute, targetAttribute: VertexDataAttribute,
            vertexID: number, numVertices: number): void {
            if (sourceAttribute.format != targetAttribute.format)
                throw new Error("Attribute formats differ between source and target");

            if (numVertices < 0 || vertexID + numVertices > this._numVertices)
                numVertices = this._numVertices - vertexID;

            if (target._numVertices < targetVertexID + numVertices)
                target._numVertices = targetVertexID + numVertices;

            var i: number, j: number, x: number, y: number;
            var sourceData: ByteArray = this._rawData;
            var targetData: ByteArray = target._rawData;
            var sourceDelta: number = this._vertexSize - sourceAttribute.size;
            var targetDelta: number = target._vertexSize - targetAttribute.size;
            var attributeSizeIn32Bits: number = sourceAttribute.size / 4;

            sourceData.position = vertexID * this._vertexSize + sourceAttribute.offset;
            targetData.position = targetVertexID * target._vertexSize + targetAttribute.offset;

            if (matrix) {
                for (i = 0; i < numVertices; ++i) {
                    x = sourceData.readFloat();
                    y = sourceData.readFloat();

                    targetData.writeFloat(matrix.a * x + matrix.c * y + matrix.tx);
                    targetData.writeFloat(matrix.d * y + matrix.b * x + matrix.ty);

                    sourceData.position += sourceDelta;
                    targetData.position += targetDelta;
                }
            }
            else {
                for (i = 0; i < numVertices; ++i) {
                    for (j = 0; j < attributeSizeIn32Bits; ++j)
                        targetData.writeUnsignedInt(sourceData.readUnsignedInt());

                    sourceData.position += sourceDelta;
                    targetData.position += targetDelta;
                }
            }
        }

        /** Optimizes the ByteArray so that it has exactly the required capacity, without
         *  wasting any memory. If your VertexData object grows larger than the initial capacity
         *  you passed to the constructor, call this method to avoid the 4k memory problem. */
        trim(): void {
            var numBytes: number = this._numVertices * this._vertexSize;

            VertexData.sBytes.length = numBytes;
            VertexData.sBytes.position = 0;
            VertexData.sBytes.writeBytes(this._rawData, 0, numBytes);

            this._rawData.clear();
            this._rawData.length = numBytes;
            this._rawData.writeBytes(VertexData.sBytes);

            VertexData.sBytes.length = 0;
        }

        /** Returns a string representation of the VertexData object,
         *  describing both its format and size. */
        toString(): string {
            return StringUtil.format("[VertexData format=\"{0}\" numVertices={1}]",
                this._format.formatString, this._numVertices);
        }

        // read / write attributes

        /** Reads an unsigned integer value from the specified vertex and attribute. */
        getUnsignedInt(vertexID: number, attrName: string): number {
            this._rawData.position = vertexID * this._vertexSize + this.getAttribute(attrName).offset;
            return this._rawData.readUnsignedInt();
        }

        /** Writes an unsigned integer value to the specified vertex and attribute. */
        setUnsignedInt(vertexID: number, attrName: string, value: number): void {
            if (this._numVertices < vertexID + 1)
                this.numVertices = vertexID + 1;

            this._rawData.position = vertexID * this._vertexSize + this.getAttribute(attrName).offset;
            this._rawData.writeUnsignedInt(value);
        }

        /** Reads a float value from the specified vertex and attribute. */
        getFloat(vertexID: number, attrName: string): number {
            this._rawData.position = vertexID * this._vertexSize + this.getAttribute(attrName).offset;
            return this._rawData.readFloat();
        }

        /** Writes a float value to the specified vertex and attribute. */
        setFloat(vertexID: number, attrName: string, value: number): void {
            if (this._numVertices < vertexID + 1)
                this.numVertices = vertexID + 1;

            this._rawData.position = vertexID * this._vertexSize + this.getAttribute(attrName).offset;
            this._rawData.writeFloat(value);
        }

        /** Reads a Point from the specified vertex and attribute. */
        getPoint(vertexID: number, attrName: string, out: Point = null): Point {
            if (out == null) out = new Point();

            var offset: number = attrName == "position" ? this._posOffset : this.getAttribute(attrName).offset;
            this._rawData.position = vertexID * this._vertexSize + offset;
            out.x = this._rawData.readFloat();
            out.y = this._rawData.readFloat();

            return out;
        }

        /** Writes the given coordinates to the specified vertex and attribute. */
        setPoint(vertexID: number, attrName: string, x: number, y: number): void {
            if (this._numVertices < vertexID + 1)
                this.numVertices = vertexID + 1;

            var offset: number = attrName == "position" ? this._posOffset : this.getAttribute(attrName).offset;
            this._rawData.position = vertexID * this._vertexSize + offset;
            this._rawData.writeFloat(x);
            this._rawData.writeFloat(y);
        }

        /** Reads a Vector3D from the specified vertex and attribute.
         *  The 'w' property of the Vector3D is ignored. */
        getPoint3D(vertexID: number, attrName: string, out: Vector3D = null): Vector3D {
            if (out == null) out = new Vector3D();

            this._rawData.position = vertexID * this._vertexSize + this.getAttribute(attrName).offset;
            out.x = this._rawData.readFloat();
            out.y = this._rawData.readFloat();
            out.z = this._rawData.readFloat();

            return out;
        }

        /** Writes the given coordinates to the specified vertex and attribute. */
        setPoint3D(vertexID: number, attrName: string, x: number, y: number, z: number): void {
            if (this._numVertices < vertexID + 1)
                this.numVertices = vertexID + 1;

            this._rawData.position = vertexID * this._vertexSize + this.getAttribute(attrName).offset;
            this._rawData.writeFloat(x);
            this._rawData.writeFloat(y);
            this._rawData.writeFloat(z);
        }

        /** Reads a Vector3D from the specified vertex and attribute, including the fourth
         *  coordinate ('w'). */
        getPoint4D(vertexID: number, attrName: string, out: Vector3D = null): Vector3D {
            if (out == null) out = new Vector3D();

            this._rawData.position = vertexID * this._vertexSize + this.getAttribute(attrName).offset;
            out.x = this._rawData.readFloat();
            out.y = this._rawData.readFloat();
            out.z = this._rawData.readFloat();
            out.w = this._rawData.readFloat();

            return out;
        }

        /** Writes the given coordinates to the specified vertex and attribute. */
        setPoint4D(vertexID: number, attrName: string,
            x: number, y: number, z: number, w: number = 1.0): void {
            if (this._numVertices < vertexID + 1)
                this.numVertices = vertexID + 1;

            this._rawData.position = vertexID * this._vertexSize + this.getAttribute(attrName).offset;
            this._rawData.writeFloat(x);
            this._rawData.writeFloat(y);
            this._rawData.writeFloat(z);
            this._rawData.writeFloat(w);
        }

        /** Reads an RGB color from the specified vertex and attribute (no alpha). */
        getColor(vertexID: number, attrName: string = "color"): number {
            var offset: number = attrName == "color" ? this._colOffset : this.getAttribute(attrName).offset;
            this._rawData.position = vertexID * this._vertexSize + offset;
            var rgba: number = this.switchEndian(this._rawData.readUnsignedInt());
            if (this._premultipliedAlpha) rgba = this.unmultiplyAlpha(rgba);
            return (rgba >> 8) & 0xffffff;
        }

        /** Writes the RGB color to the specified vertex and attribute (alpha is not changed). */
        setColor(vertexID: number, attrName: string, color: number): void {
            if (this._numVertices < vertexID + 1)
                this.numVertices = vertexID + 1;

            var alpha: number = this.getAlpha(vertexID, attrName);
            this.colorize(attrName, color, alpha, vertexID, 1);
        }

        /** Reads the alpha value from the specified vertex and attribute. */
        getAlpha(vertexID: number, attrName: string = "color"): number {
            var offset: number = attrName == "color" ? this._colOffset : this.getAttribute(attrName).offset;
            this._rawData.position = vertexID * this._vertexSize + offset;
            var rgba: number = this.switchEndian(this._rawData.readUnsignedInt());
            return (rgba & 0xff) / 255.0;
        }

        /** Writes the given alpha value to the specified vertex and attribute (range 0-1). */
        setAlpha(vertexID: number, attrName: string, alpha: number): void {
            if (this._numVertices < vertexID + 1)
                this.numVertices = vertexID + 1;

            var color: number = this.getColor(vertexID, attrName);
            this.colorize(attrName, color, alpha, vertexID, 1);
        }

        // bounds helpers

        /** Calculates the bounds of the 2D vertex positions identified by the given name.
         *  The positions may optionally be transformed by a matrix before calculating the bounds.
         *  If you pass an 'out' Rectangle, the result will be stored in this rectangle
         *  instead of creating a new object. To use all vertices for the calculation, set
         *  'numVertices' to '-1'. */
        getBounds(attrName: string = "position", matrix: Matrix = null,
            vertexID: number = 0, numVertices: number = -1, out: Rectangle = null): Rectangle {
            if (out == null) out = new Rectangle();
            if (numVertices < 0 || vertexID + numVertices > this._numVertices)
                numVertices = this._numVertices - vertexID;

            if (numVertices == 0) {
                if (matrix == null)
                    out.setEmpty();
                else {
                    MatrixUtil.transformCoords(matrix, 0, 0, VertexData.sHelperPoint);
                    out.setTo(VertexData.sHelperPoint.x, VertexData.sHelperPoint.y, 0, 0);
                }
            }
            else {
                var minX: number = Number.MAX_VALUE, maxX: number = -Number.MAX_VALUE;
                var minY: number = Number.MAX_VALUE, maxY: number = -Number.MAX_VALUE;
                var offset: number = attrName == "position" ? this._posOffset : this.getAttribute(attrName).offset;
                var position: number = vertexID * this._vertexSize + offset;
                var x: number, y: number, i: number;

                if (matrix == null) {
                    for (i = 0; i < numVertices; ++i) {
                        this._rawData.position = position;
                        x = this._rawData.readFloat();
                        y = this._rawData.readFloat();
                        position += this._vertexSize;

                        if (minX > x) minX = x;
                        if (maxX < x) maxX = x;
                        if (minY > y) minY = y;
                        if (maxY < y) maxY = y;
                    }
                }
                else {
                    for (i = 0; i < numVertices; ++i) {
                        this._rawData.position = position;
                        x = this._rawData.readFloat();
                        y = this._rawData.readFloat();
                        position += this._vertexSize;

                        MatrixUtil.transformCoords(matrix, x, y, VertexData.sHelperPoint);

                        if (minX > VertexData.sHelperPoint.x) minX = VertexData.sHelperPoint.x;
                        if (maxX < VertexData.sHelperPoint.x) maxX = VertexData.sHelperPoint.x;
                        if (minY > VertexData.sHelperPoint.y) minY = VertexData.sHelperPoint.y;
                        if (maxY < VertexData.sHelperPoint.y) maxY = VertexData.sHelperPoint.y;
                    }
                }

                out.setTo(minX, minY, maxX - minX, maxY - minY);
            }

            return out;
        }

        /** Calculates the bounds of the 2D vertex positions identified by the given name,
         *  projected into the XY-plane of a certain 3D space as they appear from the given
         *  camera position. Note that 'camPos' is expected in the target coordinate system
         *  (the same that the XY-plane lies in).
         *
         *  <p>If you pass an 'out' Rectangle, the result will be stored in this rectangle
         *  instead of creating a new object. To use all vertices for the calculation, set
         *  'numVertices' to '-1'.</p> */
        getBoundsProjected(attrName: string, matrix: Matrix3D,
            camPos: Vector3D, vertexID: number = 0, numVertices: number = -1,
            out: Rectangle = null): Rectangle {
            if (out == null) out = new Rectangle();
            if (camPos == null) throw new Error("camPos must not be null");
            if (numVertices < 0 || vertexID + numVertices > this._numVertices)
                numVertices = this._numVertices - vertexID;

            if (numVertices == 0) {
                if (matrix)
                    MatrixUtil.transformCoords3D(matrix, 0, 0, 0, VertexData.sHelperPoint3D);
                else
                    VertexData.sHelperPoint3D.setTo(0, 0, 0);

                MathUtil.intersectLineWithXYPlane(camPos, VertexData.sHelperPoint3D, VertexData.sHelperPoint);
                out.setTo(VertexData.sHelperPoint.x, VertexData.sHelperPoint.y, 0, 0);
            }
            else {
                var minX: number = Number.MAX_VALUE, maxX: number = -Number.MAX_VALUE;
                var minY: number = Number.MAX_VALUE, maxY: number = -Number.MAX_VALUE;
                var offset: number = attrName == "position" ? this._posOffset : this.getAttribute(attrName).offset;
                var position: number = vertexID * this._vertexSize + offset;
                var x: number, y: number, i: number;

                for (i = 0; i < numVertices; ++i) {
                    this._rawData.position = position;
                    x = this._rawData.readFloat();
                    y = this._rawData.readFloat();
                    position += this._vertexSize;

                    if (matrix)
                        MatrixUtil.transformCoords3D(matrix, x, y, 0, VertexData.sHelperPoint3D);
                    else
                        VertexData.sHelperPoint3D.setTo(x, y, 0);

                    MathUtil.intersectLineWithXYPlane(camPos, VertexData.sHelperPoint3D, VertexData.sHelperPoint);

                    if (minX > VertexData.sHelperPoint.x) minX = VertexData.sHelperPoint.x;
                    if (maxX < VertexData.sHelperPoint.x) maxX = VertexData.sHelperPoint.x;
                    if (minY > VertexData.sHelperPoint.y) minY = VertexData.sHelperPoint.y;
                    if (maxY < VertexData.sHelperPoint.y) maxY = VertexData.sHelperPoint.y;
                }

                out.setTo(minX, minY, maxX - minX, maxY - minY);
            }

            return out;
        }

        /** Indicates if color attributes should be stored premultiplied with the alpha value.
         *  Changing this value does <strong>not</strong> modify any existing color data.
         *  If you want that, use the <code>setPremultipliedAlpha</code> method instead.
         *  @default true */
        get premultipliedAlpha(): boolean { return this._premultipliedAlpha; }
        set premultipliedAlpha(value: boolean) {
            this.setPremultipliedAlpha(value, false);
        }

        /** Changes the way alpha and color values are stored. Optionally updates all existing
         *  vertices. */
        setPremultipliedAlpha(value: boolean, updateData: boolean): void {
            if (updateData && value != this._premultipliedAlpha) {
                for (var i: number = 0; i < this._numAttributes; ++i) {
                    var attribute: VertexDataAttribute = this._attributes[i];
                    if (attribute.isColor) {
                        var pos: number = attribute.offset;
                        var oldColor: number;
                        var newColor: number;

                        for (var j: number = 0; j < this._numVertices; ++j) {
                            this._rawData.position = pos;
                            oldColor = this.switchEndian(this._rawData.readUnsignedInt());
                            newColor = value ? this.premultiplyAlpha(oldColor) : this.unmultiplyAlpha(oldColor);

                            this._rawData.position = pos;
                            this._rawData.writeUnsignedInt(this.switchEndian(newColor));

                            pos += this._vertexSize;
                        }
                    }
                }
            }

            this._premultipliedAlpha = value;
        }

        /** Updates the <code>tinted</code> property from the actual color data. This might make
         *  sense after copying part of a tinted VertexData instance to another, since not each
         *  color value is checked in the process. An instance is tinted if any vertices have a
         *  non-white color or are not fully opaque. */
        updateTinted(attrName: string = "color"): boolean {
            var pos: number = attrName == "color" ? this._colOffset : this.getAttribute(attrName).offset;
            this._tinted = false;

            for (var i: number = 0; i < this._numVertices; ++i) {
                this._rawData.position = pos;

                if (this._rawData.readUnsignedInt() != 0xffffffff) {
                    this._tinted = true;
                    break;
                }

                pos += this._vertexSize;
            }

            return this._tinted;
        }

        // modify multiple attributes

        /** Transforms the 2D positions of subsequent vertices by multiplication with a
         *  transformation matrix. */
        transformPoints(attrName: string, matrix: Matrix,
            vertexID: number = 0, numVertices: number = -1): void {
            if (numVertices < 0 || vertexID + numVertices > this._numVertices)
                numVertices = this._numVertices - vertexID;

            var x: number, y: number;
            var offset: number = attrName == "position" ? this._posOffset : this.getAttribute(attrName).offset;
            var pos: number = vertexID * this._vertexSize + offset;
            var endPos: number = pos + numVertices * this._vertexSize;

            while (pos < endPos) {
                this._rawData.position = pos;
                x = this._rawData.readFloat();
                y = this._rawData.readFloat();

                this._rawData.position = pos;
                this._rawData.writeFloat(matrix.a * x + matrix.c * y + matrix.tx);
                this._rawData.writeFloat(matrix.d * y + matrix.b * x + matrix.ty);

                pos += this._vertexSize;
            }
        }

        /** Translates the 2D positions of subsequent vertices by a certain offset. */
        translatePoints(attrName: string, deltaX: number, deltaY: number,
            vertexID: number = 0, numVertices: number = -1): void {
            if (numVertices < 0 || vertexID + numVertices > this._numVertices)
                numVertices = this._numVertices - vertexID;

            var x: number, y: number;
            var offset: number = attrName == "position" ? this._posOffset : this.getAttribute(attrName).offset;
            var pos: number = vertexID * this._vertexSize + offset;
            var endPos: number = pos + numVertices * this._vertexSize;

            while (pos < endPos) {
                this._rawData.position = pos;
                x = this._rawData.readFloat();
                y = this._rawData.readFloat();

                this._rawData.position = pos;
                this._rawData.writeFloat(x + deltaX);
                this._rawData.writeFloat(y + deltaY);

                pos += this._vertexSize;
            }
        }

        /** Multiplies the alpha values of subsequent vertices by a certain factor. */
        scaleAlphas(attrName: string, factor: number,
            vertexID: number = 0, numVertices: number = -1): void {
            if (factor == 1.0) return;
            if (numVertices < 0 || vertexID + numVertices > this._numVertices)
                numVertices = this._numVertices - vertexID;

            this._tinted = true; // factor must be != 1, so there's definitely tinting.

            var i: number;
            var offset: number = attrName == "color" ? this._colOffset : this.getAttribute(attrName).offset;
            var colorPos: number = vertexID * this._vertexSize + offset;
            var alphaPos: number, alpha: number, rgba: number;

            for (i = 0; i < numVertices; ++i) {
                alphaPos = colorPos + 3;
                alpha = this._rawData[alphaPos] / 255.0 * factor;

                if (alpha > 1.0) alpha = 1.0;
                else if (alpha < 0.0) alpha = 0.0;

                if (alpha == 1.0 || !this._premultipliedAlpha) {
                    this._rawData[alphaPos] = <number>(alpha * 255.0);
                }
                else {
                    this._rawData.position = colorPos;
                    rgba = this.unmultiplyAlpha(this.switchEndian(this._rawData.readUnsignedInt()));
                    rgba = (rgba & 0xffffff00) | (<number>(alpha * 255.0) & 0xff);
                    rgba = this.premultiplyAlpha(rgba);

                    this._rawData.position = colorPos;
                    this._rawData.writeUnsignedInt(this.switchEndian(rgba));
                }

                colorPos += this._vertexSize;
            }
        }

        /** Writes the given RGB and alpha values to the specified vertices. */
        colorize(attrName: string = "color", color: number = 0xffffff, alpha: number = 1.0,
            vertexID: number = 0, numVertices: number = -1): void {
            if (numVertices < 0 || vertexID + numVertices > this._numVertices)
                numVertices = this._numVertices - vertexID;

            var offset: number = attrName == "color" ? this._colOffset : this.getAttribute(attrName).offset;
            var pos: number = vertexID * this._vertexSize + offset;
            var endPos: number = pos + (numVertices * this._vertexSize);

            if (alpha > 1.0) alpha = 1.0;
            else if (alpha < 0.0) alpha = 0.0;

            var rgba: number = ((color << 8) & 0xffffff00) | (<number>(alpha * 255.0) & 0xff);

            if (rgba == 0xffffffff && numVertices == this._numVertices) this._tinted = false;
            else if (rgba != 0xffffffff) this._tinted = true;

            if (this._premultipliedAlpha && alpha != 1.0) rgba = this.premultiplyAlpha(rgba);

            this._rawData.position = vertexID * this._vertexSize + offset;
            this._rawData.writeUnsignedInt(this.switchEndian(rgba));

            while (pos < endPos) {
                this._rawData.position = pos;
                this._rawData.writeUnsignedInt(this.switchEndian(rgba));
                pos += this._vertexSize;
            }
        }

        // format helpers

        /** Returns the format of a certain vertex attribute, identified by its name.
          * Typical values: <code>float1, float2, float3, float4, bytes4</code>. */
        getFormat(attrName: string): string {
            return this.getAttribute(attrName).format;
        }

        /** Returns the size of a certain vertex attribute in bytes. */
        getSize(attrName: string): number {
            return this.getAttribute(attrName).size;
        }

        /** Returns the size of a certain vertex attribute in 32 bit units. */
        getSizeIn32Bits(attrName: string): number {
            return this.getAttribute(attrName).size / 4;
        }

        /** Returns the offset (in bytes) of an attribute within a vertex. */
        getOffset(attrName: string): number {
            return this.getAttribute(attrName).offset;
        }

        /** Returns the offset (in 32 bit units) of an attribute within a vertex. */
        getOffsetIn32Bits(attrName: string): number {
            return this.getAttribute(attrName).offset / 4;
        }

        /** Indicates if the VertexData instances contains an attribute with the specified name. */
        hasAttribute(attrName: string): boolean {
            return this.getAttribute(attrName) != null;
        }

        // VertexBuffer helpers

        /** Creates a vertex buffer object with the right size to fit the complete data.
         *  Optionally, the current data is uploaded right away. */
        createVertexBuffer(upload: boolean = false,
            bufferUsage: string = "staticDraw"): VertexBuffer3D {
            var context: Context3D = Starling.context;
            if (context == null) throw new MissingContextError();
            if (this._numVertices == 0) return null;

            var buffer: VertexBuffer3D = context.createVertexBuffer(
                this._numVertices, this._vertexSize / 4, bufferUsage);

            if (upload) this.uploadToVertexBuffer(buffer);
            return buffer;
        }

        /** Uploads the complete data (or a section of it) to the given vertex buffer. */
        uploadToVertexBuffer(buffer: VertexBuffer3D, vertexID: number = 0, numVertices: number = -1): void {
            if (numVertices < 0 || vertexID + numVertices > this._numVertices)
                numVertices = this._numVertices - vertexID;

            if (numVertices > 0)
                buffer.uploadFromByteArray(this._rawData, 0, vertexID, numVertices);
        }


        private getAttribute(attrName: string): VertexDataAttribute {
            var i: number, attribute: VertexDataAttribute;

            for (i = 0; i < this._numAttributes; ++i) {
                attribute = this._attributes[i];
                if (attribute.name == attrName) return attribute;
            }

            return null;
        }


        private switchEndian(value: number): number {
            return (value & 0xff) << 24 |
                ((value >> 8) & 0xff) << 16 |
                ((value >> 16) & 0xff) << 8 |
                ((value >> 24) & 0xff);
        }

        private premultiplyAlpha(rgba: number): number {
            var alpha: number = rgba & 0xff;

            if (alpha == 0xff) return rgba;
            else {
                var factor: number = alpha / 255.0;
                var r: number = ((rgba >> 24) & 0xff) * factor;
                var g: number = ((rgba >> 16) & 0xff) * factor;
                var b: number = ((rgba >> 8) & 0xff) * factor;

                return (r & 0xff) << 24 |
                    (g & 0xff) << 16 |
                    (b & 0xff) << 8 | alpha;
            }
        }

        private unmultiplyAlpha(rgba: number): number {
            var alpha: number = rgba & 0xff;

            if (alpha == 0xff || alpha == 0x0) return rgba;
            else {
                var factor: number = alpha / 255.0;
                var r: number = ((rgba >> 24) & 0xff) / factor;
                var g: number = ((rgba >> 16) & 0xff) / factor;
                var b: number = ((rgba >> 8) & 0xff) / factor;

                return (r & 0xff) << 24 |
                    (g & 0xff) << 16 |
                    (b & 0xff) << 8 | alpha;
            }
        }

        // properties

        /** The total number of vertices. If you make the object bigger, it will be filled up with
         *  <code>1.0</code> for all alpha values and zero for everything else. */
        get numVertices(): number { return this._numVertices; }
        set numVertices(value: number) {
            if (value > this._numVertices) {
                var oldLength: number = this._numVertices * this.vertexSize;
                var newLength: number = value * this._vertexSize;

                if (this._rawData.length > oldLength) {
                    this._rawData.position = oldLength;
                    while (this._rawData.bytesAvailable) this._rawData.writeUnsignedInt(0);
                }

                if (this._rawData.length < newLength)
                    this._rawData.length = newLength;

                for (var i: number = 0; i < this._numAttributes; ++i) {
                    var attribute: VertexDataAttribute = this._attributes[i];
                    if (attribute.isColor) // initialize color values with "white" and full alpha
                    {
                        var pos: number = this._numVertices * this._vertexSize + attribute.offset;
                        for (var j: number = this._numVertices; j < value; ++j) {
                            this._rawData.position = pos;
                            this._rawData.writeUnsignedInt(0xffffffff);
                            pos += this._vertexSize;
                        }
                    }
                }
            }

            if (value == 0) this._tinted = false;
            this._numVertices = value;
        }

        /** The raw vertex data; not a copy! */
        get rawData(): ByteArray {
            return this._rawData;
        }

        /** The format that describes the attributes of each vertex.
         *  When you assign a different format, the raw data will be converted accordingly,
         *  i.e. attributes with the same name will still point to the same data.
         *  New properties will be filled up with zeros (except for colors, which will be
         *  initialized with an alpha value of 1.0). As a side-effect, the instance will also
         *  be trimmed. */
        get format(): VertexDataFormat {
            return this._format;
        }

        set format(value: VertexDataFormat) {
            if (this._format == value) return;

            var a: number, i: number, pos: number;
            var srcVertexSize: number = this._format.vertexSize;
            var tgtVertexSize: number = value.vertexSize;
            var numAttributes: number = value.numAttributes;

            VertexData.sBytes.length = value.vertexSize * this._numVertices;

            for (a = 0; a < numAttributes; ++a) {
                var tgtAttr: VertexDataAttribute = value.attributes[a];
                var srcAttr: VertexDataAttribute = this.getAttribute(tgtAttr.name);

                if (srcAttr) // copy attributes that exist in both targets
                {
                    pos = tgtAttr.offset;

                    for (i = 0; i < this._numVertices; ++i) {
                        VertexData.sBytes.position = pos;
                        VertexData.sBytes.writeBytes(this._rawData, srcVertexSize * i + srcAttr.offset, srcAttr.size);
                        pos += tgtVertexSize;
                    }
                }
                else if (tgtAttr.isColor) // initialize color values with "white" and full alpha
                {
                    pos = tgtAttr.offset;

                    for (i = 0; i < this._numVertices; ++i) {
                        VertexData.sBytes.position = pos;
                        VertexData.sBytes.writeUnsignedInt(0xffffffff);
                        pos += tgtVertexSize;
                    }
                }
            }

            if (value.vertexSize > this._format.vertexSize)
                this._rawData.clear(); // avoid 4k blowup

            this._rawData.position = 0;
            this._rawData.length = VertexData.sBytes.length;
            this._rawData.writeBytes(VertexData.sBytes);
            VertexData.sBytes.length = 0;

            this._format = value;
            this._attributes = this._format.attributes;
            this._numAttributes = this._attributes.length;
            this._vertexSize = this._format.vertexSize;
            this._posOffset = this._format.hasAttribute("position") ? this._format.getOffset("position") : 0;
            this._colOffset = this._format.hasAttribute("color") ? this._format.getOffset("color") : 0;
        }

        /** Indicates if the mesh contains any vertices that are not white or not fully opaque.
         *  If <code>false</code> (and the value wasn't modified manually), the result is 100%
         *  accurate; <code>true</code> represents just an educated guess. To be entirely sure,
         *  you may call <code>updateTinted()</code>.
         */
        get tinted(): boolean { return this._tinted; }
        set tinted(value: boolean) { this._tinted = value; }

        /** The format string that describes the attributes of each vertex. */
        get formatString(): string {
            return this._format.formatString;
        }

        /** The size (in bytes) of each vertex. */
        get vertexSize(): number {
            return this._vertexSize;
        }

        /** The size (in 32 bit units) of each vertex. */
        get vertexSizeIn32Bits(): number {
            return this._vertexSize / 4;
        }

        /** The size (in bytes) of the raw vertex data. */
        get size(): number {
            return this._numVertices * this._vertexSize;
        }

        /** The size (in 32 bit units) of the raw vertex data. */
        get sizeIn32Bits(): number {
            return this._numVertices * this._vertexSize / 4;
        }
    }
}
