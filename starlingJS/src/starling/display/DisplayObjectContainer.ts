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

    export class DisplayObjectContainer extends DisplayObject {
        // members

        private _children: Array<DisplayObject>;
        private _touchGroup: boolean;

        // helper objects
        private static sHelperMatrix: Matrix = new Matrix();
        private static sHelperPoint: Point = new Point();
        private static sBroadcastListeners: Array<DisplayObject> = new Array<DisplayObject>();
        private static sSortBuffer: Array<DisplayObject> = new Array<DisplayObject>();
        private static sCacheToken: BatchToken = new BatchToken();

        // construction

        /** @private */
        constructor() {
            super();
            // if (Capabilities.isDebugger && 
            //     getQualifiedClassName(this) == "starling.display::DisplayObjectContainer")
            // {
            //     throw new AbstractClassError();
            // }

            this._children = new Array<DisplayObject>();
        }

        /** Disposes the resources of all children. */
        dispose(): void {
            for (var i: number = this._children.length - 1; i >= 0; --i)
                this._children[i].dispose();

            super.dispose();
        }

        // child management

        /** Adds a child to the container. It will be at the frontmost position. */
        addChild(child: DisplayObject): DisplayObject {
            return this.addChildAt(child, this._children.length);
        }

        /** Adds a child to the container at a certain index. */
        addChildAt(child: DisplayObject, index: number): DisplayObject {
            var numChildren: number = this._children.length;

            if (index >= 0 && index <= numChildren) {
                this.setRequiresRedraw();

                if (child.parent == this) {
                    this.setChildIndex(child, index); // avoids dispatching events
                }
                else {
                    this._children.insertAt(index, child);

                    child.removeFromParent();
                    child.setParent(this);
                    child.dispatchEventWith(Event.ADDED, true);

                    if (this.stage) {
                        var container: DisplayObjectContainer = child as DisplayObjectContainer;
                        if (container) container.broadcastEventWith(Event.ADDED_TO_STAGE);
                        else child.dispatchEventWith(Event.ADDED_TO_STAGE);
                    }
                }

                return child;
            }
            else {
                throw new RangeError("Invalid child index");
            }
        }

        /** Removes a child from the container. If the object is not a child, the method returns
         *  <code>null</code>. If requested, the child will be disposed right away. */
        removeChild(child: DisplayObject, dispose: boolean = false): DisplayObject {
            var childIndex: number = this.getChildIndex(child);
            if (childIndex != -1) return this.removeChildAt(childIndex, dispose);
            else return null;
        }

        /** Removes a child at a certain index. The index positions of any display objects above
         *  the child are decreased by 1. If requested, the child will be disposed right away. */
        removeChildAt(index: number, dispose: boolean = false): DisplayObject {
            if (index >= 0 && index < this._children.length) {
                this.setRequiresRedraw();

                var child: DisplayObject = this._children[index];
                child.dispatchEventWith(Event.REMOVED, true);

                if (this.stage) {
                    var container: DisplayObjectContainer = child as DisplayObjectContainer;
                    if (container) container.broadcastEventWith(Event.REMOVED_FROM_STAGE);
                    else child.dispatchEventWith(Event.REMOVED_FROM_STAGE);
                }

                child.setParent(null);
                index = this._children.indexOf(child); // index might have changed by event handler
                if (index >= 0) this._children.splice(index, 1);
                if (dispose) child.dispose();

                return child;
            }
            else {
                throw new RangeError("Invalid child index");
            }
        }

        /** Removes a range of children from the container (endIndex included). 
         *  If no arguments are given, all children will be removed. */
        removeChildren(beginIndex: number = 0, endIndex: number = -1, dispose: boolean = false): void {
            if (endIndex < 0 || endIndex >= this.numChildren)
                endIndex = this.numChildren - 1;

            for (var i: number = beginIndex; i <= endIndex; ++i)
                this.removeChildAt(beginIndex, dispose);
        }

        /** Returns a child object at a certain index. If you pass a negative index,
         *  '-1' will return the last child, '-2' the second to last child, etc. */
        getChildAt(index: number): DisplayObject {
            var numChildren: number = this._children.length;

            if (index < 0)
                index = numChildren + index;

            if (index >= 0 && index < numChildren)
                return this._children[index];
            else
                throw new RangeError("Invalid child index");
        }

        /** Returns a child object with a certain name (non-recursively). */
        getChildByName(name: string): DisplayObject {
            var numChildren: number = this._children.length;
            for (var i: number = 0; i < numChildren; ++i)
                if (this._children[i].name == name) return this._children[i];

            return null;
        }

        /** Returns the index of a child within the container, or "-1" if it is not found. */
        getChildIndex(child: DisplayObject): number {
            return this._children.indexOf(child);
        }

        /** Moves a child to a certain index. Children at and after the replaced position move up.*/
        setChildIndex(child: DisplayObject, index: number): void {
            var oldIndex: number = this.getChildIndex(child);
            if (oldIndex == index) return;
            if (oldIndex == -1) throw new Error("Not a child of this container");

            this._children.splice(oldIndex, 1);
            this._children.splice(index, 0, child);
            this.setRequiresRedraw();
        }

        /** Swaps the indexes of two children. */
        swapChildren(child1: DisplayObject, child2: DisplayObject): void {
            var index1: number = this.getChildIndex(child1);
            var index2: number = this.getChildIndex(child2);
            if (index1 == -1 || index2 == -1) throw new Error("Not a child of this container");
            this.swapChildrenAt(index1, index2);
        }

        /** Swaps the indexes of two children. */
        swapChildrenAt(index1: number, index2: number): void {
            var child1: DisplayObject = this.getChildAt(index1);
            var child2: DisplayObject = this.getChildAt(index2);
            this._children[index1] = child2;
            this._children[index2] = child1;
            this.setRequiresRedraw();
        }

        /** Sorts the children according to a given function (that works just like the sort function
         *  of the Vector class). */
        sortChildren(compareFunction: Function): void {
            DisplayObjectContainer.sSortBuffer.length = this._children.length;
            DisplayObjectContainer.mergeSort(this._children, compareFunction, 0, this._children.length, DisplayObjectContainer.sSortBuffer);
            DisplayObjectContainer.sSortBuffer.length = 0;
            this.setRequiresRedraw();
        }

        /** Determines if a certain object is a child of the container (recursively). */
        contains(child: DisplayObject): boolean {
            while (child) {
                if (child == this) return true;
                else child = child.parent;
            }
            return false;
        }

        // other methods

        /** @inheritDoc */
        getBounds(targetSpace: DisplayObject, out: Rectangle = null): Rectangle {
            if (out == null) out = new Rectangle();

            var numChildren: number = this._children.length;

            if (numChildren == 0) {
                this.getTransformationMatrix(targetSpace, DisplayObjectContainer.sHelperMatrix);
                MatrixUtil.transformCoords(DisplayObjectContainer.sHelperMatrix, 0.0, 0.0, DisplayObjectContainer.sHelperPoint);
                out.setTo(DisplayObjectContainer.sHelperPoint.x, DisplayObjectContainer.sHelperPoint.y, 0, 0);
            }
            else if (numChildren == 1) {
                this._children[0].getBounds(targetSpace, out);
            }
            else {
                var minX: number = number.MAX_VALUE, maxX: number = -number.MAX_VALUE;
                var minY: number = number.MAX_VALUE, maxY: number = -number.MAX_VALUE;

                for (var i: number = 0; i < numChildren; ++i) {
                    this._children[i].getBounds(targetSpace, out);

                    if (minX > out.x) minX = out.x;
                    if (maxX < out.right) maxX = out.right;
                    if (minY > out.y) minY = out.y;
                    if (maxY < out.bottom) maxY = out.bottom;
                }

                out.setTo(minX, minY, maxX - minX, maxY - minY);
            }

            return out;
        }

        /** @inheritDoc */
        hitTest(localPoint: Point): DisplayObject {
            if (!this.visible || !this.touchable || !this.hitTestMask(localPoint)) return null;

            var target: DisplayObject = null;
            var localX: number = localPoint.x;
            var localY: number = localPoint.y;
            var numChildren: number = this._children.length;

            for (var i: number = numChildren - 1; i >= 0; --i) // front to back!
            {
                var child: DisplayObject = this._children[i];
                if (child.isMask) continue;

                DisplayObjectContainer.sHelperMatrix.copyFrom(child.transformationMatrix);
                DisplayObjectContainer.sHelperMatrix.invert();

                MatrixUtil.transformCoords(DisplayObjectContainer.sHelperMatrix, localX, localY, DisplayObjectContainer.sHelperPoint);
                target = child.hitTest(DisplayObjectContainer.sHelperPoint);

                if (target) return this._touchGroup ? this : target;
            }

            return null;
        }

        /** @inheritDoc */
        render(painter: Painter): void {
            var numChildren: number = this._children.length;
            var frameID: number = painter.frameID;
            var cacheEnabled: boolean = frameID != 0;
            var selfOrParentChanged: boolean = this._lastParentOrSelfChangeFrameID == frameID;

            painter.pushState();

            for (var i: number = 0; i < numChildren; ++i) {
                var child: DisplayObject = this._children[i];

                if (child._hasVisibleArea) {
                    if (i != 0)
                        painter.restoreState();

                    if (selfOrParentChanged)
                        child._lastParentOrSelfChangeFrameID = frameID;

                    if (child._lastParentOrSelfChangeFrameID != frameID &&
                        child._lastChildChangeFrameID != frameID &&
                        child._tokenFrameID == frameID - 1 && cacheEnabled) {
                        painter.fillToken(sCacheToken);
                        painter.drawFromCache(child._pushToken, child._popToken);
                        painter.fillToken(child._popToken);

                        child._pushToken.copyFrom(sCacheToken);
                    }
                    else {
                        var pushToken: BatchToken = cacheEnabled ? child._pushToken : null;
                        var popToken: BatchToken = cacheEnabled ? child._popToken : null;
                        var filter: FragmentFilter = child._filter;
                        var mask: DisplayObject = child._mask;

                        painter.fillToken(pushToken);
                        painter.setStateTo(child.transformationMatrix, child.alpha, child.blendMode);

                        if (mask) painter.drawMask(mask, child);

                        if (filter) filter.render(painter);
                        else child.render(painter);

                        if (mask) painter.eraseMask(mask, child);

                        painter.fillToken(popToken);
                    }

                    if (cacheEnabled)
                        child._tokenFrameID = frameID;
                }
            }

            painter.popState();
        }

        /** Dispatches an event on all children (recursively). The event must not bubble. */
        broadcastEvent(event: Event): void {
            if (event.bubbles)
                throw new Error("Broadcast of bubbling events is prohibited");

            // The event listeners might modify the display tree, which could make the loop crash. 
            // Thus, we collect them in a list and iterate over that list instead.
            // And since another listener could call this method internally, we have to take 
            // care that the static helper vector does not get corrupted.

            var fromIndex: number = DisplayObjectContainer.sBroadcastListeners.length;
            getChildEventListeners(this, event.type, DisplayObjectContainer.sBroadcastListeners);
            var toIndex: number = DisplayObjectContainer.sBroadcastListeners.length;

            for (var i: number = fromIndex; i < toIndex; ++i)
                DisplayObjectContainer.sBroadcastListeners[i].dispatchEvent(event);

            DisplayObjectContainer.sBroadcastListeners.length = fromIndex;
        }

        /** Dispatches an event with the given parameters on all children (recursively). 
         *  The method uses an internal pool of event objects to avoid allocations. */
        broadcastEventWith(eventType: string, data: Object = null): void {
            var event: Event = Event.fromPool(eventType, false, data);
            this.broadcastEvent(event);
            Event.toPool(event);
        }

        /** The number of children of this container. */
        get numChildren(): number { return this._children.length; }

        /** If a container is a 'touchGroup', it will act as a single touchable object.
         *  Touch events will have the container as target, not the touched child.
         *  (Similar to 'mouseChildren' in the classic display list, but with inverted logic.)
         *  @default false */
        get touchGroup(): boolean { return this._touchGroup; }
        set touchGroup(value: boolean): void { this._touchGroup = value; }

        // helpers

        private static mergeSort(input: Array<DisplayObject>, compareFunc: Function,
            startIndex: number, length: number,
            buffer: Array<DisplayObject>): void {
            // This is a port of the C++ merge sort algorithm shown here:
            // http://www.cprogramming.com/tutorial/computersciencetheory/mergesort.html

            if (length > 1) {
                var i: number;
                var endIndex: number = startIndex + length;
                var halfLength: number = length / 2;
                var l: number = startIndex;              // current position in the left subvector
                var r: number = startIndex + halfLength; // current position in the right subvector

                // sort each subvector
                this.mergeSort(input, compareFunc, startIndex, halfLength, buffer);
                this.mergeSort(input, compareFunc, startIndex + halfLength, length - halfLength, buffer);

                // merge the vectors, using the buffer vector for temporary storage
                for (i = 0; i < length; i++) {
                    // Check to see if any elements remain in the left vector; 
                    // if so, we check if there are any elements left in the right vector;
                    // if so, we compare them. Otherwise, we know that the merge must
                    // take the element from the left vector. */
                    if (l < startIndex + halfLength &&
                        (r == endIndex || compareFunc(input[l], input[r]) <= 0)) {
                        buffer[i] = input[l];
                        l++;
                    }
                    else {
                        buffer[i] = input[r];
                        r++;
                    }
                }

                // copy the sorted subvector back to the input
                for (i = startIndex; i < endIndex; i++)
                    input[i] = buffer[<number>(i - startIndex)];
            }
        }

        /** @private */
        getChildEventListeners(object: DisplayObject, eventType: string,
            listeners: Array<DisplayObject>): void {
            var container: DisplayObjectContainer = object as DisplayObjectContainer;

            if (object.hasEventListener(eventType))
                listeners[listeners.length] = object; // avoiding 'push'                

            if (container) {
                var children: Array<DisplayObject> = container._children;
                var numChildren: number = children.length;

                for (var i: number = 0; i < numChildren; ++i)
                    this.getChildEventListeners(children[i], eventType, listeners);
            }
        }
    }
}
