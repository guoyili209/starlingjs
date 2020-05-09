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
    /** A class describing a range of vertices and indices, thus referencing a subset of a Mesh. */
    export class MeshSubset {
        /** The ID of the first vertex. */
        vertexID: number;

        /** The total number of vertices. */
        numVertices: number;

        /** The ID of the first index. */
        indexID: number;

        /** The total number of indices. */
        numIndices: number;

        /** Creates a new MeshSubset. */
        constructor(vertexID: number = 0, numVertices: number = -1,
            indexID: number = 0, numIndices: number = -1) {
            this.setTo(vertexID, numVertices, indexID, numIndices);
        }

        /** Changes all properties at once.
         *  Call without any arguments to reference a complete mesh. */
        setTo(vertexID: number = 0, numVertices: number = -1,
            indexID: number = 0, numIndices: number = -1): void {
            this.vertexID = vertexID;
            this.numVertices = numVertices;
            this.indexID = indexID;
            this.numIndices = numIndices;
        }
    }
}
