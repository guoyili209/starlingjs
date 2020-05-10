///<reference path="stage3d.d.ts"/>
var test;
(function (test) {
    var textureTriangle;
    (function (textureTriangle) {
        var stage3d;
        var context3d;
        var bitmapdata;
        /**
         *  window.onload entry point
         */
        function main() {
            prepareImage(init);
        }
        textureTriangle.main = main;
        function prepareImage(p_callBack) {
            bitmapdata = new Image();
            bitmapdata.src = "bear256.jpg";
            bitmapdata.onload = function (ev) { return p_callBack(); };
        }
        function init() {
            var canvas = document.getElementById("my-canvas");
            stage3d = new stageJS.Stage3D(canvas);
            stage3d.addEventListener(stageJS.events.Event.CONTEXT3D_CREATE, onCreated);
            stage3d.requestContext3D();
        }
        function onCreated() {
            context3d = stage3d.context3D;
            context3d.configureBackBuffer(stage3d.stageWidth, stage3d.stageHeight, 2, true);
            //-----------------
            //init shader
            //-----------------
            var program = context3d.createProgram();
            program.upload("shader-vs", "shader-fs"); // shader are in html file
            context3d.setProgram(program);
            //-----------------
            //init buffers
            //-----------------
            var vertexBuffer = context3d.createVertexBuffer(3, 5);
            vertexBuffer.uploadFromVector([
                -1,
                1,
                0,
                0,
                0,
                1,
                1,
                0,
                1,
                0,
                0,
                -1,
                0,
                0.5,
                1
            ], 0, 3);
            /**
             *    v0(-1,1) ----------- v1(1,1)
             *              \       /
             *               \     /
             *                \   /
             *                 \ /
             *              v2(0,-1)
             *
             *
             *      uv  v0  (0,0)
             *          v1  (1,0)
             *          v2  (0.5 ,1)
             */
            context3d.setVertexBufferAt("va0", vertexBuffer, 0, stageJS.Context3DVertexBufferFormat.FLOAT_3);
            context3d.setVertexBufferAt("va1", vertexBuffer, 3, stageJS.Context3DVertexBufferFormat.FLOAT_2);
            var indexBuffer = context3d.createIndexBuffer(3);
            indexBuffer.uploadFromVector([
                0,
                1,
                2
            ], 0, 3);
            //--------------
            // init texture
            //--------------
            var texture = context3d.createTexture(bitmapdata.width, bitmapdata.height, stageJS.Context3DTextureFormat.BGRA, false);
            texture.uploadFromBitmapData(bitmapdata, 0);
            context3d.setTextureAt("fs0", texture);
            //--------------
            // draw it
            //---------------
            context3d.clear(1.0, 1.0, 1.0, 1.0);
            context3d.drawTriangles(indexBuffer);
            context3d.present();
        }
    })(textureTriangle = test.textureTriangle || (test.textureTriangle = {}));
})(test || (test = {}));
window.onload = test.textureTriangle.main;
