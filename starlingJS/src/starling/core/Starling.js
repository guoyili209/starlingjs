import Rectangle from '../geom/Rectangle';
class Starling{
    constructor(rootClass,viewPort,renderMode="auto",profile="auto"){
        var canvas = document.getElementById('starlingCanvas');
        viewPort=viewPort||new Rectangle(0,0,canvas.width,canvas.height);

        this._rootClass=rootClass;
        this._viewPort=viewPort;
        this._previousViewPort = new Rectangle();
    }

    static init(width, height) {
        let canvas = document.createElement("canvas");
        canvas.setAttribute("id",'starlingCanvas');
        canvas.setAttribute("width",width);
        canvas.setAttribute("height",height);
        document.body.appendChild(canvas);
    }
}
export default Starling;