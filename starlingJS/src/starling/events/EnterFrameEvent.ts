// =================================================================================================
//
//	Starling Framework
//	Copyright Gamua GmbH. All Rights Reserved.
//
//	This program is free software. You can redistribute and/or modify it
//	in accordance with the terms of the accompanying license agreement.
//
// =================================================================================================

module StarlingJS
{
    export class EnterFrameEvent extends Event
    {
        /** Event type for a display object that is entering a new frame. */
        public static readonly ENTER_FRAME:string = "enterFrame";
        
        /** Creates an enter frame event with the passed time. */
        constructor(type:string, passedTime:number, bubbles:boolean=false)
        {
            super(type, bubbles, passedTime);
        }
        
        /** The time that has passed since the last frame (in seconds). */
        get passedTime():number { return this.data as number; }
    }
}