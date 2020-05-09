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
    export class MeshBatch extends Mesh {
        /** The maximum number of vertices that fit numbero one MeshBatch. */
        public static readonly MAX_NUM_VERTICES: number = 65535;

        private _effect: MeshEffect;
        private _batchable: Boolean;
        private _vertexSyncRequired: Boolean;
        private _indexSyncRequired: Boolean;

        // helper object
        private static sFullMeshSubset: MeshSubset = new MeshSubset();

        /** Creates a new, empty MeshBatch instance. */
        constructor() {
            var vertexData: VertexData = new VertexData();
            var indexData: IndexData = new IndexData();

            super(vertexData, indexData);
        }

        /** @inheritDoc */
        override public function dispose(): void {
            if (_effect) _effect.dispose();
            super.dispose();
        }

        /** This method must be called whenever the mesh's vertex data was changed. Makes
         *  sure that the vertex buffer is synchronized before rendering, and forces a redraw. */
        override public function setVertexDataChanged(): void {
            _vertexSyncRequired = true;
            super.setVertexDataChanged();
        }

        /** This method must be called whenever the mesh's index data was changed. Makes
         *  sure that the index buffer is synchronized before rendering, and forces a redraw. */
        override public function setIndexDataChanged(): void {
            _indexSyncRequired = true;
            super.setIndexDataChanged();
        }

        private function setVertexAndIndexDataChanged(): void {
            _vertexSyncRequired = _indexSyncRequired = true;
        }

        private function syncVertexBuffer(): void {
            _effect.uploadVertexData(_vertexData);
            _vertexSyncRequired = false;
        }

        private function syncIndexBuffer(): void {
            _effect.uploadIndexData(_indexData);
            _indexSyncRequired = false;
        }

        /** Removes all geometry. */
        public function clear(): void {
            if (_parent) setRequiresRedraw();

            _vertexData.numVertices = 0;
            _indexData.numIndices = 0;
            _vertexSyncRequired = true;
            _indexSyncRequired = true;
        }

        /** Adds a mesh to the batch by appending its vertices and indices.
         *
         *  <p>Note that the first time you add a mesh to the batch, the batch will duplicate its
         *  MeshStyle. All subsequently added meshes will then be converted to that same style.</p>
         *
         *  @param mesh      the mesh to add to the batch.
         *  @param matrix    transform all vertex positions with a certain matrix. If this
         *                   parameter is omitted, <code>mesh.transformationMatrix</code>
         *                   will be used instead (except if the last parameter is enabled).
         *  @param alpha     will be multiplied with each vertex' alpha value.
         *  @param subset    the subset of the mesh you want to add, or <code>null</code> for
         *                   the complete mesh.
         *  @param ignoreTransformations   when enabled, the mesh's vertices will be added
         *                   without transforming them in any way (no matter the value of the
         *                   <code>matrix</code> parameter).
         */
        public function addMesh(mesh: Mesh, matrix: Matrix = null, alpha: Number = 1.0,
            subset: MeshSubset = null, ignoreTransformations: Boolean = false): void {
            addMeshAt(mesh, -1, -1, matrix, alpha, subset, ignoreTransformations);
        }

        /** Adds a mesh to the batch by copying its vertices and indices to the given positions.
         *  Beware that you need to check for yourself if those positions make sense; for example,
         *  you need to make sure that they are aligned within the 3-indices groups making up
         *  the mesh's triangles.
         *
         *  <p>It's easiest to only add objects with an identical setup, e.g. only quads.
         *  For the latter, indices are aligned in groups of 6 (one quad requires six indices),
         *  and the vertices in groups of 4 (one vertex for every corner).</p>
         *
         *  <p>Note that the first time you add a mesh to the batch, the batch will duplicate its
         *  MeshStyle. All subsequently added meshes will then be converted to that same style.</p>
         *
         *  @param mesh      the mesh to add to the batch.
         *  @param indexID   the position at which the mesh's indices should be added to the batch.
         *                   If negative, they will be added at the very end.
         *  @param vertexID  the position at which the mesh's vertices should be added to the batch.
         *                   If negative, they will be added at the very end.
         *  @param matrix    transform all vertex positions with a certain matrix. If this
         *                   parameter is omitted, <code>mesh.transformationMatrix</code>
         *                   will be used instead (except if the last parameter is enabled).
         *  @param alpha     will be multiplied with each vertex' alpha value.
         *  @param subset    the subset of the mesh you want to add, or <code>null</code> for
         *                   the complete mesh.
         *  @param ignoreTransformations   when enabled, the mesh's vertices will be added
         *                   without transforming them in any way (no matter the value of the
         *                   <code>matrix</code> parameter).
         */
        public function addMeshAt(mesh: Mesh, indexID: number = -1, vertexID: number = -1,
            matrix: Matrix = null, alpha: Number = 1.0,
            subset: MeshSubset = null, ignoreTransformations: Boolean = false): void {
            if (ignoreTransformations) matrix = null;
            else if (matrix == null) matrix = mesh.transformationMatrix;
            if (subset == null) subset = sFullMeshSubset;

            var oldNumVertices: number = _vertexData.numVertices;
            var targetVertexID: number = vertexID >= 0 ? vertexID : oldNumVertices;
            var targetIndexID: number = indexID >= 0 ? indexID : _indexData.numIndices;
            var meshStyle: MeshStyle = mesh._style;

            if (oldNumVertices == 0)
                setupFor(mesh);

            meshStyle.batchVertexData(_style, targetVertexID, matrix, subset.vertexID, subset.numVertices);
            meshStyle.batchIndexData(_style, targetIndexID, targetVertexID - subset.vertexID,
                subset.indexID, subset.numIndices);

            if (alpha != 1.0) _vertexData.scaleAlphas("color", alpha, targetVertexID, subset.numVertices);
            if (_parent) setRequiresRedraw();

            _indexSyncRequired = _vertexSyncRequired = true;
        }

        private function setupFor(mesh: Mesh): void {
            var meshStyle: MeshStyle = mesh._style;
            var meshStyleType: Class = meshStyle.type;

            if (_style.type != meshStyleType) {
                var newStyle: MeshStyle = new meshStyleType() as MeshStyle;
                newStyle.copyFrom(meshStyle);
                setStyle(newStyle, false);
            }
            else {
                _style.copyFrom(meshStyle);
            }
        }

        /** Indicates if the given mesh instance fits to the current state of the batch.
         *  Will always return <code>true</code> for the first added mesh; later calls
         *  will check if the style matches and if the maximum number of vertices is not
         *  exceeded.
         *
         *  @param mesh         the mesh to add to the batch.
         *  @param numVertices  if <code>-1</code>, <code>mesh.numVertices</code> will be used
         */
        public function canAddMesh(mesh: Mesh, numVertices: number = -1): Boolean {
            var currentNumVertices: number = _vertexData.numVertices;

            if (currentNumVertices == 0) return true;
            if (numVertices < 0) numVertices = mesh.numVertices;
            if (numVertices == 0) return true;
            if (numVertices + currentNumVertices > MAX_NUM_VERTICES) return false;

            return _style.canBatchWith(mesh._style);
        }

        /** If the <code>batchable</code> property is enabled, this method will add the batch
         *  to the panumberer's current batch. Otherwise, this will actually do the drawing. */
        override public function render(panumberer: Panumberer): void {
            if (_vertexData.numVertices == 0) return;
            if (_pixelSnapping) MatrixUtil.snapToPixels(
                panumberer.state.modelviewMatrix, panumberer.pixelSize);

            if (_batchable) {
                panumberer.batchMesh(this);
            }
            else {
                panumberer.finishMeshBatch();
                panumberer.drawCount += 1;
                panumberer.prepareToDraw();
                panumberer.excludeFromCache(this);

                if (_vertexSyncRequired) syncVertexBuffer();
                if (_indexSyncRequired) syncIndexBuffer();

                _style.updateEffect(_effect, panumberer.state);
                _effect.render(0, _indexData.numTriangles);
            }
        }

        /** @inheritDoc */
        override public function setStyle(meshStyle: MeshStyle = null,
            mergeWithPredecessor: Boolean = true): void {
            super.setStyle(meshStyle, mergeWithPredecessor);

            if (_effect)
                _effect.dispose();

            _effect = style.createEffect();
            _effect.onRestore = setVertexAndIndexDataChanged;

            setVertexAndIndexDataChanged(); // we've got a new set of buffers!
        }

        /** The total number of vertices in the mesh. If you change this to a smaller value,
         *  the surplus will be deleted. Make sure that no indices reference those deleted
         *  vertices! */
        public function set numVertices(value: number): void {
            if (_vertexData.numVertices != value) {
                _vertexData.numVertices = value;
                _vertexSyncRequired = true;
                setRequiresRedraw();
            }
        }

        /** The total number of indices in the mesh. If you change this to a smaller value,
         *  the surplus will be deleted. Always make sure that the number of indices
         *  is a multiple of three! */
        public function set numIndices(value: number): void {
            if (_indexData.numIndices != value) {
                _indexData.numIndices = value;
                _indexSyncRequired = true;
                setRequiresRedraw();
            }
        }

        /** Indicates if this object will be added to the panumberer's batch on rendering,
         *  or if it will draw itself right away.
         *
         *  <p>Only batchable meshes can profit from the render cache; but batching large meshes
         *  may take up a lot of CPU time. Activate this property only if the batch contains just
         *  a handful of vertices (say, 20 quads).</p>
         *
         *  @default false
         */
        public function get batchable(): Boolean { return _batchable; }
        public function set batchable(value: Boolean): void {
            if (_batchable != value) {
                _batchable = value;
                setRequiresRedraw();
            }
        }
    }
}
