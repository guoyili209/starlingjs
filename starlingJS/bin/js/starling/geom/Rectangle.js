"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Rectangle = /** @class */ (function () {
    function Rectangle(x, y, width, height) {
        if (x === void 0) { x = 0; }
        if (y === void 0) { y = 0; }
        if (width === void 0) { width = 0; }
        if (height === void 0) { height = 0; }
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }
    Object.defineProperty(Rectangle.prototype, "right", {
        get: function () {
            return this.x + this.width;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Rectangle.prototype, "bottom", {
        get: function () {
            return this.y + this.height;
        },
        enumerable: true,
        configurable: true
    });
    Rectangle.prototype.setTo = function (x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        return this;
    };
    Rectangle.prototype.reset = function () {
        this.x = this.y = this.width = this.height = 0;
        return this;
    };
    Rectangle.prototype.recover = function () {
        if (this == Rectangle.TEMP || this == Rectangle.EMPTY) {
            console.log("recover Temp or Empty:", this);
            return;
        }
        Pool.recover("Rectangle", this.reset());
    };
    Rectangle.create = function () {
        return Pool.getItemByClass("Rectangle", Rectangle);
    };
    Rectangle.prototype.copyFrom = function (source) {
        this.x = source.x;
        this.y = source.y;
        this.width = source.width;
        this.height = source.height;
        return this;
    };
    Rectangle.prototype.contains = function (x, y) {
        if (this.width <= 0 || this.height <= 0)
            return false;
        if (x >= this.x && x < this.right) {
            if (y >= this.y && y < this.bottom) {
                return true;
            }
        }
        return false;
    };
    Rectangle.prototype.intersects = function (rect) {
        return !(rect.x > (this.x + this.width) || (rect.x + rect.width) < this.x || rect.y > (this.y + this.height) || (rect.y + rect.height) < this.y);
    };
    Rectangle.prototype.intersection = function (rect, out) {
        if (out === void 0) { out = null; }
        if (!this.intersects(rect))
            return null;
        out || (out = new Rectangle());
        out.x = Math.max(this.x, rect.x);
        out.y = Math.max(this.y, rect.y);
        out.width = Math.min(this.right, rect.right) - out.x;
        out.height = Math.min(this.bottom, rect.bottom) - out.y;
        return out;
    };
    Rectangle.prototype.union = function (source, out) {
        if (out === void 0) { out = null; }
        if (!out) {
            out = new Rectangle();
        }
        this.clone(out);
        if (source.width <= 0 || source.height <= 0)
            return out;
        out.addPoint(source.x, source.y);
        out.addPoint(source.right, source.bottom);
        return this;
    };
    Rectangle.prototype.clone = function (out) {
        if (out === void 0) { out = null; }
        if (!out) {
            out = new Rectangle();
        }
        out.x = this.x;
        out.y = this.y;
        out.width = this.width;
        out.height = this.height;
        return out;
    };
    Rectangle.prototype.toString = function () {
        return this.x + "," + this.y + "," + this.width + "," + this.height;
    };
    Rectangle.prototype.equals = function (rect) {
        if (!rect || rect.x !== this.x || rect.y !== this.y || rect.width !== this.width || rect.height !== this.height)
            return false;
        return true;
    };
    Rectangle.prototype.addPoint = function (x, y) {
        this.x > x && (this.width += this.x - x, this.x = x);
        this.y > y && (this.height += this.y - y, this.y = y);
        if (this.width < x - this.x)
            this.width = x - this.x;
        if (this.height < y - this.y)
            this.height = y - this.y;
        return this;
    };
    Rectangle.prototype._getBoundPoints = function () {
        var rst = Rectangle._temB;
        rst.length = 0;
        if (this.width == 0 || this.height == 0)
            return rst;
        rst.push(this.x, this.y, this.x + this.width, this.y, this.x, this.y + this.height, this.x + this.width, this.y + this.height);
        return rst;
    };
    Rectangle._getBoundPointS = function (x, y, width, height) {
        var rst = Rectangle._temA;
        rst.length = 0;
        if (width == 0 || height == 0)
            return rst;
        rst.push(x, y, x + width, y, x, y + height, x + width, y + height);
        return rst;
    };
    Rectangle._getWrapRec = function (pointList, rst) {
        if (rst === void 0) { rst = null; }
        if (!pointList || pointList.length < 1)
            return rst ? rst.setTo(0, 0, 0, 0) : Rectangle.TEMP.setTo(0, 0, 0, 0);
        rst = rst ? rst : Rectangle.create();
        var i, len = pointList.length, minX, maxX, minY, maxY, tPoint = Point.TEMP;
        minX = minY = 99999;
        maxX = maxY = -minX;
        for (i = 0; i < len; i += 2) {
            tPoint.x = pointList[i];
            tPoint.y = pointList[i + 1];
            minX = minX < tPoint.x ? minX : tPoint.x;
            minY = minY < tPoint.y ? minY : tPoint.y;
            maxX = maxX > tPoint.x ? maxX : tPoint.x;
            maxY = maxY > tPoint.y ? maxY : tPoint.y;
        }
        return rst.setTo(minX, minY, maxX - minX, maxY - minY);
    };
    Rectangle.prototype.isEmpty = function () {
        if (this.width <= 0 || this.height <= 0)
            return true;
        return false;
    };
    return Rectangle;
}());
Rectangle.EMPTY = new Rectangle();
Rectangle.TEMP = new Rectangle();
Rectangle._temB = [];
Rectangle._temA = [];
exports.default = Rectangle;
