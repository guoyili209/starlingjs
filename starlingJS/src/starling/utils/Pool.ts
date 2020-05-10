module StarlingJS {
    export class Pool {
        //------laya pool---------
        static _poolDic = {};
        static InPoolSign = "__InPool";
        constructor() { }
        static getPoolBySign(sign) {
            return Pool._poolDic[sign] || (Pool._poolDic[sign] = []);
        }

        static clearBySign(sign) {
            if (Pool._poolDic[sign]) Pool._poolDic[sign].length = 0;
        }

        static recover(sign, item) {
            if (item["__InPool"]) return;
            item["__InPool"] = true;
            Pool.getPoolBySign(sign).push(item);
        }

        static getItemByClass(sign, cls) {
            var pool = Pool.getPoolBySign(sign);
            var rst = pool.length ? pool.pop() : new cls();
            rst["__InPool"] = false;
            return rst;
        }

        static getItemByCreateFun(sign, createFun, caller) {
            var pool = Pool.getPoolBySign(sign);
            var rst = pool.length ? pool.pop() : createFun.call(caller);
            rst["__InPool"] = false;
            return rst;
        }

        static getItem(sign) {
            var pool = Pool.getPoolBySign(sign);
            var rst = pool.length ? pool.pop() : null;
            if (rst) {
                rst["__InPool"] = false;
            }
            return rst;
        }

        //---------starling pool-------------
        private static sPoints: Array<Point> = new Array<Point>();
        private static sPoints3D: Array<Vector3D> = new Array<Vector3D>();
        private static sMatrices: Array<Matrix> = new Array<Matrix>();
        private static sMatrices3D: Array<Matrix3D> = new Array<Matrix3D>();
        private static sRectangles: Array<Rectangle> = new Array<Rectangle>();
        private static sArrays: Array<Array<any>> = new Array<Array<any>>();

        static getPoint(x: number = 0, y: number = 0): Point {
            if (Pool.sPoints.length == 0) return new Point(x, y);
            else {
                var point: Point = Pool.sPoints.pop();
                point.x = x; point.y = y;
                return point;
            }
        }

        /** Stores a Point instance in the pool.
         *  Don't keep any references to the object after moving it to the pool! */
        static putPoint(point: Point): void {
            if (point) Pool.sPoints[Pool.sPoints.length] = point;
        }

        /** Retrieves a Vector3D instance from the pool. */
        static getPoint3D(x: number = 0, y: number = 0, z: number = 0): Vector3D {
            if (Pool.sPoints3D.length == 0) return new Vector3D(x, y, z);
            else {
                var point: Vector3D = Pool.sPoints3D.pop();
                point.x = x; point.y = y; point.z = z;
                return point;
            }
        }

        /** Stores a Vector3D instance in the pool.
         *  Don't keep any references to the object after moving it to the pool! */
        static putPoint3D(point: Vector3D): void {
            if (point) Pool.sPoints3D[Pool.sPoints3D.length] = point;
        }

        /** Retrieves a Matrix instance from the pool. */
        static getMatrix(a: number = 1, b: number = 0, c: number = 0, d: number = 1,
            tx: number = 0, ty: number = 0): Matrix {
            if (Pool.sMatrices.length == 0) return new Matrix(a, b, c, d, tx, ty);
            else {
                var matrix: Matrix = Pool.sMatrices.pop();
                matrix.setTo(a, b, c, d, tx, ty);
                return matrix;
            }
        }

        /** Stores a Matrix instance in the pool.
         *  Don't keep any references to the object after moving it to the pool! */
        static putMatrix(matrix: Matrix): void {
            if (matrix) Pool.sMatrices[Pool.sMatrices.length] = matrix;
        }

        /** Retrieves a Matrix3D instance from the pool.
         *
         *  @param identity   If enabled, the matrix will be reset to the identity.
         *                    Otherwise, its contents is undefined.
         */
        static getMatrix3D(identity: Boolean = true): Matrix3D {
            if (Pool.sMatrices3D.length == 0) return new Matrix3D();
            else {
                var matrix: Matrix3D = Pool.sMatrices3D.pop();
                if (identity) matrix.identity();
                return matrix;
            }
        }

        /** Stores a Matrix3D instance in the pool.
         *  Don't keep any references to the object after moving it to the pool! */
        static putMatrix3D(matrix: Matrix3D): void {
            if (matrix) Pool.sMatrices3D[Pool.sMatrices3D.length] = matrix;
        }

        /** Retrieves a Rectangle instance from the pool. */
        static getRectangle(x: number = 0, y: number = 0,
            width: number = 0, height: number = 0): Rectangle {
            if (Pool.sRectangles.length == 0) return new Rectangle(x, y, width, height);
            else {
                var rectangle: Rectangle = Pool.sRectangles.pop();
                rectangle.setTo(x, y, width, height);
                return rectangle;
            }
        }

        /** Stores a Rectangle instance in the pool.
         *  Don't keep any references to the object after moving it to the pool! */
        static putRectangle(rectangle: Rectangle): void {
            if (rectangle) Pool.sRectangles[Pool.sRectangles.length] = rectangle;
        }

        /** Retrieves an Array instance from the pool. */
        static getArray(): Array<any> {
            if (Pool.sArrays.length == 0) return [];
            else return Pool.sArrays.pop();
        }

        /** Stores an Array instance in the pool (after purging it).
         *  Don't keep any references to the array after moving it to the pool! */
        static putArray(array: Array<any>): void {
            array.length = 0;
            Pool.sArrays[Pool.sArrays.length] = array;
        }
    }
}