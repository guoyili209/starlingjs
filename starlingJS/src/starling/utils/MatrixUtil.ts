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
    export class MatrixUtil {
        // helper objects
        private static sRawData: Array<number> =
            [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
        private static sRawData2: Array<number> = new Array<number>(16);
        private static sPoint3D: Vector3D = new Vector3D();
        private static sMatrixData: Array<number> =
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

        /** @private */
        constructor() { throw new AbstractClassError(); }

        /** Converts a 2D matrix to a 3D matrix. If you pass an <code>out</code>-matrix,
         *  the result will be stored in this matrix instead of creating a new object. */
        static convertTo3D(matrix: Matrix, out?: Matrix3D): Matrix3D {
            if (!out) out = new Matrix3D();

            this.sRawData[0] = matrix.a;
            this.sRawData[1] = matrix.b;
            this.sRawData[4] = matrix.c;
            this.sRawData[5] = matrix.d;
            this.sRawData[12] = matrix.tx;
            this.sRawData[13] = matrix.ty;

            out.copyRawDataFrom(this.sRawData);
            return out;
        }

        /** Converts a 3D matrix to a 2D matrix. Beware that this will work only for a 3D matrix
         *  describing a pure 2D transformation. */
        static convertTo2D(matrix3D: Matrix3D, out?: Matrix): Matrix {
            if (!out) out = new Matrix();

            matrix3D.copyRawDataTo(this.sRawData2);
            out.a = this.sRawData2[0];
            out.b = this.sRawData2[1];
            out.c = this.sRawData2[4];
            out.d = this.sRawData2[5];
            out.tx = this.sRawData2[12];
            out.ty = this.sRawData2[13];

            return out;
        }

        /** Determines if the matrix is an identity matrix. */
        static isIdentity(matrix: Matrix): Boolean {
            return matrix.a == 1.0 && matrix.b == 0.0 && matrix.c == 0.0 && matrix.d == 1.0 &&
                matrix.tx == 0.0 && matrix.ty == 0.0;
        }

        /** Determines if the 3D matrix is an identity matrix. */
        static isIdentity3D(matrix: Matrix3D): Boolean {
            var data: Array<number> = this.sRawData2;
            matrix.copyRawDataTo(data);

            return data[0] == 1.0 && data[1] == 0.0 && data[2] == 0.0 && data[3] == 0.0 &&
                data[4] == 0.0 && data[5] == 1.0 && data[6] == 0.0 && data[7] == 0.0 &&
                data[8] == 0.0 && data[9] == 0.0 && data[10] == 1.0 && data[11] == 0.0 &&
                data[12] == 0.0 && data[13] == 0.0 && data[14] == 0.0 && data[15] == 1.0;
        }

        /** Transform a point with the given matrix. */
        static transformPoint(matrix: Matrix, point: Point,
            out?: Point): Point {
            return MatrixUtil.transformCoords(matrix, point.x, point.y, out);
        }

        /** Transforms a 3D point with the given matrix. */
        static transformPoint3D(matrix: Matrix3D, point: Vector3D,
            out?: Vector3D): Vector3D {
            return MatrixUtil.transformCoords3D(matrix, point.x, point.y, point.z, out);
        }

        /** Uses a matrix to transform 2D coordinates into a different space. If you pass an
         *  <code>out</code>-point, the result will be stored in this point instead of creating
         *  a new object. */
        static transformCoords(matrix: Matrix, x: number, y: number,
            out?: Point): Point {
            if (!out) out = new Point();

            out.x = matrix.a * x + matrix.c * y + matrix.tx;
            out.y = matrix.d * y + matrix.b * x + matrix.ty;

            return out;
        }

        /** Uses a matrix to transform 3D coordinates into a different space. If you pass a
         *  'resultVector', the result will be stored in this vector3D instead of creating a
         *  new object. */
        static transformCoords3D(matrix: Matrix3D, x: number, y: number, z: number,
            out?: Vector3D): Vector3D {
            if (!out) out = new Vector3D();

            matrix.copyRawDataTo(this.sRawData2);
            out.x = x * this.sRawData2[0] + y * this.sRawData2[4] + z * this.sRawData2[8] + this.sRawData2[12];
            out.y = x * this.sRawData2[1] + y * this.sRawData2[5] + z * this.sRawData2[9] + this.sRawData2[13];
            out.z = x * this.sRawData2[2] + y * this.sRawData2[6] + z * this.sRawData2[10] + this.sRawData2[14];
            out.w = x * this.sRawData2[3] + y * this.sRawData2[7] + z * this.sRawData2[11] + this.sRawData2[15];

            return out;
        }

        /** Appends a skew transformation to a matrix (angles in radians). The skew matrix
         *  has the following form:
         *  <pre>
         *  | cos(skewY)  -sin(skewX)  0 |
         *  | sin(skewY)   cos(skewX)  0 |
         *  |     0            0       1 |
         *  </pre>
         */
        static skew(matrix: Matrix, skewX: number, skewY: number): void {
            var sinX: number = Math.sin(skewX);
            var cosX: number = Math.cos(skewX);
            var sinY: number = Math.sin(skewY);
            var cosY: number = Math.cos(skewY);

            matrix.setTo(matrix.a * cosY - matrix.b * sinX,
                matrix.a * sinY + matrix.b * cosX,
                matrix.c * cosY - matrix.d * sinX,
                matrix.c * sinY + matrix.d * cosX,
                matrix.tx * cosY - matrix.ty * sinX,
                matrix.tx * sinY + matrix.ty * cosX);
        }

        /** Prepends a matrix to 'base' by multiplying it with another matrix. */
        static prependMatrix(base: Matrix, prep: Matrix): void {
            base.setTo(base.a * prep.a + base.c * prep.b,
                base.b * prep.a + base.d * prep.b,
                base.a * prep.c + base.c * prep.d,
                base.b * prep.c + base.d * prep.d,
                base.tx + base.a * prep.tx + base.c * prep.ty,
                base.ty + base.b * prep.tx + base.d * prep.ty);
        }

        /** Prepends an incremental translation to a Matrix object. */
        static prependTranslation(matrix: Matrix, tx: number, ty: number): void {
            matrix.tx += matrix.a * tx + matrix.c * ty;
            matrix.ty += matrix.b * tx + matrix.d * ty;
        }

        /** Prepends an incremental scale change to a Matrix object. */
        static prependScale(matrix: Matrix, sx: number, sy: number): void {
            matrix.setTo(matrix.a * sx, matrix.b * sx,
                matrix.c * sy, matrix.d * sy,
                matrix.tx, matrix.ty);
        }

        /** Prepends an incremental rotation to a Matrix object (angle in radians). */
        static prependRotation(matrix: Matrix, angle: number): void {
            var sin: number = Math.sin(angle);
            var cos: number = Math.cos(angle);

            matrix.setTo(matrix.a * cos + matrix.c * sin, matrix.b * cos + matrix.d * sin,
                matrix.c * cos - matrix.a * sin, matrix.d * cos - matrix.b * sin,
                matrix.tx, matrix.ty);
        }

        /** Prepends a skew transformation to a Matrix object (angles in radians). The skew matrix
         *  has the following form:
         *  <pre>
         *  | cos(skewY)  -sin(skewX)  0 |
         *  | sin(skewY)   cos(skewX)  0 |
         *  |     0            0       1 |
         *  </pre>
         */
        static prependSkew(matrix: Matrix, skewX: number, skewY: number): void {
            var sinX: number = Math.sin(skewX);
            var cosX: number = Math.cos(skewX);
            var sinY: number = Math.sin(skewY);
            var cosY: number = Math.cos(skewY);

            matrix.setTo(matrix.a * cosY + matrix.c * sinY,
                matrix.b * cosY + matrix.d * sinY,
                matrix.c * cosX - matrix.a * sinX,
                matrix.d * cosX - matrix.b * sinX,
                matrix.tx, matrix.ty);
        }

        /** Converts a Matrix3D instance to a string, which is useful when debugging. Per default,
         *  the raw data is displayed transposed, so that the columns are displayed vertically. */
        static tostring3D(matrix: Matrix3D, transpose: Boolean = true,
            precision: number = 3): string {
            if (transpose) matrix.transpose();
            matrix.copyRawDataTo(this.sRawData2);
            if (transpose) matrix.transpose();

            return "[Matrix3D rawData=\n" + MatrixUtil.formatRawData(this.sRawData2, 4, 4, precision) + "\n]";
        }

        /** Converts a Matrix instance to a string, which is useful when debugging. */
        static tostring(matrix: Matrix, precision: number = 3): string {
            this.sRawData2[0] = matrix.a; this.sRawData2[1] = matrix.c; this.sRawData2[2] = matrix.tx;
            this.sRawData2[3] = matrix.b; this.sRawData2[4] = matrix.d; this.sRawData2[5] = matrix.ty;

            return "[Matrix rawData=\n" + MatrixUtil.formatRawData(this.sRawData2, 3, 2, precision) + "\n]";
        }

        private static formatRawData(data: Array<number>, numCols: number, numRows: number,
            precision: number, indent: string = "  "): string {
            var result: string = indent;
            var numValues: number = numCols * numRows;
            var highestValue: number = 0.0;
            var valuestring: string;
            var value: number;

            for (var i: number = 0; i < numValues; ++i) {
                value = Math.abs(data[i]);
                if (value > highestValue) highestValue = value;
            }

            var numChars: number = highestValue.toFixed(precision).length + 1;

            for (var y: number = 0; y < numRows; ++y) {
                for (var x: number = 0; x < numCols; ++x) {
                    value = data[numCols * y + x];
                    valuestring = value.toFixed(precision);

                    while (valuestring.length < numChars) valuestring = " " + valuestring;

                    result += valuestring;
                    if (x != numCols - 1) result += ", ";
                }

                if (y != numRows - 1) result += "\n" + indent;
            }

            return result;
        }

        /** Updates the given matrix so that it points exactly to pixel boundaries. This works
         *  only if the object is unscaled and rotated by a multiple of 90 degrees.
         *
         *  @param matrix    The matrix to manipulate in place (normally the modelview matrix).
         *  @param pixelSize The size (in points) that represents one pixel in the back buffer.
         */
        static snapToPixels(matrix: Matrix, pixelSize: number): void {
            // Snapping only makes sense if the object is unscaled and rotated only by
            // multiples of 90 degrees. If that's the case can be found out by looking
            // at the modelview matrix.

            const E: number = 0.0001;

            var doSnap: Boolean = false;
            var aSq: number, bSq: number, cSq: number, dSq: number;

            if (matrix.b + E > 0 && matrix.b - E < 0 && matrix.c + E > 0 && matrix.c - E < 0) {
                // what we actually want is 'Math.abs(matrix.a)', but squaring
                // the value works just as well for our needs & is faster.

                aSq = matrix.a * matrix.a;
                dSq = matrix.d * matrix.d;
                doSnap = aSq + E > 1 && aSq - E < 1 && dSq + E > 1 && dSq - E < 1;
            }
            else if (matrix.a + E > 0 && matrix.a - E < 0 && matrix.d + E > 0 && matrix.d - E < 0) {
                bSq = matrix.b * matrix.b;
                cSq = matrix.c * matrix.c;
                doSnap = bSq + E > 1 && bSq - E < 1 && cSq + E > 1 && cSq - E < 1;
            }

            if (doSnap) {
                matrix.tx = Math.round(matrix.tx / pixelSize) * pixelSize;
                matrix.ty = Math.round(matrix.ty / pixelSize) * pixelSize;
            }
        }

        /** Creates a perspective projection matrix suitable for 2D and 3D rendering.
         *
         *  <p>The first 4 parameters define which area of the stage you want to view (the camera
         *  will 'zoom' to exactly this region). The final 3 parameters determine the perspective
         *  in which you're looking at the stage.</p>
         *
         *  <p>The stage is always on the rectangle that is spawned up between x- and y-axis (with
         *  the given size). All objects that are exactly on that rectangle (z equals zero) will be
         *  rendered in their true size, without any distortion.</p>
         *
         *  <p>If you pass only the first 4 parameters, the camera will be set up above the center
         *  of the stage, with a field of view of 1.0 rad.</p>
         */
        static createPerspectiveProjectionMatrix(
            x: number, y: number, width: number, height: number,
            stageWidth: number = 0, stageHeight: number = 0, cameraPos?: Vector3D,
            out?: Matrix3D): Matrix3D {
            if (out == null) out = new Matrix3D();
            if (stageWidth <= 0) stageWidth = width;
            if (stageHeight <= 0) stageHeight = height;
            if (cameraPos == null) {
                cameraPos = this.sPoint3D;
                cameraPos.setTo(
                    stageWidth / 2, stageHeight / 2,   // -> center of stage
                    stageWidth / Math.tan(0.5) * 0.5); // -> fieldOfView = 1.0 rad
            }

            const focalLength: number = Math.abs(cameraPos.z);
            const offsetX: number = cameraPos.x - stageWidth / 2;
            const offsetY: number = cameraPos.y - stageHeight / 2;
            const far: number = focalLength * 20;
            const near: number = 1;
            const scaleX: number = stageWidth / width;
            const scaleY: number = stageHeight / height;

            // set up general perspective
            this.sMatrixData[0] = 2 * focalLength / stageWidth;  // 0,0
            this.sMatrixData[5] = -2 * focalLength / stageHeight; // 1,1  [negative to invert y-axis]
            this.sMatrixData[10] = far / (far - near);            // 2,2
            this.sMatrixData[14] = -far * near / (far - near);     // 2,3
            this.sMatrixData[11] = 1;                             // 3,2

            // now zoom in to visible area
            this.sMatrixData[0] *= scaleX;
            this.sMatrixData[5] *= scaleY;
            this.sMatrixData[8] = scaleX - 1 - 2 * scaleX * (x - offsetX) / stageWidth;
            this.sMatrixData[9] = -scaleY + 1 + 2 * scaleY * (y - offsetY) / stageHeight;

            out.copyRawDataFrom(this.sMatrixData);
            Matrix3D.translation(new Vector3D(-stageWidth / 2.0 - offsetX,
                -stageHeight / 2.0 - offsetY,
                focalLength), out);
            return out;
        }

        /** Creates a orthographic projection matrix suitable for 2D rendering. */
        static createOrthographicProjectionMatrix(
            x: number, y: number, width: number, height: number, out?: Matrix): Matrix {
            if (!out) out = new Matrix();

            out.setTo(2.0 / width, 0, 0, -2.0 / height,
                -(2 * x + width) / width, (2 * y + height) / height);

            return out;
        }
    }
}