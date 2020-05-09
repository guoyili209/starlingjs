module StarlingJS {
    export class Vector3D {
        elements;
        constructor(x?, y?, z?, w?) {
            this.elements = new Float32Array(4);
            (x === void 0) && (x = 0);
            (y === void 0) && (y = 0);
            (z === void 0) && (z = 0);
            (w === void 0) && (w = 0);
            var v = this.elements;
            v[0] = x;
            v[1] = y;
            v[2] = z;
            v[3] = w;
        }


        /**
        *从Array数组拷贝值。
        *@param array 数组。
        *@param offset 数组偏移。
        */
        fromArray(array, offset) {
            (offset === void 0) && (offset = 0);
            this.elements[0] = array[offset + 0];
            this.elements[1] = array[offset + 1];
            this.elements[2] = array[offset + 2];
            this.elements[3] = array[offset + 3];
        }
        setTo(xa, ya, za, wa?) {
            this.elements[0] = xa;
            this.elements[1] = ya;
            this.elements[2] = za;
            (wa && wa > -1) && (this.elements[3] = wa);
        }
        /**
        *克隆。
        *@param destObject 克隆源。
        */
        cloneTo(destObject) {
            var destVector4 = destObject;
            var destE = destVector4.elements;
            var s = this.elements;
            destE[0] = s[0];
            destE[1] = s[1];
            destE[2] = s[2];
            destE[3] = s[3];
        }

        /**
        *克隆。
        *@return 克隆副本。
        */
        clone() {
            var destVector4 = new Vector3D();
            this.cloneTo(destVector4);
            return destVector4;
        }

        /**
        *求四维向量的长度。
        *@return 长度。
        */
        length() {
            return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w);
        }

        /**
        *求四维向量长度的平方。
        *@return 长度的平方。
        */
        lengthSquared() {
            return this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w;
        }

        /**
        *设置X轴坐标。
        *@param value X轴坐标。
        */
        /**
        *获取X轴坐标。
        *@return X轴坐标。
        */
        get x() {
            return this.elements[0];
        }
        set x(value) {
            this.elements[0] = value;
        }
        /**
        *设置Y轴坐标。
        *@param value Y轴坐标。
        */
        /**
        *获取Y轴坐标。
        *@return Y轴坐标。
        */
        get y() {
            return this.elements[1];
        }
        set y(value) {
            this.elements[1] = value;
        }
        /**
        *设置Z轴坐标。
        *@param value Z轴坐标。
        */
        /**
        *获取Z轴坐标。
        *@return Z轴坐标。
        */
        get z() {
            return this.elements[2];
        }
        set z(value) {
            this.elements[2] = value;
        }
        /**
        *设置W轴坐标。
        *@param value W轴坐标。
        */
        /**
        *获取W轴坐标。
        *@return W轴坐标。
        */
        get w() {
            return this.elements[3];
        }
        set w(value) {
            this.elements[3] = value;
        }
        static lerp(a, b, t, out) {
            var e = out.elements;
            var f = a.elements;
            var g = b.elements;
            var ax = f[0], ay = f[1], az = f[2], aw = f[3];
            e[0] = ax + t * (g[0] - ax);
            e[1] = ay + t * (g[1] - ay);
            e[2] = az + t * (g[2] - az);
            e[3] = aw + t * (g[3] - aw);
        }

        static transformByM4x4(vector4, m4x4, out) {
            var ve = vector4.elements;
            var vx = ve[0];
            var vy = ve[1];
            var vz = ve[2];
            var vw = ve[3];
            var me = m4x4.elements;
            var oe = out.elements;
            oe[0] = vx * me[0] + vy * me[4] + vz * me[8] + vw * me[12];
            oe[1] = vx * me[1] + vy * me[5] + vz * me[9] + vw * me[13];
            oe[2] = vx * me[2] + vy * me[6] + vz * me[10] + vw * me[14];
            oe[3] = vx * me[3] + vy * me[7] + vz * me[11] + vw * me[15];
        }

        static equals(a, b) {
            var ae = a.elements;
            var be = b.elements;
            return MathUtils3D.nearEqual(Math.abs(ae[0]), Math.abs(be[0])) && MathUtils3D.nearEqual(Math.abs(ae[1]), Math.abs(be[1])) && MathUtils3D.nearEqual(Math.abs(ae[2]), Math.abs(be[2])) && MathUtils3D.nearEqual(Math.abs(ae[3]), Math.abs(be[3]));
        }

        static normalize(s, out) {
            var se = s.elements;
            var oe = out.elements;
            var len =/*if err,please use iflash.method.xmlLength()*/s.length();
            if (len > 0) {
                oe[0] = se[0] * len;
                oe[1] = se[1] * len;
                oe[2] = se[2] * len;
                oe[3] = se[3] * len;
            }
        }

        static add(a, b, out) {
            var oe = out.elements;
            var ae = a.elements;
            var be = b.elements;
            oe[0] = ae[0] + be[0];
            oe[1] = ae[1] + be[1];
            oe[2] = ae[2] + be[2];
            oe[3] = ae[3] + be[3];
        }

        static subtract(a, b, out) {
            var oe = out.elements;
            var ae = a.elements;
            var be = b.elements;
            oe[0] = ae[0] - be[0];
            oe[1] = ae[1] - be[1];
            oe[2] = ae[2] - be[2];
            oe[3] = ae[3] - be[3];
        }

        static multiply(a, b, out) {
            var oe = out.elements;
            var ae = a.elements;
            var be = b.elements;
            oe[0] = ae[0] * be[0];
            oe[1] = ae[1] * be[1];
            oe[2] = ae[2] * be[2];
            oe[3] = ae[3] * be[3];
        }

        static scale(a, b, out) {
            var oe = out.elements;
            var ae = a.elements;
            oe[0] = ae[0] * b;
            oe[1] = ae[1] * b;
            oe[2] = ae[2] * b;
            oe[3] = ae[3] * b;
        }

        static Clamp(value, min, max, out) {
            var valuee = value.elements;
            var x = valuee[0];
            var y = valuee[1];
            var z = valuee[2];
            var w = valuee[3];
            var mine = min.elements;
            var mineX = mine[0];
            var mineY = mine[1];
            var mineZ = mine[2];
            var mineW = mine[3];
            var maxe = max.elements;
            var maxeX = maxe[0];
            var maxeY = maxe[1];
            var maxeZ = maxe[2];
            var maxeW = maxe[3];
            var oute = out.elements;
            x = (x > maxeX) ? maxeX : x;
            x = (x < mineX) ? mineX : x;
            y = (y > maxeY) ? maxeY : y;
            y = (y < mineY) ? mineY : y;
            z = (z > maxeZ) ? maxeZ : z;
            z = (z < mineZ) ? mineZ : z;
            w = (w > maxeW) ? maxeW : w;
            w = (w < mineW) ? mineW : w;
            oute[0] = x;
            oute[1] = y;
            oute[2] = z;
            oute[3] = w;
        }

        static distanceSquared(value1, value2) {
            var value1e = value1.elements;
            var value2e = value2.elements;
            var x = value1e[0] - value2e[0];
            var y = value1e[1] - value2e[1];
            var z = value1e[2] - value2e[2];
            var w = value1e[3] - value2e[3];
            return (x * x) + (y * y) + (z * z) + (w * w);
        }

        static distance(value1, value2) {
            var value1e = value1.elements;
            var value2e = value2.elements;
            var x = value1e[0] - value2e[0];
            var y = value1e[1] - value2e[1];
            var z = value1e[2] - value2e[2];
            var w = value1e[3] - value2e[3];
            return Math.sqrt((x * x) + (y * y) + (z * z) + (w * w));
        }

        static dot(a, b) {
            var ae = a.elements;
            var be = b.elements;
            var r = (ae[0] * be[0]) + (ae[1] * be[1]) + (ae[2] * be[2]) + (ae[3] * be[3]);
            return r;
        }

        static min(a, b, out) {
            var e = out.elements;
            var f = a.elements;
            var g = b.elements
            e[0] = Math.min(f[0], g[0]);
            e[1] = Math.min(f[1], g[1]);
            e[2] = Math.min(f[2], g[2]);
            e[3] = Math.min(f[3], g[3]);
        }

        static max(a, b, out) {
            var e = out.elements;
            var f = a.elements;
            var g = b.elements
            e[0] = Math.max(f[0], g[0]);
            e[1] = Math.max(f[1], g[1]);
            e[2] = Math.max(f[2], g[2]);
            e[3] = Math.max(f[3], g[3]);
        }

        //------------vector3 start--------------
        static cross(a, b, o) {
            var ae = a.elements;
            var be = b.elements;
            var oe = o.elements;
            var ax = ae[0], ay = ae[1], az = ae[2], bx = be[0], by = be[1], bz = be[2];
            oe[0] = ay * bz - az * by;
            oe[1] = az * bx - ax * bz;
            oe[2] = ax * by - ay * bx;
        }
        static transformQuat(source, rotation, out) {
            var destination = out.elements;
            var se = source.elements;
            var re = rotation.elements;
            var x = se[0], y = se[1], z = se[2], qx = re[0], qy = re[1], qz = re[2], qw = re[3],
                ix = qw * x + qy * z - qz * y, iy = qw * y + qz * x - qx * z, iz = qw * z + qx * y - qy * x, iw = -qx * x - qy * y - qz * z;
            destination[0] = ix * qw + iw * -qx + iy * -qz - iz * -qy;
            destination[1] = iy * qw + iw * -qy + iz * -qx - ix * -qz;
            destination[2] = iz * qw + iw * -qz + ix * -qy - iy * -qx;
        }
        static transformCoordinate(coordinate, transform, result) {
            var vectorElem = Vector3D._tempVector4.elements;
            var coordinateElem = coordinate.elements;
            var coordinateX = coordinateElem[0];
            var coordinateY = coordinateElem[1];
            var coordinateZ = coordinateElem[2];
            var transformElem = transform.elements;
            vectorElem[0] = (coordinateX * transformElem[0]) + (coordinateY * transformElem[4]) + (coordinateZ * transformElem[8]) + transformElem[12];
            vectorElem[1] = (coordinateX * transformElem[1]) + (coordinateY * transformElem[5]) + (coordinateZ * transformElem[9]) + transformElem[13];
            vectorElem[2] = (coordinateX * transformElem[2]) + (coordinateY * transformElem[6]) + (coordinateZ * transformElem[10]) + transformElem[14];
            vectorElem[3] = 1.0 / ((coordinateX * transformElem[3]) + (coordinateY * transformElem[7]) + (coordinateZ * transformElem[11]) + transformElem[15]);
            var resultElem = result.elements;
            resultElem[0] = vectorElem[0] * vectorElem[3];
            resultElem[1] = vectorElem[1] * vectorElem[3];
            resultElem[2] = vectorElem[2] * vectorElem[3];
        }
        static ForwardRH = new Vector3D(0, 0, -1);
        static Up = new Vector3D(0, 1, 0);
        static _tempVector4 = new Vector3D();
        //------------vector3 end--------------

        static ZERO = new Vector3D();
        static ONE = new Vector3D(1.0, 1.0, 1.0, 1.0);
        static UnitX = new Vector3D(1.0, 0.0, 0.0, 0.0);
        static UnitY = new Vector3D(0.0, 1.0, 0.0, 0.0);
        static UnitZ = new Vector3D(0.0, 0.0, 1.0, 0.0);
        static UnitW = new Vector3D(0.0, 0.0, 0.0, 1.0)
    }
}