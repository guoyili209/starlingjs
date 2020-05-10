
module StarlingJS
{
    export class MeshUtil
    {
        // helper objects
        private static sPoint3D:Vector3D = new Vector3D();
        private static sMatrix:Matrix = new Matrix();
        private static sMatrix3D:Matrix3D = new Matrix3D();

        /** @private */
        constructor() { throw new Error(); }

        /** Determines if a point is inside a mesh that is spawned up by the given
         *  vertex- and index-data. */
        static containsPoint(vertexData:VertexData, indexData:IndexData,
                                             point:Point):boolean
        {
            var i:number;
            var result:boolean = false;
            var numIndices:number = indexData.numIndices;
            var p0:Point = Pool.getPoint();
            var p1:Point = Pool.getPoint();
            var p2:Point = Pool.getPoint();

            for (i=0; i<numIndices; i+=3)
            {
                vertexData.getPoint(indexData.getIndex(i  ), "position", p0);
                vertexData.getPoint(indexData.getIndex(i+1), "position", p1);
                vertexData.getPoint(indexData.getIndex(i+2), "position", p2);

                if (MathUtil.isPointInTriangle(point, p0, p1, p2))
                {
                    result = true;
                    break;
                }
            }

            Pool.putPoint(p0);
            Pool.putPoint(p1);
            Pool.putPoint(p2);

            return result;
        }

        /** Calculates the bounds of the given vertices in the target coordinate system. */
        static calculateBounds(vertexData:VertexData,
                                               sourceSpace:DisplayObject,
                                               targetSpace:DisplayObject,
                                               out:Rectangle=null):Rectangle
        {
            if (out == null) out = new Rectangle();

            var stage:Stage = sourceSpace.stage;

            if (sourceSpace.is3D && stage)
            {
                stage.getCameraPosition(targetSpace, MeshUtil.sPoint3D);
                sourceSpace.getTransformationMatrix3D(targetSpace, MeshUtil.sMatrix3D);
                vertexData.getBoundsProjected("position", MeshUtil.sMatrix3D, MeshUtil.sPoint3D, 0, -1, out);
            }
            else
            {
                sourceSpace.getTransformationMatrix(targetSpace, MeshUtil.sMatrix);
                vertexData.getBounds("position", MeshUtil.sMatrix, 0, -1, out);
            }

            return out;
        }
    }
}
