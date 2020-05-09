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

    export class IndexData {
        /** The number of bytes per index element. */
        private static readonly INDEX_SIZE: number = 2;

        private _rawData: ByteArray;
        private _numIndices: number;
        private _initialCapacity: number;
        private _useQuadLayout: boolean;

        // basic quad layout
        private static sQuadData: ByteArray = new ByteArray();
        private static sQuadDataNumIndices: number = 0;

        // helper objects
        private static sVector: Array<number> = new Array<number>();
        private static sTrimData: ByteArray = new ByteArray();

        /** Creates an empty IndexData instance with the given capacity (in indices).
         *
         *  @param initialCapacity
         *
         *  The initial capacity affects just the way the numberernal ByteArray is allocated, not the
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
         *  usage of your IndexData instances.</p>
         */
        constructor(initialCapacity: number = 48) {
            this._numIndices = 0;
            this._initialCapacity = initialCapacity;
            this._useQuadLayout = true;
        }

        /** Explicitly frees up the memory used by the ByteArray, thus removing all indices.
         *  Quad layout will be restored (until adding data violating that layout). */
        clear() {
            if (this._rawData)
                this._rawData.clear();

            this._numIndices = 0;
            this._useQuadLayout = true;
        }

        /** Creates a duplicate of the IndexData object. */
        clone(): IndexData {
            var clone: IndexData = new IndexData(this._numIndices);

            if (!this._useQuadLayout) {
                clone.switchToGenericData();
                clone._rawData.writeBytes(this._rawData);
            }

            clone._numIndices = this._numIndices;
            return clone;
        }

        /** Copies the index data (or a range of it, defined by 'indexID' and 'numIndices')
         *  of this instance to another IndexData object, starting at a certain target index.
         *  If the target is not big enough, it will grow to fit all the new indices.
         *
         *  <p>By passing a non-zero <code>offset</code>, you can raise all copied indices
         *  by that value in the target object.</p>
         */
        copyTo(target: IndexData, targetIndexID: number = 0, offset: number = 0,
            indexID: number = 0, numIndices: number = -1): void {
            if (numIndices < 0 || indexID + numIndices > this._numIndices)
                numIndices = this._numIndices - indexID;

            var sourceData: ByteArray, targetData: ByteArray;
            var newNumIndices: number = targetIndexID + numIndices;

            if (target._numIndices < newNumIndices) {
                target._numIndices = newNumIndices;

                if (IndexData.sQuadDataNumIndices < newNumIndices)
                    this.ensureQuadDataCapacity(newNumIndices);
            }

            if (this._useQuadLayout) {
                if (target._useQuadLayout) {
                    var keepsQuadLayout: boolean = true;
                    var distance: number = targetIndexID - indexID;
                    var distanceInQuads: number = distance / 6;
                    var offsetInQuads: number = offset / 4;

                    // This code is executed very often. If it turns out that both IndexData
                    // instances use a quad layout, we don't need to do anything here.
                    //
                    // When "distance / 6 == offset / 4 && distance % 6 == 0 && offset % 4 == 0",
                    // the copy operation preserves the quad layout. In that case, we can exit
                    // right away. The code below is a little more complex, though, to avoid the
                    // (surprisingly costly) mod-operations.

                    if (distanceInQuads == offsetInQuads && (offset & 3) == 0 &&
                        distanceInQuads * 6 == distance) {
                        keepsQuadLayout = true;
                    }
                    else if (numIndices > 2) {
                        keepsQuadLayout = false;
                    }
                    else {
                        for (var i: number = 0; i < numIndices; ++i)
                            keepsQuadLayout &&=
                        this.getBasicQuadIndexAt(indexID + i) + offset ==
                            this.getBasicQuadIndexAt(targetIndexID + i);
                    }

                    if (keepsQuadLayout) return;
                    else target.switchToGenericData();
                }

                sourceData = IndexData.sQuadData;
                targetData = target._rawData;

                if ((offset & 3) == 0) // => offset % 4 == 0
                {
                    indexID += 6 * offset / 4;
                    offset = 0;
                    this.ensureQuadDataCapacity(indexID + numIndices);
                }
            }
            else {
                if (target._useQuadLayout)
                    target.switchToGenericData();

                sourceData = this._rawData;
                targetData = target._rawData;
            }

            targetData.position = targetIndexID * IndexData.INDEX_SIZE;

            if (offset == 0)
                targetData.writeBytes(sourceData, indexID * IndexData.INDEX_SIZE, numIndices * IndexData.INDEX_SIZE);
            else {
                sourceData.position = indexID * IndexData.INDEX_SIZE;

                // by reading junks of 32 instead of 16 bits, we can spare half the time
                while (numIndices > 1) {
                    var indexAB: number = sourceData.readUnsignednumber();
                    var indexA: number = ((indexAB & 0xffff0000) >> 16) + offset;
                    var indexB: number = ((indexAB & 0x0000ffff)) + offset;
                    targetData.writeUnsignednumber(indexA << 16 | indexB);
                    numIndices -= 2;
                }

                if (numIndices)
                    targetData.writeShort(sourceData.readUnsignedShort() + offset);
            }
        }

        /** Sets an index at the specified position. */
        setIndex(indexID: number, index: number): void {
            if (this._numIndices < indexID + 1)
                this.numIndices = indexID + 1;

            if (this._useQuadLayout) {
                if (this.getBasicQuadIndexAt(indexID) == index) return;
                else this.switchToGenericData();
            }

            this._rawData.position = indexID * IndexData.INDEX_SIZE;
            this._rawData.writeShort(index);
        }

        /** Reads the index from the specified position. */
        getIndex(indexID: number): number {
            if (this._useQuadLayout) {
                if (indexID < this._numIndices)
                    return this.getBasicQuadIndexAt(indexID);
                else
                    throw new Error();
            }
            else {
                this._rawData.position = indexID * IndexData.INDEX_SIZE;
                return this._rawData.readUnsignedShort();
            }
        }

        /** Adds an offset to all indices in the specified range. */
        offsetIndices(offset: number, indexID: number = 0, numIndices: number = -1): void {
            if (numIndices < 0 || indexID + numIndices > this._numIndices)
                numIndices = this._numIndices - indexID;

            var endIndex: number = indexID + numIndices;

            for (var i: number = indexID; i < endIndex; ++i)
                this.setIndex(i, this.getIndex(i) + offset);
        }

        /** Appends three indices representing a triangle. Reference the vertices clockwise,
         *  as this defines the front side of the triangle. */
        addTriangle(a: number, b: number, c: number): void {
            if (this._useQuadLayout) {
                if (a == this.getBasicQuadIndexAt(this._numIndices)) {
                    var oddTriangleID: boolean = (this._numIndices & 1) != 0;
                    var evenTriangleID: boolean = !oddTriangleID;

                    if ((evenTriangleID && b == a + 1 && c == b + 1) ||
                        (oddTriangleID && c == a + 1 && b == c + 1)) {
                        this._numIndices += 3;
                        this.ensureQuadDataCapacity(this._numIndices);
                        return;
                    }
                }

                this.switchToGenericData();
            }

            this._rawData.position = this._numIndices * IndexData.INDEX_SIZE;
            this._rawData.writeShort(a);
            this._rawData.writeShort(b);
            this._rawData.writeShort(c);
            this._numIndices += 3;
        }

        /** Appends two triangles spawning up the quad with the given indices.
         *  The indices of the vertices are arranged like this:
         *
         *  <pre>
         *  a - b
         *  | / |
         *  c - d
         *  </pre>
         *
         *  <p>To make sure the indices will follow the basic quad layout, make sure each
         *  parameter increments the one before it (e.g. <code>0, 1, 2, 3</code>).</p>
         */
        addQuad(a: number, b: number, c: number, d: number): void {
            if (this._useQuadLayout) {
                if (a == this.getBasicQuadIndexAt(this._numIndices) &&
                    b == a + 1 && c == b + 1 && d == c + 1) {
                    this._numIndices += 6;
                    this.ensureQuadDataCapacity(this._numIndices);
                    return;
                }
                else this.switchToGenericData();
            }

            this._rawData.position = this._numIndices * IndexData.INDEX_SIZE;
            this._rawData.writeShort(a);
            this._rawData.writeShort(b);
            this._rawData.writeShort(c);
            this._rawData.writeShort(b);
            this._rawData.writeShort(d);
            this._rawData.writeShort(c);
            this._numIndices += 6;
        }

        /** Creates a vector containing all indices. If you pass an existing vector to the method,
         *  its contents will be overwritten. */
        toVector(out?: Array<number>): Array<number> {
            if (!out) out = new Array<number>(this._numIndices);
            else out.length = this._numIndices;

            var rawData: ByteArray = this._useQuadLayout ? IndexData.sQuadData : this._rawData;
            rawData.position = 0;

            for (var i: number = 0; i < this._numIndices; ++i)
                out[i] = rawData.readUnsignedShort();

            return out;
        }

        /** Returns a string representation of the IndexData object,
         *  including a comma-separated list of all indices. */
        toString(): string {
            var string: string = StringUtil.format("[IndexData numIndices={0} indices=\"{1}\"]",
                this._numIndices, this.toVector(IndexData.sVector).join());

            IndexData.sVector.length = 0;
            return string;
        }

        // private helpers

        private switchToGenericData(): void {
            if (this._useQuadLayout) {
                this._useQuadLayout = false;

                if (this._rawData == null) {
                    this._rawData = new ByteArray();
                    this._rawData.endian = Byte.LITTLE_ENDIAN;
                    this._rawData.length = this._initialCapacity * IndexData.INDEX_SIZE; // -> allocated memory
                    this._rawData.length = this._numIndices * IndexData.INDEX_SIZE;      // -> actual length
                }

                if (this._numIndices)
                    this._rawData.writeBytes(IndexData.sQuadData, 0, this._numIndices * IndexData.INDEX_SIZE);
            }
        }

        /** Makes sure that the ByteArray containing the normalized, basic quad data contains at
         *  least <code>numIndices</code> indices. The array might grow, but it will never be
         *  made smaller. */
        private ensureQuadDataCapacity(numIndices: number): void {
            if (IndexData.sQuadDataNumIndices >= numIndices) return;

            var i: number;
            var oldNumQuads: number = IndexData.sQuadDataNumIndices / 6;
            var newNumQuads: number = Math.ceil(numIndices / 6);

            IndexData.sQuadData.endian = Byte.LITTLE_ENDIAN;
            IndexData.sQuadData.position = IndexData.sQuadData.length;
            IndexData.sQuadDataNumIndices = newNumQuads * 6;

            for (i = oldNumQuads; i < newNumQuads; ++i) {
                IndexData.sQuadData.writeShort(4 * i);
                IndexData.sQuadData.writeShort(4 * i + 1);
                IndexData.sQuadData.writeShort(4 * i + 2);
                IndexData.sQuadData.writeShort(4 * i + 1);
                IndexData.sQuadData.writeShort(4 * i + 3);
                IndexData.sQuadData.writeShort(4 * i + 2);
            }
        }

        /** Returns the index that's expected at this position if following basic quad layout. */
        private static getBasicQuadIndexAt(indexID: number): number {
            var quadID: number = indexID / 6;
            var posInQuad: number = indexID - quadID * 6; // => indexID % 6
            var offset: number;

            if (posInQuad == 0) offset = 0;
            else if (posInQuad == 1 || posInQuad == 3) offset = 1;
            else if (posInQuad == 2 || posInQuad == 5) offset = 2;
            else offset = 3;

            return quadID * 4 + offset;
        }

        // IndexBuffer helpers

        /** Creates an index buffer object with the right size to fit the complete data.
         *  Optionally, the current data is uploaded right away. */
        createIndexBuffer(upload: boolean = false,
            bufferUsage: string = "staticDraw"): IndexBuffer3D {
            var context: Context3D = Starling.context;
            if (context == null) throw new MissingContextError();
            if (_numIndices == 0) return null;

            var buffer: IndexBuffer3D = context.createIndexBuffer(this._numIndices, bufferUsage);

            if (upload) this.uploadToIndexBuffer(buffer);
            return buffer;
        }

        /** Uploads the complete data (or a section of it) to the given index buffer. */
        uploadToIndexBuffer(buffer: IndexBuffer3D, indexID: number = 0, numIndices: number = -1): void {
            if (numIndices < 0 || indexID + numIndices > this._numIndices)
                numIndices = this._numIndices - indexID;

            if (numIndices > 0)
                buffer.uploadFromByteArray(this.rawData, 0, indexID, numIndices);
        }

        /** Optimizes the ByteArray so that it has exactly the required capacity, without
         *  wasting any memory. If your IndexData object grows larger than the initial capacity
         *  you passed to the constructor, call this method to avoid the 4k memory problem. */
        trim(): void {
            if (this._useQuadLayout) return;

            IndexData.sTrimData.length = this._rawData.length;
            IndexData.sTrimData.position = 0;
            IndexData.sTrimData.writeBytes(this._rawData);

            this._rawData.clear();
            this._rawData.length = IndexData.sTrimData.length;
            this._rawData.writeBytes(IndexData.sTrimData);

            IndexData.sTrimData.clear();
        }

        // properties

        /** The total number of indices.
         *
         *  <p>If this instance contains only standardized, basic quad indices, resizing
         *  will automatically fill up with appropriate quad indices. Otherwise, it will fill
         *  up with zeroes.</p>
         *
         *  <p>If you set the number of indices to zero, quad layout will be restored.</p> */
        get numIndices(): number { return this._numIndices; }
        set numIndices(value: number): void {
            if (value != this._numIndices) {
                if (this._useQuadLayout) this.ensureQuadDataCapacity(value);
                else this._rawData.length = value * IndexData.INDEX_SIZE;
                if (value == 0) this._useQuadLayout = true;

                this._numIndices = value;
            }
        }

        /** The number of triangles that can be spawned up with the contained indices.
         *  (In other words: the number of indices divided by three.) */
        get numTriangles(): number { return this._numIndices / 3; }
        set numTriangles(value: number): void { this.numIndices = value * 3; }

        /** The number of quads that can be spawned up with the contained indices.
         *  (In other words: the number of triangles divided by two.) */
        get numQuads(): number { return this._numIndices / 6; }
        set numQuads(value: number): void { this.numIndices = value * 6; }

        /** The number of bytes required for each index value. */
        get indexSizeInBytes(): number { return IndexData.INDEX_SIZE; }

        /** Indicates if all indices are following the basic quad layout.
         *
         *  <p>This property is automatically updated if an index is set to a value that violates
         *  basic quad layout. Once the layout was violated, the instance will always stay that
         *  way, even if you fix that violating value later. Only calling <code>clear</code> or
         *  manually enabling the property will restore quad layout.</p>
         *
         *  <p>If you enable this property on an instance, all indices will immediately be
         *  replaced with indices following standard quad layout.</p>
         *
         *  <p>Please look at the class documentation for more information about that kind
         *  of layout, and why it is important.</p>
         *
         *  @default true
         */
        get useQuadLayout(): boolean { return this._useQuadLayout; }
        set useQuadLayout(value: boolean): void {
            if (value != this._useQuadLayout) {
                if (value) {
                    this.ensureQuadDataCapacity(this._numIndices);
                    this._rawData.length = 0;
                    this._useQuadLayout = true;
                }
                else this.switchToGenericData();
            }
        }

        /** The raw index data; not a copy! Beware: the referenced ByteArray may change any time.
         *  Never store a reference to it, and never modify its contents manually. */
        get rawData(): ByteArray {
            if (this._useQuadLayout) return IndexData.sQuadData;
            else return this._rawData;
        }
    }
}
