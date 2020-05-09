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
        private _attributes: Vector.<VertexDataAttribute>;
        private _numAttributes: number;
        private _premultipliedAlpha: Boolean;
        private _tinted: Boolean;

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
            else if (format instanceof string) this._format = VertexDataFormat.fromString(format as string);
            else throw new ArgumentError("'format' must be string or VertexDataFormat");

            _attributes = _format.attributes;
            _numAttributes = _attributes.length;
            _posOffset = _format.hasAttribute("position") ? _format.getOffset("position") : 0;
            _colOffset = _format.hasAttribute("color") ? _format.getOffset("color") : 0;
            _vertexSize = _format.vertexSize;
            _numVertices = 0;
            _premultipliedAlpha = true;
            _rawData = new ByteArray();
            _rawData.endian = sBytes.endian = Endian.LITTLE_ENDIAN;
            _rawData.length = initialCapacity * _vertexSize; // just for the initial allocation
            _rawData.length = 0;                             // changes length, but not memory!
        }

        /** Explicitly frees up the memory used by the ByteArray. */
        clear(): void {
            _rawData.clear();
            _numVertices = 0;
            _tinted = false;
        }

        /** Creates a duplicate of the vertex data object. */
        clone(): VertexData {
            var clone: VertexData = new VertexData(_format, _numVertices);
            clone._rawData.writeBytes(_rawData);
            clone._numVertices = _numVertices;
            clone._premultipliedAlpha = _premultipliedAlpha;
            clone._tinted = _tinted;
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
            if (numVertices < 0 || vertexID + numVertices > _numVertices)
                numVertices = _numVertices - vertexID;

            if (_format === target._format) {
                if (target._numVertices < targetVertexID + numVertices)
                    target._numVertices = targetVertexID + numVertices;

                target._tinted ||= _tinted;

                // In this case, it's fastest to copy the complete range in one call
                // and then overwrite only the transformed positions.

                var targetRawData: ByteArray = target._rawData;
                targetRawData.position = targetVertexID * _vertexSize;
                targetRawData.writeBytes(_rawData, vertexID * _vertexSize, numVertices * _vertexSize);

                if (matrix) {
                    var x: number, y: number;
                    var pos: number = targetVertexID * _vertexSize + _posOffset;
                    var endPos: number = pos + (numVertices * _vertexSize);

                    while (pos < endPos) {
                        targetRawData.position = pos;
                        x = targetRawData.readFloat();
                        y = targetRawData.readFloat();

                        targetRawData.position = pos;
                        targetRawData.writeFloat(matrix.a * x + matrix.c * y + matrix.tx);
                        targetRawData.writeFloat(matrix.d * y + matrix.b * x + matrix.ty);

                        pos += _vertexSize;
                    }
                }
            }
            else {
                if (target._numVertices < targetVertexID + numVertices)
                    target.numVertices = targetVertexID + numVertices; // ensure correct alphas!

                for (var i: number = 0; i < _numAttributes; ++i) {
                    var srcAttr: VertexDataAttribute = _attributes[i];
                    var tgtAttr: VertexDataAttribute = target.getAttribute(srcAttr.name);

                    if (tgtAttr) // only copy attributes that exist in the target, as well
                    {
                        if (srcAttr.offset == _posOffset)
                            copyAttributeTo_internal(target, targetVertexID, matrix,
                                srcAttr, tgtAttr, vertexID, numVertices);
                        else
                            copyAttributeTo_internal(target, targetVertexID, null,
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
            var sourceAttribute: VertexDataAttribute = getAttribute(attrName);
            var targetAttribute: VertexDataAttribute = target.getAttribute(attrName);

            if (sourceAttribute == null)
                throw new ArgumentError("Attribute '" + attrName + "' not found in source data");

            if (targetAttribute == null)
                throw new ArgumentError("Attribute '" + attrName + "' not found in target data");

            if (sourceAttribute.isColor)
                target._tinted ||= _tinted;

            copyAttributeTo_internal(target, targetVertexID, matrix,
                sourceAttribute, targetAttribute, vertexID, numVertices);
        }

        private function copyAttributeTo_internal(
            target: VertexData, targetVertexID: number, matrix: Matrix,
            sourceAttribute: VertexDataAttribute, targetAttribute: VertexDataAttribute,
            vertexID: number, numVertices: number): void {
            if (sourceAttribute.format != targetAttribute.format)
                throw new IllegalOperationError("Attribute formats differ between source and target");

            if (numVertices < 0 || vertexID + numVertices > _numVertices)
                numVertices = _numVertices - vertexID;

            if (target._numVertices < targetVertexID + numVertices)
                target._numVertices = targetVertexID + numVertices;

            var i: number, j: number, x: number, y: number;
            var sourceData: ByteArray = _rawData;
            var targetData: ByteArray = target._rawData;
            var sourceDelta: number = _vertexSize - sourceAttribute.size;
            var targetDelta: number = target._vertexSize - targetAttribute.size;
            var attributeSizeIn32Bits: number = sourceAttribute.size / 4;

            sourceData.position = vertexID * _vertexSize + sourceAttribute.offset;
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
            var numBytes: number = _numVertices * _vertexSize;

            sBytes.length = numBytes;
            sBytes.position = 0;
            sBytes.writeBytes(_rawData, 0, numBytes);

            _rawData.clear();
            _rawData.length = numBytes;
            _rawData.writeBytes(sBytes);

            sBytes.length = 0;
        }

        /** Returns a string representation of the VertexData object,
         *  describing both its format and size. */
        toString(): string {
            return StringUtil.format("[VertexData format=\"{0}\" numVertices={1}]",
                _format.formatString, _numVertices);
        }

        // read / write attributes

        /** Reads an unsigned integer value from the specified vertex and attribute. */
        getUnsignedInt(vertexID: number, attrName: string): uint {
            _rawData.position = vertexID * _vertexSize + getAttribute(attrName).offset;
            return _rawData.readUnsignedInt();
        }

        /** Writes an unsigned integer value to the specified vertex and attribute. */
        setUnsignedInt(vertexID: number, attrName: string, value: uint): void {
            if (_numVertices < vertexID + 1)
                numVertices = vertexID + 1;

            _rawData.position = vertexID * _vertexSize + getAttribute(attrName).offset;
            _rawData.writeUnsignedInt(value);
        }

        /** Reads a float value from the specified vertex and attribute. */
        getFloat(vertexID: number, attrName: string): number {
            _rawData.position = vertexID * _vertexSize + getAttribute(attrName).offset;
            return _rawData.readFloat();
        }

        /** Writes a float value to the specified vertex and attribute. */
        setFloat(vertexID: number, attrName: string, value: number): void {
            if (_numVertices < vertexID + 1)
                numVertices = vertexID + 1;

            _rawData.position = vertexID * _vertexSize + getAttribute(attrName).offset;
            _rawData.writeFloat(value);
        }

        /** Reads a Point from the specified vertex and attribute. */
        getPoint(vertexID: number, attrName: string, out: Point = null): Point {
            if (out == null) out = new Point();

            var offset: number = attrName == "position" ? _posOffset : getAttribute(attrName).offset;
            _rawData.position = vertexID * _vertexSize + offset;
            out.x = _rawData.readFloat();
            out.y = _rawData.readFloat();

            return out;
        }

        /** Writes the given coordinates to the specified vertex and attribute. */
        setPoint(vertexID: number, attrName: string, x: number, y: number): void {
            if (_numVertices < vertexID + 1)
                numVertices = vertexID + 1;

            var offset: number = attrName == "position" ? _posOffset : getAttribute(attrName).offset;
            _rawData.position = vertexID * _vertexSize + offset;
            _rawData.writeFloat(x);
            _rawData.writeFloat(y);
        }

        /** Reads a Vector3D from the specified vertex and attribute.
         *  The 'w' property of the Vector3D is ignored. */
        getPoint3D(vertexID: number, attrName: string, out: Vector3D = null): Vector3D {
            if (out == null) out = new Vector3D();

            _rawData.position = vertexID * _vertexSize + getAttribute(attrName).offset;
            out.x = _rawData.readFloat();
            out.y = _rawData.readFloat();
            out.z = _rawData.readFloat();

            return out;
        }

        /** Writes the given coordinates to the specified vertex and attribute. */
        setPoint3D(vertexID: number, attrName: string, x: number, y: number, z: number): void {
            if (_numVertices < vertexID + 1)
                numVertices = vertexID + 1;

            _rawData.position = vertexID * _vertexSize + getAttribute(attrName).offset;
            _rawData.writeFloat(x);
            _rawData.writeFloat(y);
            _rawData.writeFloat(z);
        }

        /** Reads a Vector3D from the specified vertex and attribute, including the fourth
         *  coordinate ('w'). */
        getPoint4D(vertexID: number, attrName: string, out: Vector3D = null): Vector3D {
            if (out == null) out = new Vector3D();

            _rawData.position = vertexID * _vertexSize + getAttribute(attrName).offset;
            out.x = _rawData.readFloat();
            out.y = _rawData.readFloat();
            out.z = _rawData.readFloat();
            out.w = _rawData.readFloat();

            return out;
        }

        /** Writes the given coordinates to the specified vertex and attribute. */
        setPoint4D(vertexID: number, attrName: string,
            x: number, y: number, z: number, w: number = 1.0): void {
            if (_numVertices < vertexID + 1)
                numVertices = vertexID + 1;

            _rawData.position = vertexID * _vertexSize + getAttribute(attrName).offset;
            _rawData.writeFloat(x);
            _rawData.writeFloat(y);
            _rawData.writeFloat(z);
            _rawData.writeFloat(w);
        }

        /** Reads an RGB color from the specified vertex and attribute (no alpha). */
        getColor(vertexID: number, attrName: string = "color"): uint {
            var offset: number = attrName == "color" ? _colOffset : getAttribute(attrName).offset;
            _rawData.position = vertexID * _vertexSize + offset;
            var rgba: uint = switchEndian(_rawData.readUnsignedInt());
            if (_premultipliedAlpha) rgba = unmultiplyAlpha(rgba);
            return (rgba >> 8) & 0xffffff;
        }

        /** Writes the RGB color to the specified vertex and attribute (alpha is not changed). */
        setColor(vertexID: number, attrName: string, color: uint): void {
            if (_numVertices < vertexID + 1)
                numVertices = vertexID + 1;

            var alpha: number = getAlpha(vertexID, attrName);
            colorize(attrName, color, alpha, vertexID, 1);
        }

        /** Reads the alpha value from the specified vertex and attribute. */
        getAlpha(vertexID: number, attrName: string = "color"): number {
            var offset: number = attrName == "color" ? _colOffset : getAttribute(attrName).offset;
            _rawData.position = vertexID * _vertexSize + offset;
            var rgba: uint = switchEndian(_rawData.readUnsignedInt());
            return (rgba & 0xff) / 255.0;
        }

        /** Writes the given alpha value to the specified vertex and attribute (range 0-1). */
        setAlpha(vertexID: number, attrName: string, alpha: number): void {
            if (_numVertices < vertexID + 1)
                numVertices = vertexID + 1;

            var color: uint = getColor(vertexID, attrName);
            colorize(attrName, color, alpha, vertexID, 1);
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
            if (numVertices < 0 || vertexID + numVertices > _numVertices)
                numVertices = _numVertices - vertexID;

            if (numVertices == 0) {
                if (matrix == null)
                    out.setEmpty();
                else {
                    MatrixUtil.transformCoords(matrix, 0, 0, sHelperPoint);
                    out.setTo(sHelperPoint.x, sHelperPoint.y, 0, 0);
                }
            }
            else {
                var minX: number = number.MAX_VALUE, maxX: number = -number.MAX_VALUE;
                var minY: number = number.MAX_VALUE, maxY: number = -number.MAX_VALUE;
                var offset: number = attrName == "position" ? _posOffset : getAttribute(attrName).offset;
                var position: number = vertexID * _vertexSize + offset;
                var x: number, y: number, i: number;

                if (matrix == null) {
                    for (i = 0; i < numVertices; ++i) {
                        _rawData.position = position;
                        x = _rawData.readFloat();
                        y = _rawData.readFloat();
                        position += _vertexSize;

                        if (minX > x) minX = x;
                        if (maxX < x) maxX = x;
                        if (minY > y) minY = y;
                        if (maxY < y) maxY = y;
                    }
                }
                else {
                    for (i = 0; i < numVertices; ++i) {
                        _rawData.position = position;
                        x = _rawData.readFloat();
                        y = _rawData.readFloat();
                        position += _vertexSize;

                        MatrixUtil.transformCoords(matrix, x, y, sHelperPoint);

                        if (minX > sHelperPoint.x) minX = sHelperPoint.x;
                        if (maxX < sHelperPoint.x) maxX = sHelperPoint.x;
                        if (minY > sHelperPoint.y) minY = sHelperPoint.y;
                        if (maxY < sHelperPoint.y) maxY = sHelperPoint.y;
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
            if (camPos == null) throw new ArgumentError("camPos must not be null");
            if (numVertices < 0 || vertexID + numVertices > _numVertices)
                numVertices = _numVertices - vertexID;

            if (numVertices == 0) {
                if (matrix)
                    MatrixUtil.transformCoords3D(matrix, 0, 0, 0, sHelperPoint3D);
                else
                    sHelperPoint3D.setTo(0, 0, 0);

                MathUtil.intersectLineWithXYPlane(camPos, sHelperPoint3D, sHelperPoint);
                out.setTo(sHelperPoint.x, sHelperPoint.y, 0, 0);
            }
            else {
                var minX: number = number.MAX_VALUE, maxX: number = -number.MAX_VALUE;
                var minY: number = number.MAX_VALUE, maxY: number = -number.MAX_VALUE;
                var offset: number = attrName == "position" ? _posOffset : getAttribute(attrName).offset;
                var position: number = vertexID * _vertexSize + offset;
                var x: number, y: number, i: number;

                for (i = 0; i < numVertices; ++i) {
                    _rawData.position = position;
                    x = _rawData.readFloat();
                    y = _rawData.readFloat();
                    position += _vertexSize;

                    if (matrix)
                        MatrixUtil.transformCoords3D(matrix, x, y, 0, sHelperPoint3D);
                    else
                        sHelperPoint3D.setTo(x, y, 0);

                    MathUtil.intersectLineWithXYPlane(camPos, sHelperPoint3D, sHelperPoint);

                    if (minX > sHelperPoint.x) minX = sHelperPoint.x;
                    if (maxX < sHelperPoint.x) maxX = sHelperPoint.x;
                    if (minY > sHelperPoint.y) minY = sHelperPoint.y;
                    if (maxY < sHelperPoint.y) maxY = sHelperPoint.y;
                }

                out.setTo(minX, minY, maxX - minX, maxY - minY);
            }

            return out;
        }

        /** Indicates if color attributes should be stored premultiplied with the alpha value.
         *  Changing this value does <strong>not</strong> modify any existing color data.
         *  If you want that, use the <code>setPremultipliedAlpha</code> method instead.
         *  @default true */
        get premultipliedAlpha(): Boolean { return _premultipliedAlpha; }
        set premultipliedAlpha(value: Boolean): void {
            setPremultipliedAlpha(value, false);
        }

        /** Changes the way alpha and color values are stored. Optionally updates all existing
         *  vertices. */
        setPremultipliedAlpha(value: Boolean, updateData: Boolean): void {
            if (updateData && value != _premultipliedAlpha) {
                for (var i: number = 0; i < _numAttributes; ++i) {
                    var attribute: VertexDataAttribute = _attributes[i];
                    if (attribute.isColor) {
                        var pos: number = attribute.offset;
                        var oldColor: uint;
                        var newColor: uint;

                        for (var j: number = 0; j < _numVertices; ++j) {
                            _rawData.position = pos;
                            oldColor = switchEndian(_rawData.readUnsignedInt());
                            newColor = value ? premultiplyAlpha(oldColor) : unmultiplyAlpha(oldColor);

                            _rawData.position = pos;
                            _rawData.writeUnsignedInt(switchEndian(newColor));

                            pos += _vertexSize;
                        }
                    }
                }
            }

            _premultipliedAlpha = value;
        }

        /** Updates the <code>tinted</code> property from the actual color data. This might make
         *  sense after copying part of a tinted VertexData instance to another, since not each
         *  color value is checked in the process. An instance is tinted if any vertices have a
         *  non-white color or are not fully opaque. */
        updateTinted(attrName: string = "color"): Boolean {
            var pos: number = attrName == "color" ? _colOffset : getAttribute(attrName).offset;
            _tinted = false;

            for (var i: number = 0; i < _numVertices; ++i) {
                _rawData.position = pos;

                if (_rawData.readUnsignedInt() != 0xffffffff) {
                    _tinted = true;
                    break;
                }

                pos += _vertexSize;
            }

            return _tinted;
        }

        // modify multiple attributes

        /** Transforms the 2D positions of subsequent vertices by multiplication with a
         *  transformation matrix. */
        transformPoints(attrName: string, matrix: Matrix,
            vertexID: number = 0, numVertices: number = -1): void {
            if (numVertices < 0 || vertexID + numVertices > _numVertices)
                numVertices = _numVertices - vertexID;

            var x: number, y: number;
            var offset: number = attrName == "position" ? _posOffset : getAttribute(attrName).offset;
            var pos: number = vertexID * _vertexSize + offset;
            var endPos: number = pos + numVertices * _vertexSize;

            while (pos < endPos) {
                _rawData.position = pos;
                x = _rawData.readFloat();
                y = _rawData.readFloat();

                _rawData.position = pos;
                _rawData.writeFloat(matrix.a * x + matrix.c * y + matrix.tx);
                _rawData.writeFloat(matrix.d * y + matrix.b * x + matrix.ty);

                pos += _vertexSize;
            }
        }

        /** Translates the 2D positions of subsequent vertices by a certain offset. */
        translatePoints(attrName: string, deltaX: number, deltaY: number,
            vertexID: number = 0, numVertices: number = -1): void {
            if (numVertices < 0 || vertexID + numVertices > _numVertices)
                numVertices = _numVertices - vertexID;

            var x: number, y: number;
            var offset: number = attrName == "position" ? _posOffset : getAttribute(attrName).offset;
            var pos: number = vertexID * _vertexSize + offset;
            var endPos: number = pos + numVertices * _vertexSize;

            while (pos < endPos) {
                _rawData.position = pos;
                x = _rawData.readFloat();
                y = _rawData.readFloat();

                _rawData.position = pos;
                _rawData.writeFloat(x + deltaX);
                _rawData.writeFloat(y + deltaY);

                pos += _vertexSize;
            }
        }

        /** Multiplies the alpha values of subsequent vertices by a certain factor. */
        scaleAlphas(attrName: string, factor: number,
            vertexID: number = 0, numVertices: number = -1): void {
            if (factor == 1.0) return;
            if (numVertices < 0 || vertexID + numVertices > _numVertices)
                numVertices = _numVertices - vertexID;

            _tinted = true; // factor must be != 1, so there's definitely tinting.

            var i: number;
            var offset: number = attrName == "color" ? _colOffset : getAttribute(attrName).offset;
            var colorPos: number = vertexID * _vertexSize + offset;
            var alphaPos: number, alpha: number, rgba: uint;

            for (i = 0; i < numVertices; ++i) {
                alphaPos = colorPos + 3;
                alpha = _rawData[alphaPos] / 255.0 * factor;

                if (alpha > 1.0) alpha = 1.0;
                else if (alpha < 0.0) alpha = 0.0;

                if (alpha == 1.0 || !_premultipliedAlpha) {
                    _rawData[alphaPos] = number(alpha * 255.0);
                }
                else {
                    _rawData.position = colorPos;
                    rgba = unmultiplyAlpha(switchEndian(_rawData.readUnsignedInt()));
                    rgba = (rgba & 0xffffff00) | (number(alpha * 255.0) & 0xff);
                    rgba = premultiplyAlpha(rgba);

                    _rawData.position = colorPos;
                    _rawData.writeUnsignedInt(switchEndian(rgba));
                }

                colorPos += _vertexSize;
            }
        }

        /** Writes the given RGB and alpha values to the specified vertices. */
        colorize(attrName: string = "color", color: uint = 0xffffff, alpha: number = 1.0,
            vertexID: number = 0, numVertices: number = -1): void {
            if (numVertices < 0 || vertexID + numVertices > _numVertices)
                numVertices = _numVertices - vertexID;

            var offset: number = attrName == "color" ? _colOffset : getAttribute(attrName).offset;
            var pos: number = vertexID * _vertexSize + offset;
            var endPos: number = pos + (numVertices * _vertexSize);

            if (alpha > 1.0) alpha = 1.0;
            else if (alpha < 0.0) alpha = 0.0;

            var rgba: uint = ((color << 8) & 0xffffff00) | (number(alpha * 255.0) & 0xff);

            if (rgba == 0xffffffff && numVertices == _numVertices) _tinted = false;
            else if (rgba != 0xffffffff) _tinted = true;

            if (_premultipliedAlpha && alpha != 1.0) rgba = premultiplyAlpha(rgba);

            _rawData.position = vertexID * _vertexSize + offset;
            _rawData.writeUnsignedInt(switchEndian(rgba));

            while (pos < endPos) {
                _rawData.position = pos;
                _rawData.writeUnsignedInt(switchEndian(rgba));
                pos += _vertexSize;
            }
        }

        // format helpers

        /** Returns the format of a certain vertex attribute, identified by its name.
          * Typical values: <code>float1, float2, float3, float4, bytes4</code>. */
        getFormat(attrName: string): string {
            return getAttribute(attrName).format;
        }

        /** Returns the size of a certain vertex attribute in bytes. */
        getSize(attrName: string): number {
            return getAttribute(attrName).size;
        }

        /** Returns the size of a certain vertex attribute in 32 bit units. */
        getSizeIn32Bits(attrName: string): number {
            return getAttribute(attrName).size / 4;
        }

        /** Returns the offset (in bytes) of an attribute within a vertex. */
        getOffset(attrName: string): number {
            return getAttribute(attrName).offset;
        }

        /** Returns the offset (in 32 bit units) of an attribute within a vertex. */
        getOffsetIn32Bits(attrName: string): number {
            return getAttribute(attrName).offset / 4;
        }

        /** Indicates if the VertexData instances contains an attribute with the specified name. */
        hasAttribute(attrName: string): Boolean {
            return getAttribute(attrName) != null;
        }

        // VertexBuffer helpers

        /** Creates a vertex buffer object with the right size to fit the complete data.
         *  Optionally, the current data is uploaded right away. */
        createVertexBuffer(upload: Boolean = false,
            bufferUsage: string = "staticDraw"): VertexBuffer3D {
            var context: Context3D = Starling.context;
            if (context == null) throw new MissingContextError();
            if (_numVertices == 0) return null;

            var buffer: VertexBuffer3D = context.createVertexBuffer(
                _numVertices, _vertexSize / 4, bufferUsage);

            if (upload) uploadToVertexBuffer(buffer);
            return buffer;
        }

        /** Uploads the complete data (or a section of it) to the given vertex buffer. */
        uploadToVertexBuffer(buffer: VertexBuffer3D, vertexID: number = 0, numVertices: number = -1): void {
            if (numVertices < 0 || vertexID + numVertices > _numVertices)
                numVertices = _numVertices - vertexID;

            if (numVertices > 0)
                buffer.uploadFromByteArray(_rawData, 0, vertexID, numVertices);
        }

        [Inline]
        private final function getAttribute(attrName: string): VertexDataAttribute {
            var i: number, attribute: VertexDataAttribute;

            for (i = 0; i < _numAttributes; ++i) {
                attribute = _attributes[i];
                if (attribute.name == attrName) return attribute;
            }

            return null;
        }

    [Inline]
    private static function switchEndian(value: uint): uint {
        return (value & 0xff) << 24 |
            ((value >> 8) & 0xff) << 16 |
            ((value >> 16) & 0xff) << 8 |
            ((value >> 24) & 0xff);
    }

    private static function premultiplyAlpha(rgba: uint): uint {
        var alpha: uint = rgba & 0xff;

        if (alpha == 0xff) return rgba;
        else {
            var factor: number = alpha / 255.0;
            var r: uint = ((rgba >> 24) & 0xff) * factor;
            var g: uint = ((rgba >> 16) & 0xff) * factor;
            var b: uint = ((rgba >> 8) & 0xff) * factor;

            return (r & 0xff) << 24 |
                (g & 0xff) << 16 |
                (b & 0xff) << 8 | alpha;
        }
    }

    private static function unmultiplyAlpha(rgba: uint): uint {
        var alpha: uint = rgba & 0xff;

        if (alpha == 0xff || alpha == 0x0) return rgba;
        else {
            var factor: number = alpha / 255.0;
            var r: uint = ((rgba >> 24) & 0xff) / factor;
            var g: uint = ((rgba >> 16) & 0xff) / factor;
            var b: uint = ((rgba >> 8) & 0xff) / factor;

            return (r & 0xff) << 24 |
                (g & 0xff) << 16 |
                (b & 0xff) << 8 | alpha;
        }
    }

    // properties

    /** The total number of vertices. If you make the object bigger, it will be filled up with
     *  <code>1.0</code> for all alpha values and zero for everything else. */
    get numVertices(): number { return _numVertices; }
    set numVertices(value: number): void
        {
            if(value > _numVertices)
    {
        var oldLength: number = _numVertices * vertexSize;
        var newLength: number = value * _vertexSize;

        if (_rawData.length > oldLength) {
            _rawData.position = oldLength;
            while (_rawData.bytesAvailable) _rawData.writeUnsignedInt(0);
        }

        if (_rawData.length < newLength)
            _rawData.length = newLength;

        for (var i: number = 0; i < _numAttributes; ++i) {
            var attribute: VertexDataAttribute = _attributes[i];
            if (attribute.isColor) // initialize color values with "white" and full alpha
            {
                var pos: number = _numVertices * _vertexSize + attribute.offset;
                for (var j: number = _numVertices; j < value; ++j) {
                    _rawData.position = pos;
                    _rawData.writeUnsignedInt(0xffffffff);
                    pos += _vertexSize;
                }
            }
        }
    }

    if (value == 0) _tinted = false;
    _numVertices = value;
}

/** The raw vertex data; not a copy! */
get rawData(): ByteArray
{
    return _rawData;
}

/** The format that describes the attributes of each vertex.
 *  When you assign a different format, the raw data will be converted accordingly,
 *  i.e. attributes with the same name will still point to the same data.
 *  New properties will be filled up with zeros (except for colors, which will be
 *  initialized with an alpha value of 1.0). As a side-effect, the instance will also
 *  be trimmed. */
get format(): VertexDataFormat
{
    return _format;
}

set format(value: VertexDataFormat): void
    {
        if(_format == value) return;

var a: number, i: number, pos: number;
var srcVertexSize: number = _format.vertexSize;
var tgtVertexSize: number = value.vertexSize;
var numAttributes: number = value.numAttributes;

sBytes.length = value.vertexSize * _numVertices;

for (a = 0; a < numAttributes; ++a) {
    var tgtAttr: VertexDataAttribute = value.attributes[a];
    var srcAttr: VertexDataAttribute = getAttribute(tgtAttr.name);

    if (srcAttr) // copy attributes that exist in both targets
    {
        pos = tgtAttr.offset;

        for (i = 0; i < _numVertices; ++i) {
            sBytes.position = pos;
            sBytes.writeBytes(_rawData, srcVertexSize * i + srcAttr.offset, srcAttr.size);
            pos += tgtVertexSize;
        }
    }
    else if (tgtAttr.isColor) // initialize color values with "white" and full alpha
    {
        pos = tgtAttr.offset;

        for (i = 0; i < _numVertices; ++i) {
            sBytes.position = pos;
            sBytes.writeUnsignedInt(0xffffffff);
            pos += tgtVertexSize;
        }
    }
}

if (value.vertexSize > _format.vertexSize)
    _rawData.clear(); // avoid 4k blowup

_rawData.position = 0;
_rawData.length = sBytes.length;
_rawData.writeBytes(sBytes);
sBytes.length = 0;

_format = value;
_attributes = _format.attributes;
_numAttributes = _attributes.length;
_vertexSize = _format.vertexSize;
_posOffset = _format.hasAttribute("position") ? _format.getOffset("position") : 0;
_colOffset = _format.hasAttribute("color") ? _format.getOffset("color") : 0;
        }

/** Indicates if the mesh contains any vertices that are not white or not fully opaque.
 *  If <code>false</code> (and the value wasn't modified manually), the result is 100%
 *  accurate; <code>true</code> represents just an educated guess. To be entirely sure,
 *  you may call <code>updateTinted()</code>.
 */
get tinted(): Boolean { return _tinted; }
set tinted(value: Boolean): void { _tinted = value; }

/** The format string that describes the attributes of each vertex. */
get formatString(): string
{
    return _format.formatString;
}

/** The size (in bytes) of each vertex. */
get vertexSize(): number
{
    return _vertexSize;
}

/** The size (in 32 bit units) of each vertex. */
get vertexSizeIn32Bits(): number
{
    return _vertexSize / 4;
}

/** The size (in bytes) of the raw vertex data. */
get size(): number
{
    return _numVertices * _vertexSize;
}

/** The size (in 32 bit units) of the raw vertex data. */
get sizeIn32Bits(): number
{
    return _numVertices * _vertexSize / 4;
}
    }
}
