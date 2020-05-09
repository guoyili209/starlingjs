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
    export class BatchToken {
        /** The ID of the current MeshBatch. */
        batchID: number;

        /** The ID of the next vertex within the current MeshBatch. */
        vertexID: number;

        /** The ID of the next index within the current MeshBatch. */
        indexID: number;

        /** Creates a new BatchToken. */
        constructor(batchID: number = 0, vertexID: number = 0, indexID: number = 0) {
            this.setTo(batchID, vertexID, indexID);
        }

        /** Copies the properties from the given token to this instance. */
         copyFrom(token: BatchToken): void {
            this.batchID = token.batchID;
            this.vertexID = token.vertexID;
            this.indexID = token.indexID;
        }

        /** Changes all properties at once. */
         setTo(batchID: number = 0, vertexID: number = 0, indexID: number = 0): void {
            this.batchID = batchID;
            this.vertexID = vertexID;
            this.indexID = indexID;
        }

        /** Resets all properties to zero. */
         reset(): void {
            this.batchID = this.vertexID = this.indexID = 0;
        }

        /** Indicates if this token contains the same values as the given one. */
         equals(other: BatchToken): Boolean {
            return this.batchID == other.batchID && this.vertexID == other.vertexID && this.indexID == other.indexID;
        }

        /** Creates a String representation of this instance. */
         toString(): String {
            return StringUtil.format("[BatchToken batchID={0} vertexID={1} indexID={2}]",
                this.batchID, this.vertexID, this.indexID);
        }
    }
}
