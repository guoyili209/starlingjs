module StarlingJS {
    export class Point {
        x: number;
        y: number;
        static TEMP = new Point();
        static EMPTY = new Point();
        constructor(x: number = 0, y: number = 0) {
            /**该点的水平坐标。*/
            //this.x=NaN;
            /**该点的垂直坐标。*/
            //this.y=NaN;
            (x === void 0) && (x = 0);
            (y === void 0) && (y = 0);
            this.x = x;
            this.y = y;
        }
        setTo(x, y) {
            this.x = x;
            this.y = y;
            return this;
        }

        /**
        *计算当前点和目标点(x，y)的距离。
        *@param x 水平坐标。
        *@param y 垂直坐标。
        *@return 返回当前点和目标点之间的距离。
        */
        distance(x, y) {
            return Math.sqrt((this.x - x) * (this.x - x) + (this.y - y) * (this.y - y));
        }

        /**返回包含 x 和 y 坐标的值的字符串。*/
        toString() {
            return this.x + "," + this.y;
        }

        /**
        *标准化向量。
        */
        normalize() {
            var d = Math.sqrt(this.x * this.x + this.y * this.y);
            if (d > 0) {
                var id = 1.0 / d;
                this.x *= id;
                this.y *= id;
            }
        }
    }
}