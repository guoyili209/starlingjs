Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _Rectangle = require("../geom/Rectangle");

var _Rectangle2 = _interopRequireDefault(_Rectangle);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Starling = function () {
    function Starling(rootClass, viewPort) {
        var renderMode = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : "auto";
        var profile = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : "auto";

        _classCallCheck(this, Starling);

        var canvas = document.getElementById('starlingCanvas');
        viewPort = viewPort || new _Rectangle2.default(0, 0, canvas.width, canvas.height);

        this._rootClass = rootClass;
        this._viewPort = viewPort;
        this._previousViewPort = new _Rectangle2.default();
    }

    _createClass(Starling, null, [{
        key: "init",
        value: function init(width, height) {
            var canvas = document.createElement("canvas");
            canvas.setAttribute("id", 'starlingCanvas');
            canvas.setAttribute("width", width);
            canvas.setAttribute("height", height);
            document.body.appendChild(canvas);
        }
    }]);

    return Starling;
}();

exports.default = Starling;