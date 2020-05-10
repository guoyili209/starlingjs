// =================================================================================================
//
//  Starling Framework
//  Copyright Gamua GmbH. All Rights Reserved.
//
//	This program is free software. You can redistribute and/or modify it
//	in accordance with the terms of the accompanying license agreement.
//
// =================================================================================================

module StarlingJS {

    export class Mesh extends DisplayObject {
        /** @private */  _style: MeshStyle;
        /** @private */  _vertexData: VertexData;
        /** @private */  _indexData: IndexData;
        /** @private */  _pixelSnapping: boolean;

        private static sDefaultStyle: any = MeshStyle;
        private static sDefaultStyleFactory: Function = null;

        /** Creates a new mesh with the given vertices and indices.
         *  If you don't pass a style, an instance of <code>MeshStyle</code> will be created
         *  for you. Note that the format of the vertex data will be matched to the
         *  given style right away. */
        constructor(vertexData: VertexData, indexData: IndexData, style: MeshStyle = null) {
            super();
            if (vertexData == null) throw new Error("VertexData must not be null");
            if (indexData == null) throw new Error("IndexData must not be null");

            this._vertexData = vertexData;
            this._indexData = indexData;

            this.setStyle(style, false);
        }

        /** @inheritDoc */
        dispose(): void {
            this._vertexData.clear();
            this._indexData.clear();

            super.dispose();
        }

        /** @inheritDoc */
        hitTest(localPoint: Point): DisplayObject {
            if (!this.visible || !this.touchable || !this.hitTestMask(localPoint)) return null;
            else return MeshUtil.containsPoint(this._vertexData, this._indexData, localPoint) ? this : null;
        }

        /** @inheritDoc */
        getBounds(targetSpace: DisplayObject, out: Rectangle = null): Rectangle {
            return MeshUtil.calculateBounds(this._vertexData, this, targetSpace, out);
        }

        /** @inheritDoc */
        render(painter: Painter): void {
            if (this._pixelSnapping)
                MatrixUtil.snapToPixels(painter.state.modelviewMatrix, painter.pixelSize);

            painter.batchMesh(this);
        }

        /** Sets the style that is used to render the mesh. Styles (which are always subclasses of
         *  <code>MeshStyle</code>) provide a means to completely modify the way a mesh is rendered.
         *  For example, they may add support for color transformations or normal mapping.
         *
         *  <p>When assigning a new style, the vertex format will be changed to fit it.
         *  Do not use the same style instance on multiple objects! Instead, make use of
         *  <code>style.clone()</code> to assign an identical style to multiple meshes.</p>
         *
         *  @param meshStyle             the style to assign. If <code>null</code>, the default
         *                               style will be created.
         *  @param mergeWithPredecessor  if enabled, all attributes of the previous style will be
         *                               be copied to the new one, if possible.
         *  @see #defaultStyle
         *  @see #defaultStyleFactory
         */
        setStyle(meshStyle: MeshStyle = null, mergeWithPredecessor: boolean = true): void {
            if (meshStyle == null) meshStyle = this.createDefaultStyle(this);
            else if (meshStyle == this._style) return;
            else if (meshStyle.target) meshStyle.target.setStyle();

            if (this._style) {
                if (mergeWithPredecessor) meshStyle.copyFrom(this._style);
                this._style.setTarget();
            }

            this._style = meshStyle;
            this._style.setTarget(this, this._vertexData, this._indexData);

            this.setRequiresRedraw();
        }

        /** Creates a new instance of the current default MeshStyle. Internally, this method
         *  calls either the <code>defaultStyleFactory</code> or (if no factory has been assigned)
         *  instantiates <code>defaultStyle</code>.
         */
        static createDefaultStyle(instance: Mesh = null): MeshStyle {
            var meshStyle: MeshStyle;

            if (Mesh.sDefaultStyleFactory != null) {
                if (Mesh.sDefaultStyleFactory.length == 0) meshStyle = Mesh.sDefaultStyleFactory();
                else meshStyle = Mesh.sDefaultStyleFactory(instance);
            }

            if (meshStyle == null)
                meshStyle = new Mesh.sDefaultStyle() as MeshStyle;

            return meshStyle;
        }

        /** This method is called whenever the mesh's vertex data was changed.
         *  The base implementation simply forwards to <code>setRequiresRedraw</code>. */
        setVertexDataChanged() {
            this.setRequiresRedraw();
        }

        /** This method is called whenever the mesh's index data was changed.
         *  The base implementation simply forwards to <code>setRequiresRedraw</code>. */
        setIndexDataChanged(): void {
            this.setRequiresRedraw();
        }

        // vertex manipulation

        /** The position of the vertex at the specified index, in the mesh's local coordinate
         *  system.
         *
         *  <p>Only modify the position of a vertex if you know exactly what you're doing, as
         *  some classes might not work correctly when their vertices are moved. E.g. the
         *  <code>Quad</code> class expects its vertices to spawn up a perfectly rectangular
         *  area; some of its optimized methods won't work correctly if that premise is no longer
         *  fulfilled or the original bounds change.</p>
         */
        getVertexPosition(vertexID: number, out: Point = null): Point {
            return this._style.getVertexPosition(vertexID, out);
        }

        setVertexPosition(vertexID: number, x: number, y: number): void {
            this._style.setVertexPosition(vertexID, x, y);
        }

        /** Returns the alpha value of the vertex at the specified index. */
        getVertexAlpha(vertexID: number): number {
            return this._style.getVertexAlpha(vertexID);
        }

        /** Sets the alpha value of the vertex at the specified index to a certain value. */
        setVertexAlpha(vertexID: number, alpha: number): void {
            this._style.setVertexAlpha(vertexID, alpha);
        }

        /** Returns the RGB color of the vertex at the specified index. */
        getVertexColor(vertexID: number): number {
            return this._style.getVertexColor(vertexID);
        }

        /** Sets the RGB color of the vertex at the specified index to a certain value. */
        setVertexColor(vertexID: number, color: number): void {
            this._style.setVertexColor(vertexID, color);
        }

        /** Returns the texture coordinates of the vertex at the specified index. */
        getTexCoords(vertexID: number, out: Point = null): Point {
            return this._style.getTexCoords(vertexID, out);
        }

        /** Sets the texture coordinates of the vertex at the specified index to the given values. */
        setTexCoords(vertexID: number, u: number, v: number): void {
            this._style.setTexCoords(vertexID, u, v);
        }

        // properties

        /** The vertex data describing all vertices of the mesh.
         *  Any change requires a call to <code>setRequiresRedraw</code>. */
        protected get vertexData(): VertexData { return this._vertexData; }

        /** The index data describing how the vertices are interconnected.
         *  Any change requires a call to <code>setRequiresRedraw</code>. */
        protected get indexData(): IndexData { return this._indexData; }

        /** The style that is used to render the mesh. Styles (which are always subclasses of
         *  <code>MeshStyle</code>) provide a means to completely modify the way a mesh is rendered.
         *  For example, they may add support for color transformations or normal mapping.
         *  Beware: a style instance may only be used on one mesh at a time.
         *
         *  @default MeshStyle
         *  @see #setStyle()
         */
        get style(): MeshStyle { return this._style; }
        set style(value: MeshStyle) {
            this.setStyle(value);
        }

        /** The texture that is mapped to the mesh (or <code>null</code>, if there is none). */
        get texture(): Texture { return this._style.texture; }
        set texture(value: Texture) { this._style.texture = value; }

        /** Changes the color of all vertices to the same value.
         *  The getter simply returns the color of the first vertex. */
        get color(): number { return this._style.color; }
        set color(value: number) { this._style.color = value; }

        /** The smoothing filter that is used for the texture.
         *  @default bilinear */
        get textureSmoothing(): String { return this._style.textureSmoothing; }
        set textureSmoothing(value: String) { this._style.textureSmoothing = value; }

        /** Indicates if pixels at the edges will be repeated or clamped. Only works for
         *  power-of-two textures; for a solution that works with all kinds of textures,
         *  see <code>Image.tileGrid</code>. @default false */
        get textureRepeat(): boolean { return this._style.textureRepeat; }
        set textureRepeat(value: boolean) { this._style.textureRepeat = value; }

        /** Controls whether or not the instance snaps to the nearest pixel. This can prevent the
         *  object from looking blurry when it's not exactly aligned with the pixels of the screen.
         *  @default false */
        get pixelSnapping(): boolean { return this._pixelSnapping; }
        set pixelSnapping(value: boolean) { this._pixelSnapping = value; }

        /** The total number of vertices in the mesh. */
        get numVertices(): number { return this._vertexData.numVertices; }

        /** The total number of indices referencing vertices. */
        get numIndices(): number { return this._indexData.numIndices; }

        /** The total number of triangles in this mesh.
         *  (In other words: the number of indices divided by three.) */
        get numTriangles(): number { return this._indexData.numTriangles; }

        /** The format used to store the vertices. */
        get vertexFormat(): VertexDataFormat { return this._style.vertexFormat; }

        // static properties

        /** The default style used for meshes if no specific style is provided. The default is
         *  <code>starling.rendering.MeshStyle</code>, and any assigned class must be a subclass
         *  of the same. */
        static get defaultStyle(): any { return Mesh.sDefaultStyle; }
        static set defaultStyle(value: any) {
            Mesh.sDefaultStyle = value;
        }

        /** A factory method that is used to create the 'MeshStyle' for a mesh if no specific
         *  style is provided. That's useful if you are creating a hierarchy of objects, all
         *  of which need to have a certain style. Different to the <code>defaultStyle</code>
         *  property, this method allows plugging in custom logic and passing arguments to the
         *  constructor. Return <code>null</code> to fall back to the default behavior (i.e.
         *  to instantiate <code>defaultStyle</code>). The <code>mesh</code>-parameter is optional
         *  and may be omitted.
         *
         *  <listing>
         *  Mesh.defaultStyleFactory = (mesh:Mesh):MeshStyle
         *  {
         *      return new ColorizeMeshStyle(Math.random() * 0xffffff);
         *  }</listing>
         */
        static get defaultStyleFactory(): Function { return Mesh.sDefaultStyleFactory; }
        static set defaultStyleFactory(value: Function) {
            Mesh.sDefaultStyleFactory = value;
        }

        // static methods

        /** Creates a mesh from the specified polygon.
         *  Vertex positions and indices will be set up according to the polygon;
         *  any other vertex attributes (e.g. texture coordinates) need to be set up manually.
         */
        static fromPolygon(polygon: Polygon, style: MeshStyle = null): Mesh {
            var vertexData: VertexData = new VertexData(null, polygon.numVertices);
            var indexData: IndexData = new IndexData(polygon.numTriangles);

            polygon.copyToVertexData(vertexData);
            polygon.triangulate(indexData);

            return new Mesh(vertexData, indexData, style);
        }
    }
}
