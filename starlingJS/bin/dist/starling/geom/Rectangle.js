Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Rectangle = function () {
    function Rectangle() {
        var x = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
        var y = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
        var width = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
        var height = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;

        _classCallCheck(this, Rectangle);

        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    _createClass(Rectangle, [{
        key: "setTo",
        value: function setTo(x, y, width, height) {
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
            return this;
        }
    }, {
        key: "reset",
        value: function reset() {
            this.x = this.y = this.width = this.height = 0;
            return this;
        }
    }, {
        key: "recover",
        value: function recover() {
            if (this == Rectangle.TEMP || this == Rectangle.EMPTY) {
                console.log("recover Temp or Empty:", this);
                return;
            }
            Pool.recover("Rectangle", this.reset());
        }
    }, {
        key: "copyFrom",
        value: function copyFrom(source) {
            this.x = source.x;
            this.y = source.y;
            this.width = source.width;
            this.height = source.height;
            return this;
        }
    }, {
        key: "contains",
        value: function contains(x, y) {
            if (this.width <= 0 || this.height <= 0) return false;
            if (x >= this.x && x < this.right) {
                if (y >= this.y && y < this.bottom) {
                    return true;
                }
            }
            return false;
        }
    }, {
        key: "intersects",
        value: function intersects(rect) {
            return !(rect.x > this.x + this.width || rect.x + rect.width < this.x || rect.y > this.y + this.height || rect.y + rect.height < this.y);
        }
    }, {
        key: "intersection",
        value: function intersection(rect) {
            var out = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

            if (!this.intersects(rect)) return null;
            if (!out) {
                out = new Rectangle();
            }
            out.x = Math.max(this.x, rect.x);
            out.y = Math.max(this.y, rect.y);
            out.width = Math.min(this.right, rect.right) - out.x;
            out.height = Math.min(this.bottom, rect.bottom) - out.y;
            return out;
        }
    }, {
        key: "union",
        value: function union(source) {
            var out = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

            if (!out) {
                out = new Rectangle();
            }
            this.clone(out);
            if (source.width <= 0 || source.height <= 0) return out;
            out.addPoint(source.x, source.y);
            out.addPoint(source.right, source.bottom);
            return this;
        }
    }, {
        key: "clone",
        value: function clone() {
            var out = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

            if (!out) {
                out = new Rectangle();
            }
            out.x = this.x;
            out.y = this.y;
            out.width = this.width;
            out.height = this.height;
            return out;
        }
    }, {
        key: "toString",
        value: function toString() {
            return this.x + "," + this.y + "," + this.width + "," + this.height;
        }
    }, {
        key: "equals",
        value: function equals(rect) {
            if (!rect || rect.x !== this.x || rect.y !== this.y || rect.width !== this.width || rect.height !== this.height) return false;
            return true;
        }
    }, {
        key: "addPoint",
        value: function addPoint(x, y) {
            this.x > x && (this.width += this.x - x, this.x = x);
            this.y > y && (this.height += this.y - y, this.y = y);
            if (this.width < x - this.x) this.width = x - this.x;
            if (this.height < y - this.y) this.height = y - this.y;
            return this;
        }
    }, {
        key: "_getBoundPoints",
        value: function _getBoundPoints() {
            var rst = Rectangle._temB;
            rst.length = 0;
            if (this.width == 0 || this.height == 0) return rst;
            rst.push(this.x, this.y, this.x + this.width, this.y, this.x, this.y + this.height, this.x + this.width, this.y + this.height);
            return rst;
        }
    }, {
        key: "isEmpty",
        value: function isEmpty() {
            if (this.width <= 0 || this.height <= 0) return true;
            return false;
        }
    }, {
        key: "right",
        get: function get() {
            return this.x + this.width;
        }
    }, {
        key: "bottom",
        get: function get() {
            return this.y + this.height;
        }
    }], [{
        key: "create",
        value: function create() {
            return Pool.getItemByClass("Rectangle", Rectangle);
        }
    }, {
        key: "_getBoundPointS",
        value: function _getBoundPointS(x, y, width, height) {
            var rst = Rectangle._temA;
            rst.length = 0;
            if (width == 0 || height == 0) return rst;
            rst.push(x, y, x + width, y, x, y + height, x + width, y + height);
            return rst;
        }
    }, {
        key: "_getWrapRec",
        value: function _getWrapRec(pointList) {
            var rst = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

            if (!pointList || pointList.length < 1) return rst ? rst.setTo(0, 0, 0, 0) : Rectangle.TEMP.setTo(0, 0, 0, 0);
            rst = rst ? rst : Rectangle.create();
            var i,
                len = pointList.length,
                minX,
                maxX,
                minY,
                maxY,
                tPoint = Point.TEMP;
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
        }
    }]);

    return Rectangle;
}();

Rectangle.EMPTY = new Rectangle();
Rectangle.TEMP = new Rectangle();
Rectangle._temB = [];
Rectangle._temA = [];

exports.default = Rectangle;