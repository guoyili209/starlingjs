module StarlingJS {
    export class Matrix {
        static EMPTY = new Matrix();
        static TEMP = new Matrix();
        static _cache: any[] = [];
        inPool;
        bTransform;
        a;
        b;
        c;
        d;
        tx;
        ty;
        constructor(a?, b?, c?, d?, tx?, ty?) {
            /**缩放或旋转图像时影响像素沿 x 轴定位的值。*/
            //this.a=NaN;
            /**旋转或倾斜图像时影响像素沿 y 轴定位的值。*/
            //this.b=NaN;
            /**旋转或倾斜图像时影响像素沿 x 轴定位的值。*/
            //this.c=NaN;
            /**缩放或旋转图像时影响像素沿 y 轴定位的值。*/
            //this.d=NaN;
            /**沿 x 轴平移每个点的距离。*/
            //this.tx=NaN;
            /**沿 y 轴平移每个点的距离。*/
            //this.ty=NaN;
            /**@private 表示此对象是否在对象池中。*/
            this.inPool = false;
            /**@private 是否有改变矩阵的值。*/
            this.bTransform = false;
            (a === void 0) && (a = 1);
            (b === void 0) && (b = 0);
            (c === void 0) && (c = 0);
            (d === void 0) && (d = 1);
            (tx === void 0) && (tx = 0);
            (ty === void 0) && (ty = 0);
            this.a = a;
            this.b = b;
            this.c = c;
            this.d = d;
            this.tx = tx;
            this.ty = ty;
            this._checkTransform();
        }

        /**
        *将本矩阵设置为单位矩阵。
        *@return 返回当前矩形。
        */
        identity() {
            this.a = this.d = 1;
            this.b = this.tx = this.ty = this.c = 0;
            this.bTransform = false;
            return this;
        }

        /**@private */
        _checkTransform() {
            return this.bTransform = (this.a !== 1 || this.b !== 0 || this.c !== 0 || this.d !== 1);
        }

        /**
        *设置沿 x 、y 轴平移每个点的距离。
        *@param x 沿 x 轴平移每个点的距离。
        *@param y 沿 y 轴平移每个点的距离。
        *@return 返回对象本身
        */
        setTranslate(x, y) {
            this.tx = x;
            this.ty = y;
            return this;
        }

        /**
        *沿 x 和 y 轴平移矩阵，平移的变化量由 x 和 y 参数指定。
        *@param x 沿 x 轴向右移动的量（以像素为单位）。
        *@param y 沿 y 轴向下移动的量（以像素为单位）。
        *@return 返回此矩形对象。
        */
        translate(x, y) {
            this.tx += x;
            this.ty += y;
            return this;
        }

        /**
        *对矩阵应用缩放转换。
        *@param x 用于沿 x 轴缩放对象的乘数。
        *@param y 用于沿 y 轴缩放对象的乘数。
        */
        scale(x, y) {
            this.a *= x;
            this.d *= y;
            this.c *= x;
            this.b *= y;
            this.tx *= x;
            this.ty *= y;
            this.bTransform = true;
        }

        /**
        *对 Matrix 对象应用旋转转换。
        *@param angle 以弧度为单位的旋转角度。
        */
        rotate(angle) {
            var cos = Math.cos(angle);
            var sin = Math.sin(angle);
            var a1 = this.a;
            var c1 = this.c;
            var tx1 = this.tx;
            this.a = a1 * cos - this.b * sin;
            this.b = a1 * sin + this.b * cos;
            this.c = c1 * cos - this.d * sin;
            this.d = c1 * sin + this.d * cos;
            this.tx = tx1 * cos - this.ty * sin;
            this.ty = tx1 * sin + this.ty * cos;
            this.bTransform = true;
        }

        /**
        *对 Matrix 对象应用倾斜转换。
        *@param x 沿着 X 轴的 2D 倾斜弧度。
        *@param y 沿着 Y 轴的 2D 倾斜弧度。
        *@return 当前 Matrix 对象。
        */
        skew(x, y) {
            var tanX = Math.tan(x);
            var tanY = Math.tan(y);
            var a1 = this.a;
            var b1 = this.b;
            this.a += tanY * this.c;
            this.b += tanY * this.d;
            this.c += tanX * a1;
            this.d += tanX * b1;
            return this;
        }

        /**
        *对指定的点应用当前矩阵的逆转化并返回此点。
        *@param out 待转化的点 Point 对象。
        *@return 返回out
        */
        invertTransformPoint(out) {
            var a1 = this.a;
            var b1 = this.b;
            var c1 = this.c;
            var d1 = this.d;
            var tx1 = this.tx;
            var n = a1 * d1 - b1 * c1;
            var a2 = d1 / n;
            var b2 = -b1 / n;
            var c2 = -c1 / n;
            var d2 = a1 / n;
            var tx2 = (c1 * this.ty - d1 * tx1) / n;
            var ty2 = -(a1 * this.ty - b1 * tx1) / n;
            return out.setTo(a2 * out.x + c2 * out.y + tx2, b2 * out.x + d2 * out.y + ty2);
        }

        /**
        *将 Matrix 对象表示的几何转换应用于指定点。
        *@param out 用来设定输出结果的点。
        *@return 返回out
        */
        transformPoint(out) {
            return out.setTo(this.a * out.x + this.c * out.y + this.tx, this.b * out.x + this.d * out.y + this.ty);
        }

        /**
        *将 Matrix 对象表示的几何转换应用于指定点，忽略tx、ty。
        *@param out 用来设定输出结果的点。
        *@return 返回out
        */
        transformPointN(out) {
            return out.setTo(this.a * out.x + this.c * out.y, this.b * out.x + this.d * out.y);
        }

        /**
        *@private
        *将 Matrix 对象表示的几何转换应用于指定点。
        *@param data 点集合。
        *@param out 存储应用转化的点的列表。
        *@return 返回out数组
        */
        transformPointArray(data, out) {
            var len = data.length;
            for (var i = 0; i < len; i += 2) {
                var x = data[i], y = data[i + 1];
                out[i] = this.a * x + this.c * y + this.tx;
                out[i + 1] = this.b * x + this.d * y + this.ty;
            }
            return out;
        }

        /**
        *@private
        *将 Matrix 对象表示的几何缩放转换应用于指定点。
        *@param data 点集合。
        *@param out 存储应用转化的点的列表。
        *@return 返回out数组
        */
        transformPointArrayScale(data, out) {
            var len = data.length;
            for (var i = 0; i < len; i += 2) {
                var x = data[i], y = data[i + 1];
                out[i] = this.a * x + this.c * y;
                out[i + 1] = this.b * x + this.d * y;
            }
            return out;
        }

        /**
        *获取 X 轴缩放值。
        *@return X 轴缩放值。
        */
        getScaleX() {
            return this.b === 0 ? this.a : Math.sqrt(this.a * this.a + this.b * this.b);
        }

        /**
        *获取 Y 轴缩放值。
        *@return Y 轴缩放值。
        */
        getScaleY() {
            return this.c === 0 ? this.d : Math.sqrt(this.c * this.c + this.d * this.d);
        }

        /**
        *执行原始矩阵的逆转换。
        *@return 当前矩阵对象。
        */
        invert() {
            var a1 = this.a;
            var b1 = this.b;
            var c1 = this.c;
            var d1 = this.d;
            var tx1 = this.tx;
            var n = a1 * d1 - b1 * c1;
            this.a = d1 / n;
            this.b = -b1 / n;
            this.c = -c1 / n;
            this.d = a1 / n;
            this.tx = (c1 * this.ty - d1 * tx1) / n;
            this.ty = -(a1 * this.ty - b1 * tx1) / n;
            return this;
        }

        /**
        *将 Matrix 的成员设置为指定值。
        *@param a 缩放或旋转图像时影响像素沿 x 轴定位的值。
        *@param b 旋转或倾斜图像时影响像素沿 y 轴定位的值。
        *@param c 旋转或倾斜图像时影响像素沿 x 轴定位的值。
        *@param d 缩放或旋转图像时影响像素沿 y 轴定位的值。
        *@param tx 沿 x 轴平移每个点的距离。
        *@param ty 沿 y 轴平移每个点的距离。
        *@return 当前矩阵对象。
        */
        setTo(a, b, c, d, tx, ty) {
            this.a = a, this.b = b, this.c = c, this.d = d, this.tx = tx, this.ty = ty;
            return this;
        }

        /**
        *将指定矩阵与当前矩阵连接，从而将这两个矩阵的几何效果有效地结合在一起。
        *@param matrix 要连接到源矩阵的矩阵。
        *@return 当前矩阵。
        */
        concat(matrix) {
            var a = this.a;
            var c = this.c;
            var tx = this.tx;
            this.a = a * matrix.a + this.b * matrix.c;
            this.b = a * matrix.b + this.b * matrix.d;
            this.c = c * matrix.a + this.d * matrix.c;
            this.d = c * matrix.b + this.d * matrix.d;
            this.tx = tx * matrix.a + this.ty * matrix.c + matrix.tx;
            this.ty = tx * matrix.b + this.ty * matrix.d + matrix.ty;
            return this;
        }

        /**
        *@private
        *对矩阵应用缩放转换。反向相乘
        *@param x 用于沿 x 轴缩放对象的乘数。
        *@param y 用于沿 y 轴缩放对象的乘数。
        */
        scaleEx(x, y) {
            var ba = this.a, bb = this.b, bc = this.c, bd = this.d;
            if (bb !== 0 || bc !== 0) {
                this.a = x * ba;
                this.b = x * bb;
                this.c = y * bc;
                this.d = y * bd;
            } else {
                this.a = x * ba;
                this.b = 0 * bd;
                this.c = 0 * ba;
                this.d = y * bd;
            }
            this.bTransform = true;
        }

        /**
        *@private
        *对 Matrix 对象应用旋转转换。反向相乘
        *@param angle 以弧度为单位的旋转角度。
        */
        rotateEx(angle) {
            var cos = Math.cos(angle);
            var sin = Math.sin(angle);
            var ba = this.a, bb = this.b, bc = this.c, bd = this.d;
            if (bb !== 0 || bc !== 0) {
                this.a = cos * ba + sin * bc;
                this.b = cos * bb + sin * bd;
                this.c = -sin * ba + cos * bc;
                this.d = -sin * bb + cos * bd;
            } else {
                this.a = cos * ba;
                this.b = sin * bd;
                this.c = -sin * ba;
                this.d = cos * bd;
            }
            this.bTransform = true;
        }

        /**
        *返回此 Matrix 对象的副本。
        *@return 与原始实例具有完全相同的属性的新 Matrix 实例。
        */
        clone() {
            var dec = Matrix.create();
            dec.a = this.a;
            dec.b = this.b;
            dec.c = this.c;
            dec.d = this.d;
            dec.tx = this.tx;
            dec.ty = this.ty;
            dec.bTransform = this.bTransform;
            return dec;
        }

        /**
        *将当前 Matrix 对象中的所有矩阵数据复制到指定的 Matrix 对象中。
        *@param dec 要复制当前矩阵数据的 Matrix 对象。
        *@return 已复制当前矩阵数据的 Matrix 对象。
        */
        copyTo(dec) {
            dec.a = this.a;
            dec.b = this.b;
            dec.c = this.c;
            dec.d = this.d;
            dec.tx = this.tx;
            dec.ty = this.ty;
            dec.bTransform = this.bTransform;
            return dec;
        }
        copyFrom(sourceMatrix) {
            this.a = sourceMatrix.a
            this.b = sourceMatrix.b;
            this.c = sourceMatrix.c;
            this.d = sourceMatrix.d;
            this.tx = sourceMatrix.tx;
            this.ty = sourceMatrix.ty;
            this.bTransform = sourceMatrix.bTransform;
        }
        /**
        *返回列出该 Matrix 对象属性的文本值。
        *@return 一个字符串，它包含 Matrix 对象的属性值：a、b、c、d、tx 和 ty。
        */
        toString() {
            return this.a + "," + this.b + "," + this.c + "," + this.d + "," + this.tx + "," + this.ty;
        }

        /**
        *销毁此对象。
        */
        destroy() {
            if (this.inPool) return;
            var cache = Matrix._cache;
            this.inPool = true;
            cache.length || (cache.length = 0);
            cache[cache.length++] = this;
            this.a = this.d = 1;
            this.b = this.c = this.tx = this.ty = 0;
            this.bTransform = false;
        }

        static mul(m1, m2, out) {
            var aa = m1.a, ab = m1.b, ac = m1.c, ad = m1.d, atx = m1.tx, aty = m1.ty;
            var ba = m2.a, bb = m2.b, bc = m2.c, bd = m2.d, btx = m2.tx, bty = m2.ty;
            if (bb !== 0 || bc !== 0) {
                out.a = aa * ba + ab * bc;
                out.b = aa * bb + ab * bd;
                out.c = ac * ba + ad * bc;
                out.d = ac * bb + ad * bd;
                out.tx = ba * atx + bc * aty + btx;
                out.ty = bb * atx + bd * aty + bty;
            } else {
                out.a = aa * ba;
                out.b = ab * bd;
                out.c = ac * ba;
                out.d = ad * bd;
                out.tx = ba * atx + btx;
                out.ty = bd * aty + bty;
            }
            return out;
        }

        static mul16(m1, m2, out) {
            var aa = m1.a, ab = m1.b, ac = m1.c, ad = m1.d, atx = m1.tx, aty = m1.ty;
            var ba = m2.a, bb = m2.b, bc = m2.c, bd = m2.d, btx = m2.tx, bty = m2.ty;
            if (bb !== 0 || bc !== 0) {
                out[0] = aa * ba + ab * bc;
                out[1] = aa * bb + ab * bd;
                out[4] = ac * ba + ad * bc;
                out[5] = ac * bb + ad * bd;
                out[12] = ba * atx + bc * aty + btx;
                out[13] = bb * atx + bd * aty + bty;
            } else {
                out[0] = aa * ba;
                out[1] = ab * bd;
                out[4] = ac * ba;
                out[5] = ad * bd;
                out[12] = ba * atx + btx;
                out[13] = bd * aty + bty;
            }
            return out;
        }

        static mulPre(m1, ba, bb, bc, bd, btx, bty, out) {
            var aa = m1.a, ab = m1.b, ac = m1.c, ad = m1.d, atx = m1.tx, aty = m1.ty;
            if (bb !== 0 || bc !== 0) {
                out.a = aa * ba + ab * bc;
                out.b = aa * bb + ab * bd;
                out.c = ac * ba + ad * bc;
                out.d = ac * bb + ad * bd;
                out.tx = ba * atx + bc * aty + btx;
                out.ty = bb * atx + bd * aty + bty;
            } else {
                out.a = aa * ba;
                out.b = ab * bd;
                out.c = ac * ba;
                out.d = ad * bd;
                out.tx = ba * atx + btx;
                out.ty = bd * aty + bty;
            }
            return out;
        }

        static mulPos(m1, aa, ab, ac, ad, atx, aty, out) {
            var ba = m1.a, bb = m1.b, bc = m1.c, bd = m1.d, btx = m1.tx, bty = m1.ty;
            if (bb !== 0 || bc !== 0) {
                out.a = aa * ba + ab * bc;
                out.b = aa * bb + ab * bd;
                out.c = ac * ba + ad * bc;
                out.d = ac * bb + ad * bd;
                out.tx = ba * atx + bc * aty + btx;
                out.ty = bb * atx + bd * aty + bty;
            } else {
                out.a = aa * ba;
                out.b = ab * bd;
                out.c = ac * ba;
                out.d = ad * bd;
                out.tx = ba * atx + btx;
                out.ty = bd * aty + bty;
            }
            return out;
        }

        static preMul(parent, self, out) {
            var pa = parent.a, pb = parent.b, pc = parent.c, pd = parent.d;
            var na = self.a, nb = self.b, nc = self.c, nd = self.d, ntx = self.tx, nty = self.ty;
            out.a = na * pa;
            out.b = out.c = 0;
            out.d = nd * pd;
            out.tx = ntx * pa + parent.tx;
            out.ty = nty * pd + parent.ty;
            if (nb !== 0 || nc !== 0 || pb !== 0 || pc !== 0) {
                out.a += nb * pc;
                out.d += nc * pb;
                out.b += na * pb + nb * pd;
                out.c += nc * pa + nd * pc;
                out.tx += nty * pc;
                out.ty += ntx * pb;
            }
            return out;
        }

        static preMulXY(parent, x, y, out) {
            var pa = parent.a, pb = parent.b, pc = parent.c, pd = parent.d;
            out.a = pa;
            out.b = pb;
            out.c = pc;
            out.d = pd;
            out.tx = x * pa + parent.tx + y * pc;
            out.ty = y * pd + parent.ty + x * pb;
            return out;
        }

        static create() {
            var cache = Matrix._cache;
            var mat = !cache.length ? (new Matrix()) : cache[--cache.length];
            mat.inPool = false;
            return mat;
        }
    }
}