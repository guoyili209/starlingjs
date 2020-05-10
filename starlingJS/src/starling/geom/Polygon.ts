// =================================================================================================
//
//	Starling Framework
//	Copyright Gamua GmbH. All Rights Reserved.
//
//	This program is free software. You can redistribute and/or modify it
//	in accordance with the terms of the accompanying license agreement.
//
// =================================================================================================

module StarlingJS {
    export class Polygon {
        private _coords: Array<number>;

        // Helper object
        private static sRestIndices: Array<number> = new Array<number>();

        /** Creates a Polygon with the given coordinates.
         *  @param vertices an array that contains either 'Point' instances or
         *                  alternating 'x' and 'y' coordinates.
         */
        constructor(vertices: Array<any> = null) {
            this._coords = new Array<number>();
            this.addVertices.apply(this, vertices);
        }

        /** Creates a clone of this polygon. */
        clone(): Polygon {
            var clone: Polygon = new Polygon();
            var numCoords: number = this._coords.length;

            for (var i: number = 0; i < numCoords; ++i)
                clone._coords[i] = this._coords[i];

            return clone;
        }

        /** Reverses the order of the vertices. Note that some methods of the Polygon class
         *  require the vertices in clockwise order. */
        reverse(): void {
            var numCoords: number = this._coords.length;
            var numVertices: number = numCoords / 2;
            var tmp: number;

            for (var i: number = 0; i < numVertices; i += 2) {
                tmp = this._coords[i];
                this._coords[i] = this._coords[numCoords - i - 2];
                this._coords[numCoords - i - 2] = tmp;

                tmp = this._coords[i + 1];
                this._coords[i + 1] = this._coords[numCoords - i - 1];
                this._coords[numCoords - i - 1] = tmp;
            }
        }

        /** Adds vertices to the polygon. Pass either a list of 'Point' instances or alternating
         *  'x' and 'y' coordinates. */
        addVertices(...args): void {
            var i: number;
            var numArgs: number = args.length;
            var numCoords: number = this._coords.length;

            if (numArgs > 0) {
                if (args[0] instanceof Point) {
                    for (i = 0; i < numArgs; i++) {
                        this._coords[numCoords + i * 2] = (args[i] as Point).x;
                        this._coords[numCoords + i * 2 + 1] = (args[i] as Point).y;
                    }
                }
                else if (typeof args[0] == "number") {
                    for (i = 0; i < numArgs; ++i)
                        this._coords[numCoords + i] = args[i];
                }
                else throw new Error("Invalid type: getQualifiedClassName" + (args[0]));
            }
        }

        /** Moves a given vertex to a certain position or adds a new vertex at the end. */
        setVertex(index: number, x: number, y: number): void {
            if (index >= 0 && index <= this.numVertices) {
                this._coords[index * 2] = x;
                this._coords[index * 2 + 1] = y;
            }
            else throw new RangeError("Invalid index: " + index);
        }

        /** Returns the coordinates of a certain vertex. */
        getVertex(index: number, out: Point = null): Point {
            if (index >= 0 && index < this.numVertices) {
                out = out || new Point();
                out.setTo(this._coords[index * 2], this._coords[index * 2 + 1]);
                return out;
            }
            else throw new RangeError("Invalid index: " + index);
        }

        /** Figures out if the given coordinates lie within the polygon. */
        contains(x: number, y: number): boolean {
            // Algorithm & implementation thankfully taken from:
            // -> http://alienryderflex.com/polygon/

            var i: number, j: number = this.numVertices - 1;
            var oddNodes: number = 0;

            for (i = 0; i < this.numVertices; ++i) {
                var ix: number = this._coords[i * 2];
                var iy: number = this._coords[i * 2 + 1];
                var jx: number = this._coords[j * 2];
                var jy: number = this._coords[j * 2 + 1];

                if ((iy < y && jy >= y || jy < y && iy >= y) && (ix <= x || jx <= x)) {
                    let b = ix + (y - iy) / (jy - iy) * (jx - ix) < x;
                    let bb = b ? 1 : 0;
                    oddNodes ^= bb;
                }
                j = i;
            }

            return oddNodes != 0;
        }

        /** Figures out if the given point lies within the polygon. */
        containsPoint(point: Point): boolean {
            return this.contains(point.x, point.y);
        }

        /** Calculates a possible representation of the polygon via triangles. The resulting
         *  IndexData instance will reference the polygon vertices as they are saved in this
         *  Polygon instance, optionally incremented by the given offset.
         *
         *  <p>If you pass an indexData object, the new indices will be appended to it.
         *  Otherwise, a new instance will be created.</p> */
        triangulate(indexData: IndexData = null, offset: number = 0): IndexData {
            // Algorithm "Ear clipping method" described here:
            // -> https://en.wikipedia.org/wiki/Polygon_triangulation
            //
            // Implementation inspired by:
            // -> http://polyk.ivank.net

            var numVertices: number = this.numVertices;
            var numTriangles: number = this.numTriangles;
            var i: number, restIndexPos: number, numRestIndices: number;

            if (indexData == null) indexData = new IndexData(numTriangles * 3);
            if (numTriangles == 0) return indexData;

            Polygon.sRestIndices.length = numVertices;
            for (i = 0; i < numVertices; ++i) Polygon.sRestIndices[i] = i;

            restIndexPos = 0;
            numRestIndices = numVertices;

            var a: Point = Pool.getPoint();
            var b: Point = Pool.getPoint();
            var c: Point = Pool.getPoint();
            var p: Point = Pool.getPoint();

            while (numRestIndices > 3) {
                // In each step, we look at 3 subsequent vertices. If those vertices spawn up
                // a triangle that is convex and does not contain any other vertices, it is an 'ear'.
                // We remove those ears until only one remains -> each ear is one of our wanted
                // triangles.

                var otherIndex: number;
                var earFound: boolean = false;
                var i0: number = Polygon.sRestIndices[restIndexPos % numRestIndices];
                var i1: number = Polygon.sRestIndices[(restIndexPos + 1) % numRestIndices];
                var i2: number = Polygon.sRestIndices[(restIndexPos + 2) % numRestIndices];

                a.setTo(this._coords[2 * i0], this._coords[2 * i0 + 1]);
                b.setTo(this._coords[2 * i1], this._coords[2 * i1 + 1]);
                c.setTo(this._coords[2 * i2], this._coords[2 * i2 + 1]);

                if (Polygon.isConvexTriangle(a.x, a.y, b.x, b.y, c.x, c.y)) {
                    earFound = true;
                    for (i = 3; i < numRestIndices; ++i) {
                        otherIndex = Polygon.sRestIndices[(restIndexPos + i) % numRestIndices];
                        p.setTo(this._coords[2 * otherIndex], this._coords[2 * otherIndex + 1]);

                        if (MathUtil.isPointInTriangle(p, a, b, c)) {
                            earFound = false;
                            break;
                        }
                    }
                }

                if (earFound) {
                    indexData.addTriangle(i0 + offset, i1 + offset, i2 + offset);
                    Polygon.sRestIndices.splice((restIndexPos + 1) % numRestIndices,1);

                    numRestIndices--;
                    restIndexPos = 0;
                }
                else {
                    restIndexPos++;
                    if (restIndexPos == numRestIndices) break; // no more ears
                }
            }

            Pool.putPoint(a);
            Pool.putPoint(b);
            Pool.putPoint(c);
            Pool.putPoint(p);

            indexData.addTriangle(Polygon.sRestIndices[0] + offset,
                Polygon.sRestIndices[1] + offset,
                Polygon.sRestIndices[2] + offset);
            return indexData;
        }

        /** Copies all vertices to a 'VertexData' instance, beginning at a certain target index. */
        copyToVertexData(target: VertexData = null, targetVertexID: number = 0,
            attrName: string = "position"): void {
            var numVertices: number = this.numVertices;
            var requiredTargetLength: number = targetVertexID + numVertices;

            if (target.numVertices < requiredTargetLength)
                target.numVertices = requiredTargetLength;

            for (var i: number = 0; i < numVertices; ++i)
                target.setPoint(targetVertexID + i, attrName, this._coords[i * 2], this._coords[i * 2 + 1]);
        }

        /** Creates a string that contains the values of all included points. */
        toString(): string {
            var result: string = "[Polygon";
            var numPoints: number = this.numVertices;

            if (numPoints > 0) result += "\n";

            for (var i: number = 0; i < numPoints; ++i) {
                result += "  [Vertex " + i + ": " +
                    "x=" + this._coords[i * 2].toFixed(1) + ", " +
                    "y=" + this._coords[i * 2 + 1].toFixed(1) + "]" +
                    (i == numPoints - 1 ? "\n" : ",\n");
            }

            return result + "]";
        }

        // factory methods

        /** Creates an ellipse with optimized implementations of triangulation, hitTest, etc. */
        static createEllipse(x: number, y: number, radiusX: number, radiusY: number, numSides: number = -1): Polygon {
            return new Ellipse(x, y, radiusX, radiusY, numSides);
        }

        /** Creates a circle with optimized implementations of triangulation, hitTest, etc. */
        static createCircle(x: number, y: number, radius: number, numSides: number = -1): Polygon {
            return new Ellipse(x, y, radius, radius, numSides);
        }

        /** Creates a rectangle with optimized implementations of triangulation, hitTest, etc. */
        static createRectangle(x: number, y: number,
            width: number, height: number): Polygon {
            return new Rectangle(x, y, width, height);
        }

        // helpers

        /** Calculates if the area of the triangle a->b->c is to on the right-hand side of a->b. */

        private static isConvexTriangle(ax: number, ay: number,
            bx: number, by: number,
            cx: number, cy: number): boolean {
            // dot product of [the normal of (a->b)] and (b->c) must be positive
            return (ay - by) * (cx - bx) + (bx - ax) * (cy - by) >= 0;
        }

        /** Finds out if the vector a->b intersects c->d. */
        private static areVectorsIntersecting(ax: number, ay: number, bx: number, by: number,
            cx: number, cy: number, dx: number, dy: number): boolean {
            if ((ax == bx && ay == by) || (cx == dx && cy == dy)) return false; // length = 0

            var abx: number = bx - ax;
            var aby: number = by - ay;
            var cdx: number = dx - cx;
            var cdy: number = dy - cy;
            var tDen: number = cdy * abx - cdx * aby;

            if (tDen == 0.0) return false; // parallel or identical

            var t: number = (aby * (cx - ax) - abx * (cy - ay)) / tDen;

            if (t < 0 || t > 1) return false; // outside c->d

            var s: number = aby ? (cy - ay + t * cdy) / aby :
                (cx - ax + t * cdx) / abx;

            return s >= 0.0 && s <= 1.0; // inside a->b
        }

        // properties

        /** Indicates if the polygon's line segments are not self-intersecting.
         *  Beware: this is a brute-force implementation with <code>O(n^2)</code>. */
        get isSimple(): boolean {
            var numCoords: number = this._coords.length;
            if (numCoords <= 6) return true;

            for (var i: number = 0; i < numCoords; i += 2) {
                var ax: number = this._coords[i];
                var ay: number = this._coords[i + 1];
                var bx: number = this._coords[(i + 2) % numCoords];
                var by: number = this._coords[(i + 3) % numCoords];
                var endJ: number = i + numCoords - 2;

                for (var j: number = i + 4; j < endJ; j += 2) {
                    var cx: number = this._coords[j % numCoords];
                    var cy: number = this._coords[(j + 1) % numCoords];
                    var dx: number = this._coords[(j + 2) % numCoords];
                    var dy: number = this._coords[(j + 3) % numCoords];

                    if (Polygon.areVectorsIntersecting(ax, ay, bx, by, cx, cy, dx, dy))
                        return false;
                }
            }

            return true;
        }

        /** Indicates if the polygon is convex. In a convex polygon, the vector between any two
         *  points inside the polygon lies inside it, as well. */
        get isConvex(): boolean {
            var numCoords: number = this._coords.length;

            if (numCoords < 6) return true;
            else {
                for (var i: number = 0; i < numCoords; i += 2) {
                    if (!Polygon.isConvexTriangle(this._coords[i], this._coords[i + 1],
                        this._coords[(i + 2) % numCoords], this._coords[(i + 3) % numCoords],
                        this._coords[(i + 4) % numCoords], this._coords[(i + 5) % numCoords])) {
                        return false;
                    }
                }
            }

            return true;
        }

        /** Calculates the total area of the polygon. */
        get area(): number {
            var area: number = 0;
            var numCoords: number = this._coords.length;

            if (numCoords >= 6) {
                for (var i: number = 0; i < numCoords; i += 2) {
                    area += this._coords[i] * this._coords[(i + 3) % numCoords];
                    area -= this._coords[i + 1] * this._coords[(i + 2) % numCoords];
                }
            }

            return area / 2.0;
        }

        /** Returns the total number of vertices spawning up the polygon. Assigning a value
         *  that's smaller than the current number of vertices will crop the path; a bigger
         *  value will fill up the path with zeros. */
        get numVertices(): number {
            return this._coords.length / 2;
        }

        set numVertices(value: number) {
            var oldLength: number = this.numVertices;
            this._coords.length = value * 2;

            if (oldLength < value) {
                for (var i: number = oldLength; i < value; ++i)
                    this._coords[i * 2] = this._coords[i * 2 + 1] = 0.0;
            }
        }

        /** Returns the number of triangles that will be required when triangulating the polygon. */
        get numTriangles(): number {
            var numVertices: number = this.numVertices;
            return numVertices >= 3 ? numVertices - 2 : 0;
        }
    }
    class ImmutablePolygon extends Polygon {
        private _frozen: boolean;

        constructor(vertices: Array<any>) {
            super(vertices);
            this._frozen = true;
        }

        addVertices(...args): void {
            if (this._frozen) throw this.getImmutableError();
            else super.addVertices.apply(this, args);
        }

        setVertex(index: number, x: number, y: number): void {
            if (this._frozen) throw this.getImmutableError();
            else super.setVertex(index, x, y);
        }

        reverse(): void {
            if (this._frozen) throw this.getImmutableError();
            else super.reverse();
        }

        set numVertices(value: number) {
            if (this._frozen) throw this.getImmutableError();
            else super.reverse();
        }

        private getImmutableError(): Error {
            var className: string = this.constructor.name;
            var msg: string = className + " cannot be modified. Call 'clone' to create a mutable copy.";
            return new Error(msg);
        }
    }

    class Ellipse extends ImmutablePolygon {
        private _x: number;
        private _y: number;
        private _radiusX: number;
        private _radiusY: number;

        constructor(x: number, y: number, radiusX: number, radiusY: number, numSides: number = -1) {     
            if (numSides < 0) numSides = Math.PI * (radiusX + radiusY) / 4.0;
            if (numSides < 6) numSides = 6;

            var vertices: Array<any> = [];
            var angleDelta: number = 2 * Math.PI / numSides;
            var angle: number = 0;

            for (var i: number = 0; i < numSides; ++i) {
                vertices[i * 2] = Math.cos(angle) * radiusX + x;
                vertices[i * 2 + 1] = Math.sin(angle) * radiusY + y;
                angle += angleDelta;
            }       
            super(vertices);
            this._x = x;
            this._y = y;
            this._radiusX = radiusX;
            this._radiusY = radiusY;
        }

        private getVertices(numSides: number): Array<any> {
            if (numSides < 0) numSides = Math.PI * (this._radiusX + this._radiusY) / 4.0;
            if (numSides < 6) numSides = 6;

            var vertices: Array<any> = [];
            var angleDelta: number = 2 * Math.PI / numSides;
            var angle: number = 0;

            for (var i: number = 0; i < numSides; ++i) {
                vertices[i * 2] = Math.cos(angle) * this._radiusX + this._x;
                vertices[i * 2 + 1] = Math.sin(angle) * this._radiusY + this._y;
                angle += angleDelta;
            }

            return vertices;
        }

        triangulate(indexData: IndexData = null, offset: number = 0): IndexData {
            if (indexData == null) indexData = new IndexData((this.numVertices - 2) * 3);

            var from: number = 1;
            var to: number = this.numVertices - 1;

            for (var i: number = from; i < to; ++i)
                indexData.addTriangle(offset, offset + i, offset + i + 1);

            return indexData;
        }

        contains(x: number, y: number): boolean {
            var vx: number = x - this._x;
            var vy: number = y - this._y;

            var a: number = vx / this._radiusX;
            var b: number = vy / this._radiusY;

            return a * a + b * b <= 1;
        }

        get area(): number {
            return Math.PI * this._radiusX * this._radiusY;
        }

        get isSimple(): boolean {
            return true;
        }

        get isConvex(): boolean {
            return true;
        }
    }

    class Rectangle extends ImmutablePolygon {
        private _x: number;
        private _y: number;
        private _width: number;
        private _height: number;

        constructor(x: number, y: number, width: number, height: number) {
            super([x, y, x + width, y, x + width, y + height, x, y + height]);
            this._x = x;
            this._y = y;
            this._width = width;
            this._height = height;
            
        }

        triangulate(indexData: IndexData = null, offset: number = 0): IndexData {
            if (indexData == null) indexData = new IndexData(6);

            indexData.addTriangle(offset, offset + 1, offset + 3);
            indexData.addTriangle(offset + 1, offset + 2, offset + 3);

            return indexData;
        }

        contains(x: number, y: number): boolean {
            return x >= this._x && x <= this._x + this._width &&
                y >= this._y && y <= this._y + this._height;
        }

        get area(): number {
            return this._width * this._height;
        }

        get isSimple(): boolean {
            return true;
        }

        get isConvex(): boolean {
            return true;
        }
    }

}
