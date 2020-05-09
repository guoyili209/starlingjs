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
    export class Effect {
        /** The vertex format expected by <code>uploadVertexData</code>:
         *  <code>"position:float2"</code> */
        public static readonly VERTEX_FORMAT: VertexDataFormat =
            VertexDataFormat.fromstring("position:float2");

        private _vertexBuffer: VertexBuffer3D;
        private _vertexBufferSize: number; // in bytes
        private _indexBuffer: IndexBuffer3D;
        private _indexBufferSize: number;  // in number of indices
        private _indexBufferUsesQuadLayout: boolean;

        private _mvpMatrix3D: Matrix3D;
        private _onRestore: Function;
        private _programBaseName: string;

        // helper objects
        private static sProgramNameCache: Dictionary = new Dictionary();

        /** Creates a new effect. */
        constructor() {
            this._mvpMatrix3D = new Matrix3D();
            _programBaseName = getQualifiedClassName(this);

            // Handle lost context (using conventional Flash event for weak listener support)
            Starling.current.stage3D.addEventListener(Event.CONTEXT3D_CREATE,
                onContextCreated, false, 20, true);
        }

        /** Purges the index- and vertex-buffers. */
        dispose(): void {
            Starling.current.stage3D.removeEventListener(Event.CONTEXT3D_CREATE, onContextCreated);
            purgeBuffers();
        }

        onContextCreated(event: Event): void {
            purgeBuffers();
            execute(_onRestore, this);
        }

        /** Purges one or both of the vertex- and index-buffers. */
        purgeBuffers(vertexBuffer: boolean = true, indexBuffer: boolean = true): void {
            // We wrap the dispose calls in a try/catch block to work around a stage3D problem.
            // Since they are not re-used later, that shouldn't have any evil side effects.

            if (_vertexBuffer && vertexBuffer) {
                try { _vertexBuffer.dispose(); } catch (e: Error) { }
                _vertexBuffer = null;
            }

            if (_indexBuffer && indexBuffer) {
                try { _indexBuffer.dispose(); } catch (e: Error) { }
                _indexBuffer = null;
            }
        }

        /** Uploads the given index data to the numberernal index buffer. If the buffer is too
         *  small, a new one is created automatically.
         *
         *  @param indexData   The IndexData instance to upload.
         *  @param bufferUsage The expected buffer usage. Use one of the constants defined in
         *                     <code>Context3DBufferUsage</code>. Only used when the method call
         *                     causes the creation of a new index buffer.
         */
        uploadIndexData(indexData: IndexData,
            bufferUsage: string = "staticDraw"): void {
            var numIndices: number = indexData.numIndices;
            var isQuadLayout: boolean = indexData.useQuadLayout;
            var wasQuadLayout: boolean = _indexBufferUsesQuadLayout;

            if (_indexBuffer) {
                if (numIndices <= _indexBufferSize) {
                    if (!isQuadLayout || !wasQuadLayout) {
                        indexData.uploadToIndexBuffer(_indexBuffer);
                        _indexBufferUsesQuadLayout = isQuadLayout && numIndices == _indexBufferSize;
                    }
                }
                else
                    purgeBuffers(false, true);
            }
            if (_indexBuffer == null) {
                _indexBuffer = indexData.createIndexBuffer(true, bufferUsage);
                _indexBufferSize = numIndices;
                _indexBufferUsesQuadLayout = isQuadLayout;
            }
        }

        /** Uploads the given vertex data to the numberernal vertex buffer. If the buffer is too
         *  small, a new one is created automatically.
         *
         *  @param vertexData  The VertexData instance to upload.
         *  @param bufferUsage The expected buffer usage. Use one of the constants defined in
         *                     <code>Context3DBufferUsage</code>. Only used when the method call
         *                     causes the creation of a new vertex buffer.
         */
        uploadVertexData(vertexData: VertexData,
            bufferUsage: string = "staticDraw"): void {
            if (_vertexBuffer) {
                if (vertexData.size <= _vertexBufferSize)
                    vertexData.uploadToVertexBuffer(_vertexBuffer);
                else
                    purgeBuffers(true, false);
            }
            if (_vertexBuffer == null) {
                _vertexBuffer = vertexData.createVertexBuffer(true, bufferUsage);
                _vertexBufferSize = vertexData.size;
            }
        }

        // rendering

        /** Draws the triangles described by the index- and vertex-buffers, or a range of them.
         *  This calls <code>beforeDraw</code>, <code>context.drawTriangles</code>, and
         *  <code>afterDraw</code>, in this order. */
        render(firstIndex: number = 0, numTriangles: number = -1): void {
            if (numTriangles < 0) numTriangles = _indexBufferSize / 3;
            if (numTriangles == 0) return;

            var context: Context3D = Starling.context;
            if (context == null) throw new MissingContextError();

            beforeDraw(context);
            context.drawTriangles(indexBuffer, firstIndex, numTriangles);
            afterDraw(context);
        }

        /** This method is called by <code>render</code>, directly before
         *  <code>context.drawTriangles</code>. It activates the program and sets up
         *  the context with the following constants and attributes:
         *
         *  <ul>
         *    <li><code>vc0-vc3</code> — MVP matrix</li>
         *    <li><code>va0</code> — vertex position (xy)</li>
         *  </ul>
         */
         beforeDraw(context: Context3D): void {
            program.activate(context);
            vertexFormat.setVertexBufferAt(0, vertexBuffer, "position");
            context.setProgramConstantsFromMatrix(Context3DProgramType.VERTEX, 0, mvpMatrix3D, true);
        }

        /** This method is called by <code>render</code>, directly after
         *  <code>context.drawTriangles</code>. Resets vertex buffer attributes.
         */
         afterDraw(context: Context3D): void {
            context.setVertexBufferAt(0, null);
        }

        // program management

        /** Creates the program (a combination of vertex- and fragment-shader) used to render
         *  the effect with the current settings. Override this method in a subclass to create
         *  your shaders. This method will only be called once; the program is automatically stored
         *  in the <code>Panumberer</code> and re-used by all instances of this effect.
         *
         *  <p>The basic implementation always outputs pure white.</p>
         */
         createProgram(): Program {
            var vertexShader: string = [
                "m44 op, va0, vc0", // 4x4 matrix transform to output clipspace
                "sge v0, va0, va0"  // this is a hack that always produces "1"
            ].join("\n");

            var fragmentShader: string =
                "mov oc, v0";       // output color: white

            return Program.fromSource(vertexShader, fragmentShader);
        }

        /** Override this method if the effect requires a different program depending on the
         *  current settings. Ideally, you do this by creating a bit mask encoding all the options.
         *  This method is called often, so do not allocate any temporary objects when overriding.
         *
         *  @default 0
         */
         get programVariantName(): number {
            return 0;
        }

        /** Returns the base name for the program.
         *  @default the fully qualified class name
         */
         get programBaseName(): string { return this._programBaseName; }
         set programBaseName(value: string) { this._programBaseName = value; }

        /** Returns the full name of the program, which is used to register it at the current
         *  <code>Panumberer</code>.
         *
         *  <p>The default implementation efficiently combines the program's base and variant
         *  names (e.g. <code>LightEffect#42</code>). It shouldn't be necessary to override
         *  this method.</p>
         */
         get programName(): string {
            var baseName: string = this.programBaseName;
            var variantName: number = this.programVariantName;
            var nameCache: Dictionary = Effect.sProgramNameCache[baseName];

            if (nameCache == null) {
                nameCache = new Dictionary();
                sProgramNameCache[baseName] = nameCache;
            }

            var name: string = nameCache[variantName];

            if (name == null) {
                if (variantName) name = baseName + "#" + variantName.tostring(16);
                else name = baseName;

                nameCache[variantName] = name;
            }

            return name;
        }

        /** Returns the current program, either by creating a new one (via
         *  <code>createProgram</code>) or by getting it from the <code>Panumberer</code>.
         *  Do not override this method! Instead, implement <code>createProgram</code>. */
         get program(): Program {
            var name: string = this.programName;
            var panumberer: Panumberer = Starling.panumberer;
            var program: Program = panumberer.getProgram(name);

            if (program == null) {
                program = createProgram();
                panumberer.registerProgram(name, program);
            }

            return program;
        }

        // properties

        /** The function that you provide here will be called after a context loss.
         *  Call both "upload..." methods from within the callback to restore any vertex or
         *  index buffers. The callback will be executed with the effect as its sole parameter. */
        get onRestore(): Function { return _onRestore; }
        set onRestore(value: Function): void { _onRestore = value; }

        /** The data format that this effect requires from the VertexData that it renders:
         *  <code>"position:float2"</code> */
        get vertexFormat(): VertexDataFormat { return VERTEX_FORMAT; }

        /** The MVP (modelview-projection) matrix transforms vertices numbero clipspace. */
        get mvpMatrix3D(): Matrix3D { return _mvpMatrix3D; }
        set mvpMatrix3D(value: Matrix3D): void { _mvpMatrix3D.copyFrom(value); }

        /** The numberernally used index buffer used on rendering. */
         get indexBuffer(): IndexBuffer3D { return _indexBuffer; }

        /** The current size of the index buffer (in number of indices). */
         get indexBufferSize(): number { return _indexBufferSize; }

        /** The numberernally used vertex buffer used on rendering. */
         get vertexBuffer(): VertexBuffer3D { return _vertexBuffer; }

        /** The current size of the vertex buffer (in blocks of 32 bits). */
         get vertexBufferSize(): number { return _vertexBufferSize; }
    }
}
