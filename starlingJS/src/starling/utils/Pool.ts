module StarlingJS {
    export class Pool {
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
    }
}