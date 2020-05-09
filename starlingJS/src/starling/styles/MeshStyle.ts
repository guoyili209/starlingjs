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

    export class MeshStyle extends EventDispatcher {
        /** The vertex format expected by this style (the same as found in the MeshEffect-class). */
        public static readonly VERTEX_FORMAT: VertexDataFormat = MeshEffect.VERTEX_FORMAT;

        private _type: any;
        private _target: Mesh;
        private _texture: Texture;
        private _textureSmoothing: string;
        private _textureRepeat: boolean;
        private _textureRoot: ConcreteTexture; // just a reference to _texture.root
        private _vertexData: VertexData;       // just a reference to the target's vertex data
        private _indexData: IndexData;         // just a reference to the target's index data

        // helper objects
        private static sPoint: Point = new Point();

        /** Creates a new MeshStyle instance.
         *  Subclasses must provide a constructor that can be called without any arguments. */
        constructor() {
            super();
            this._textureSmoothing = TextureSmoothing.BILINEAR;
            this._type = Object(this).constructor as Class;
        }

        /** Copies all properties of the given style to the current instance (or a subset, if the
         *  classes don't match). Must be overridden by all subclasses!
         */
        copyFrom(meshStyle: MeshStyle): void {
            this._texture = meshStyle._texture;
            this._textureRoot = meshStyle._textureRoot;
            this._textureRepeat = meshStyle._textureRepeat;
            this._textureSmoothing = meshStyle._textureSmoothing;
        }

        /** Creates a clone of this instance. The method will work for subclasses automatically,
         *  no need to  it. */
        clone(): MeshStyle {
            var clone: MeshStyle = new this._type();
            clone.copyFrom(this);
            return clone;
        }

        /** Creates the effect that does the actual, low-level rendering.
         *  To be overridden by subclasses!
         */
        createEffect(): MeshEffect {
            return new MeshEffect();
        }

        /** Updates the settings of the given effect to match the current style.
         *  The given <code>effect</code> will always match the class returned by
         *  <code>createEffect</code>.
         *
         *  <p>To be overridden by subclasses!</p>
         */
        updateEffect(effect: MeshEffect, state: RenderState): void {
            effect.texture = this._texture;
            effect.textureRepeat = this._textureRepeat;
            effect.textureSmoothing = this._textureSmoothing;
            effect.mvpMatrix3D = state.mvpMatrix3D;
            effect.alpha = state.alpha;
            effect.tinted = this._vertexData.tinted;
        }

        /** Indicates if the current instance can be batched with the given style.
         *  To be overridden by subclasses if default behavior is not sufficient.
         *  The base implementation just checks if the styles are of the same type
         *  and if the textures are compatible.
         */
        canBatchWith(meshStyle: MeshStyle): boolean {
            // I'm comparing the 'root' texture, not the 'base' texture, because the former
            // reference stays the same even when 'base' is recreated after a context loss.

            if (this._type == meshStyle._type) {
                var newTexture: Texture = meshStyle._texture;

                if (this._texture == null && newTexture == null) return true;
                else if (this._texture && newTexture)
                    return this._textureRoot == meshStyle._textureRoot &&
                        this._textureSmoothing == meshStyle._textureSmoothing &&
                        this._textureRepeat == meshStyle._textureRepeat;
                else return false;
            }
            else return false;
        }

        /** Copies the vertex data of the style's current target to the target of another style.
         *  If you pass a matrix, all vertices will be transformed during the process.
         *
         *  <p>This method is used when batching meshes together for rendering. The parameter
         *  <code>targetStyle</code> will point to the style of a <code>MeshBatch</code> (a
         *  subclass of <code>Mesh</code>). Subclasses may  this method if they need
         *  to modify the vertex data in that process.</p>
         */
        batchVertexData(targetStyle: MeshStyle, targetVertexID: number = 0,
            matrix: Matrix, vertexID: number = 0, numVertices: number = -1): void {
            this._vertexData.copyTo(targetStyle._vertexData, targetVertexID, matrix, vertexID, numVertices);
        }

        /** Copies the index data of the style's current target to the target of another style.
         *  The given offset value will be added to all indices during the process.
         *
         *  <p>This method is used when batching meshes together for rendering. The parameter
         *  <code>targetStyle</code> will point to the style of a <code>MeshBatch</code> (a
         *  subclass of <code>Mesh</code>). Subclasses may  this method if they need
         *  to modify the index data in that process.</p>
         */
        batchIndexData(targetStyle: MeshStyle, targetIndexID: number = 0, offset: number = 0,
            indexID: number = 0, numIndices: number = -1): void {
            this._indexData.copyTo(targetStyle._indexData, targetIndexID, offset, indexID, numIndices);
        }

        /** Call this method if the target needs to be redrawn.
         *  The call is simply forwarded to the target mesh. */
        protected setRequiresRedraw(): void {
            if (this._target) this._target.setRequiresRedraw();
        }

        /** Call this method when the vertex data changed.
         *  The call is simply forwarded to the target mesh. */
        protected setVertexDataChanged(): void {
            if (this._target) this._target.setVertexDataChanged();
        }

        /** Call this method when the index data changed.
         *  The call is simply forwarded to the target mesh. */
        protected setIndexDataChanged(): void {
            if (this._target) this._target.setIndexDataChanged();
        }

        /** Called when assigning a target mesh. Override to plug in class-specific logic. */
        protected onTargetAssigned(target: Mesh): void { }

        // enter frame event

        addEventListener(type: string, listener: Function): void {
            if (type == Event.ENTER_FRAME && this._target)
                this._target.addEventListener(Event.ENTER_FRAME, this.onEnterFrame);

            super.addEventListener(this.type, listener);
        }

        removeEventListener(type: string, listener: Function): void {
            if (type == Event.ENTER_FRAME && this._target)
                this._target.removeEventListener(type, this.onEnterFrame);

            super.removeEventListener(type, listener);
        }

        private onEnterFrame(event: Event): void {
            this.dispatchEvent(event);
        }

        // internal methods

        /** @private */
        setTarget(target: Mesh, vertexData: VertexData,
            indexData: IndexData): void {
            if (this._target != target) {
                if (this._target) this._target.removeEventListener(Event.ENTER_FRAME, this.onEnterFrame);
                if (vertexData) vertexData.format = this.vertexFormat;

                this._target = target;
                this._vertexData = vertexData;
                this._indexData = indexData;

                if (target) {
                    if (this.hasEventListener(Event.ENTER_FRAME))
                        target.addEventListener(Event.ENTER_FRAME, this.onEnterFrame);

                    this.onTargetAssigned(target);
                }
            }
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
        getVertexPosition(vertexID: number, out: Point): Point {
            return this._vertexData.getPoint(vertexID, "position", out);
        }

        setVertexPosition(vertexID: number, x: number, y: number) {
            this._vertexData.setPoint(vertexID, "position", x, y);
            this.setVertexDataChanged();
        }

        /** Returns the alpha value of the vertex at the specified index. */
        getVertexAlpha(vertexID: number): number {
            return this._vertexData.getAlpha(vertexID);
        }

        /** Sets the alpha value of the vertex at the specified index to a certain value. */
        setVertexAlpha(vertexID: number, alpha: number): void {
            this._vertexData.setAlpha(vertexID, "color", alpha);
            this.setVertexDataChanged();
        }

        /** Returns the RGB color of the vertex at the specified index. */
        getVertexColor(vertexID: number): number {
            return this._vertexData.getColor(vertexID);
        }

        /** Sets the RGB color of the vertex at the specified index to a certain value. */
        setVertexColor(vertexID: number, color: number): void {
            this._vertexData.setColor(vertexID, "color", color);
            this.setVertexDataChanged();
        }

        /** Returns the texture coordinates of the vertex at the specified index. */
        getTexCoords(vertexID: number, out: Point): Point {
            if (this._texture) return this._texture.getTexCoords(this._vertexData, vertexID, "texCoords", out);
            else return this._vertexData.getPoint(vertexID, "texCoords", out);
        }

        /** Sets the texture coordinates of the vertex at the specified index to the given values. */
        setTexCoords(vertexID: number, u: number, v: number): void {
            if (this._texture) this._texture.setTexCoords(this._vertexData, vertexID, "texCoords", u, v);
            else this._vertexData.setPoint(vertexID, "texCoords", u, v);

            this.setVertexDataChanged();
        }

        // properties

        /** Returns a reference to the vertex data of the assigned target (or <code>null</code>
         *  if there is no target). Beware: the style itself does not own any vertices;
         *  it is limited to manipulating those of the target mesh. */
        protected get vertexData(): VertexData { return this._vertexData; }

        /** Returns a reference to the index data of the assigned target (or <code>null</code>
         *  if there is no target). Beware: the style itself does not own any indices;
         *  it is limited to manipulating those of the target mesh. */
        protected get indexData(): IndexData { return this._indexData; }

        /** The actual class of this style. */
        get type(): any { return this._type; }

        /** Changes the color of all vertices to the same value.
         *  The getter simply returns the color of the first vertex. */
        get color(): number {
            if (this._vertexData.numVertices > 0) return this._vertexData.getColor(0);
            else return 0x0;
        }

        set color(value: number) {
            var i: number;
            var numVertices: number = this._vertexData.numVertices;

            for (i = 0; i < numVertices; ++i)
                this._vertexData.setColor(i, "color", value);

            if (value == 0xffffff && this._vertexData.tinted)
                this._vertexData.updateTinted();

            this.setVertexDataChanged();
        }

        /** The format used to store the vertices. */
        get vertexFormat(): VertexDataFormat {
            return MeshStyle.VERTEX_FORMAT;
        }

        /** The texture that is mapped to the mesh (or <code>null</code>, if there is none). */
        get texture(): Texture { return this._texture; }
        set texture(value: Texture) {
            if (value != this._texture) {
                if (value) {
                    var i: number;
                    var numVertices: number = this._vertexData ? this._vertexData.numVertices : 0;

                    for (i = 0; i < numVertices; ++i) {
                        this.getTexCoords(i, MeshStyle.sPoint);
                        value.setTexCoords(this._vertexData, i, "texCoords", MeshStyle.sPoint.x, MeshStyle.sPoint.y);
                    }

                    this.setVertexDataChanged();
                }
                else this.setRequiresRedraw();

                this._texture = value;
                this._textureRoot = value ? value.root : null;
            }
        }

        /** The smoothing filter that is used for the texture. @default bilinear */
        get textureSmoothing(): string { return this._textureSmoothing; }
        set textureSmoothing(value: string) {
            if (value != this._textureSmoothing) {
                this._textureSmoothing = value;
                this.setRequiresRedraw();
            }
        }

        /** Indicates if pixels at the edges will be repeated or clamped.
         *  Only works for power-of-two textures. @default false */
        get textureRepeat(): boolean { return this._textureRepeat; }
        set textureRepeat(value: boolean) { this._textureRepeat = value; }

        /** The target the style is currently assigned to. */
        get target(): Mesh { return this._target; }
    }
}
