!function(t){var i={};function e(h){if(i[h])return i[h].exports;var n=i[h]={i:h,l:!1,exports:{}};return t[h].call(n.exports,n,n.exports,e),n.l=!0,n.exports}e.m=t,e.c=i,e.d=function(t,i,h){e.o(t,i)||Object.defineProperty(t,i,{enumerable:!0,get:h})},e.r=function(t){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(t,"__esModule",{value:!0})},e.t=function(t,i){if(1&i&&(t=e(t)),8&i)return t;if(4&i&&"object"==typeof t&&t&&t.__esModule)return t;var h=Object.create(null);if(e.r(h),Object.defineProperty(h,"default",{enumerable:!0,value:t}),2&i&&"string"!=typeof t)for(var n in t)e.d(h,n,function(i){return t[i]}.bind(null,n));return h},e.n=function(t){var i=t&&t.__esModule?function(){return t.default}:function(){return t};return e.d(i,"a",i),i},e.o=function(t,i){return Object.prototype.hasOwnProperty.call(t,i)},e.p="",e(e.s=9)}({0:function(t,i){Object.defineProperty(i,"__esModule",{value:!0});var e=function(){function t(t,i,e,h){void 0===t&&(t=0),void 0===i&&(i=0),void 0===e&&(e=0),void 0===h&&(h=0),this.x=t,this.y=i,this.width=e,this.height=h}return Object.defineProperty(t.prototype,"right",{get:function(){return this.x+this.width},enumerable:!0,configurable:!0}),Object.defineProperty(t.prototype,"bottom",{get:function(){return this.y+this.height},enumerable:!0,configurable:!0}),t.prototype.setTo=function(t,i,e,h){return this.x=t,this.y=i,this.width=e,this.height=h,this},t.prototype.reset=function(){return this.x=this.y=this.width=this.height=0,this},t.prototype.recover=function(){this!=t.TEMP&&this!=t.EMPTY?Pool.recover("Rectangle",this.reset()):console.log("recover Temp or Empty:",this)},t.create=function(){return Pool.getItemByClass("Rectangle",t)},t.prototype.copyFrom=function(t){return this.x=t.x,this.y=t.y,this.width=t.width,this.height=t.height,this},t.prototype.contains=function(t,i){return!(this.width<=0||this.height<=0)&&(t>=this.x&&t<this.right&&i>=this.y&&i<this.bottom)},t.prototype.intersects=function(t){return!(t.x>this.x+this.width||t.x+t.width<this.x||t.y>this.y+this.height||t.y+t.height<this.y)},t.prototype.intersection=function(i,e){return void 0===e&&(e=null),this.intersects(i)?(e||(e=new t),e.x=Math.max(this.x,i.x),e.y=Math.max(this.y,i.y),e.width=Math.min(this.right,i.right)-e.x,e.height=Math.min(this.bottom,i.bottom)-e.y,e):null},t.prototype.union=function(i,e){return void 0===e&&(e=null),e||(e=new t),this.clone(e),i.width<=0||i.height<=0?e:(e.addPoint(i.x,i.y),e.addPoint(i.right,i.bottom),this)},t.prototype.clone=function(i){return void 0===i&&(i=null),i||(i=new t),i.x=this.x,i.y=this.y,i.width=this.width,i.height=this.height,i},t.prototype.toString=function(){return this.x+","+this.y+","+this.width+","+this.height},t.prototype.equals=function(t){return!(!t||t.x!==this.x||t.y!==this.y||t.width!==this.width||t.height!==this.height)},t.prototype.addPoint=function(t,i){return this.x>t&&(this.width+=this.x-t,this.x=t),this.y>i&&(this.height+=this.y-i,this.y=i),this.width<t-this.x&&(this.width=t-this.x),this.height<i-this.y&&(this.height=i-this.y),this},t.prototype._getBoundPoints=function(){var i=t._temB;return i.length=0,0==this.width||0==this.height||i.push(this.x,this.y,this.x+this.width,this.y,this.x,this.y+this.height,this.x+this.width,this.y+this.height),i},t._getBoundPointS=function(i,e,h,n){var o=t._temA;return o.length=0,0==h||0==n||o.push(i,e,i+h,e,i,e+n,i+h,e+n),o},t._getWrapRec=function(i,e){if(void 0===e&&(e=null),!i||i.length<1)return e?e.setTo(0,0,0,0):t.TEMP.setTo(0,0,0,0);e=e||t.create();var h,n,o,r,s,u=i.length,y=Point.TEMP;for(o=s=-(n=r=99999),h=0;h<u;h+=2)y.x=i[h],y.y=i[h+1],n=n<y.x?n:y.x,r=r<y.y?r:y.y,o=o>y.x?o:y.x,s=s>y.y?s:y.y;return e.setTo(n,r,o-n,s-r)},t.prototype.isEmpty=function(){return this.width<=0||this.height<=0},t}();e.EMPTY=new e,e.TEMP=new e,e._temB=[],e._temA=[],i.default=e},9:function(t,i,e){t.exports=e(0)}});
!function(e){var t={};function r(n){if(t[n])return t[n].exports;var o=t[n]={i:n,l:!1,exports:{}};return e[n].call(o.exports,o,o.exports,r),o.l=!0,o.exports}r.m=e,r.c=t,r.d=function(e,t,n){r.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:n})},r.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},r.t=function(e,t){if(1&t&&(e=r(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var n=Object.create(null);if(r.r(n),Object.defineProperty(n,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var o in e)r.d(n,o,function(t){return e[t]}.bind(null,o));return n},r.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return r.d(t,"a",t),t},r.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},r.p="",r(r.s=7)}({7:function(e,t,r){e.exports=r(8)},8:function(e,t){var r,n=(r=function(e,t){return(r=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(e,t){e.__proto__=t}||function(e,t){for(var r in t)t.hasOwnProperty(r)&&(e[r]=t[r])})(e,t)},function(e,t){function n(){this.constructor=e}r(e,t),e.prototype=null===t?Object.create(t):(n.prototype=t.prototype,new n)});Object.defineProperty(t,"__esModule",{value:!0});var o=function(e){function t(t,r,n){void 0===n&&(n=0);var o=e.call(this)||this;return o._width=t,o._height=r,o._color=n,o._fieldOfView=1,o._projectionOffset=new Point,o._cameraPosition=new Vector3D,o._enterFrameEvent=new EnterFrameEvent(Event.ENTER_FRAME,0),o._enterFrameListeners=[],o}return n(t,e),t.prototype.advanceTime=function(e){_enterFrameEvent.reset(Event.ENTER_FRAME,!1,e),broadcastEvent(_enterFrameEvent)},t.prototype.hitTest=function(t){if(!visible||!touchable)return null;if(t.x<0||t.x>_width||t.y<0||t.y>_height)return null;var r=e.prototype.hitTest.call(this,t);return r||this},t.prototype.getStageBounds=function(e,t){return void 0===t&&(t=null),null==t&&(t=new Rectangle),t.setTo(0,0,_width,_height),getTransformationMatrix(e,sMatrix),RectangleUtil.getBounds(t,sMatrix,t)},t.prototype.getScreenBounds=function(e,t){void 0===t&&(t=null);var r=this.starling;if(null==r)return getStageBounds(e,t);null==t&&(t=new Rectangle);var n=r.nativeStage,o=r.viewPort,i=_width/o.width,a=_height/o.height,l=-o.x*i,u=-o.y*a;return t.setTo(l,u,n.stageWidth*i,n.stageHeight*a),getTransformationMatrix(e,sMatrix),RectangleUtil.getBounds(t,sMatrix,t)},t.prototype.getCameraPosition=function(e,t){return void 0===e&&(e=null),void 0===t&&(t=null),getTransformationMatrix3D(e,sMatrix3D),MatrixUtil.transformCoords3D(sMatrix3D,_width/2+_projectionOffset.x,_height/2+_projectionOffset.y,-focalLength,t)},t.prototype.addEnterFrameListener=function(e){_enterFrameListeners.indexOf(e)<0&&(_enterFrameListeners[_enterFrameListeners.length]=e)},t.prototype.removeEnterFrameListener=function(e){var t=_enterFrameListeners.indexOf(e);t>=0&&_enterFrameListeners.removeAt(t)},t.prototype.getChildEventListeners=function(t,r,n){if(r==Event.ENTER_FRAME&&t==this)for(var o=0,i=n.length;o<i;++o)listeners[listeners.length]=n[o];else e.prototype.getChildEventListeners.call(this,t,r,listeners)},Object.defineProperty(t.prototype,"width",{set:function(e){throw new IllegalOperationError("Cannot set width of stage")},enumerable:!0,configurable:!0}),Object.defineProperty(t.prototype,"height",{set:function(e){throw new IllegalOperationError("Cannot set height of stage")},enumerable:!0,configurable:!0}),Object.defineProperty(t.prototype,"x",{set:function(e){throw new IllegalOperationError("Cannot set x-coordinate of stage")},enumerable:!0,configurable:!0}),Object.defineProperty(t.prototype,"y",{set:function(e){throw new IllegalOperationError("Cannot set y-coordinate of stage")},enumerable:!0,configurable:!0}),Object.defineProperty(t.prototype,"scaleX",{set:function(e){throw new IllegalOperationError("Cannot scale stage")},enumerable:!0,configurable:!0}),Object.defineProperty(t.prototype,"scaleY",{set:function(e){throw new IllegalOperationError("Cannot scale stage")},enumerable:!0,configurable:!0}),Object.defineProperty(t.prototype,"rotation",{set:function(e){throw new IllegalOperationError("Cannot rotate stage")},enumerable:!0,configurable:!0}),Object.defineProperty(t.prototype,"skewX",{set:function(e){throw new IllegalOperationError("Cannot skew stage")},enumerable:!0,configurable:!0}),Object.defineProperty(t.prototype,"skewY",{set:function(e){throw new IllegalOperationError("Cannot skew stage")},enumerable:!0,configurable:!0}),Object.defineProperty(t.prototype,"filter",{set:function(e){throw new IllegalOperationError("Cannot add filter to stage. Add it to 'root' instead!")},enumerable:!0,configurable:!0}),Object.defineProperty(t.prototype,"color",{get:function(){return _color},set:function(e){_color!=e&&(_color=e,setRequiresRedraw())},enumerable:!0,configurable:!0}),Object.defineProperty(t.prototype,"stageWidth",{get:function(){return _width},set:function(e){_width!=e&&(_width=e,setRequiresRedraw())},enumerable:!0,configurable:!0}),Object.defineProperty(t.prototype,"stageHeight",{get:function(){return _height},set:function(e){_height!=e&&(_height=e,setRequiresRedraw())},enumerable:!0,configurable:!0}),Object.defineProperty(t.prototype,"starling",{get:function(){for(var e=Starling.all,t=e.length,r=0;r<t;++r)if(e[r].stage==this)return e[r];return null},enumerable:!0,configurable:!0}),Object.defineProperty(t.prototype,"focalLength",{get:function(){return _width/(2*Math.tan(_fieldOfView/2))},set:function(e){_fieldOfView=2*Math.atan(stageWidth/(2*e)),setRequiresRedraw()},enumerable:!0,configurable:!0}),Object.defineProperty(t.prototype,"fieldOfView",{get:function(){return _fieldOfView},set:function(e){_fieldOfView=e,setRequiresRedraw()},enumerable:!0,configurable:!0}),Object.defineProperty(t.prototype,"projectionOffset",{get:function(){return _projectionOffset},set:function(e){_projectionOffset.setTo(e.x,e.y),setRequiresRedraw()},enumerable:!0,configurable:!0}),Object.defineProperty(t.prototype,"cameraPosition",{get:function(){return getCameraPosition(null,_cameraPosition)},enumerable:!0,configurable:!0}),t}(DisplayObjectContainer);t.default=o}});
!function(t){var i={};function e(n){if(i[n])return i[n].exports;var o=i[n]={i:n,l:!1,exports:{}};return t[n].call(o.exports,o,o.exports,e),o.l=!0,o.exports}e.m=t,e.c=i,e.d=function(t,i,n){e.o(t,i)||Object.defineProperty(t,i,{enumerable:!0,get:n})},e.r=function(t){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(t,"__esModule",{value:!0})},e.t=function(t,i){if(1&i&&(t=e(t)),8&i)return t;if(4&i&&"object"==typeof t&&t&&t.__esModule)return t;var n=Object.create(null);if(e.r(n),Object.defineProperty(n,"default",{enumerable:!0,value:t}),2&i&&"string"!=typeof t)for(var o in t)e.d(n,o,function(i){return t[i]}.bind(null,o));return n},e.n=function(t){var i=t&&t.__esModule?function(){return t.default}:function(){return t};return e.d(i,"a",i),i},e.o=function(t,i){return Object.prototype.hasOwnProperty.call(t,i)},e.p="",e(e.s=5)}([function(t,i){Object.defineProperty(i,"__esModule",{value:!0});var e=function(){function t(t,i,e,n){void 0===t&&(t=0),void 0===i&&(i=0),void 0===e&&(e=0),void 0===n&&(n=0),this.x=t,this.y=i,this.width=e,this.height=n}return Object.defineProperty(t.prototype,"right",{get:function(){return this.x+this.width},enumerable:!0,configurable:!0}),Object.defineProperty(t.prototype,"bottom",{get:function(){return this.y+this.height},enumerable:!0,configurable:!0}),t.prototype.setTo=function(t,i,e,n){return this.x=t,this.y=i,this.width=e,this.height=n,this},t.prototype.reset=function(){return this.x=this.y=this.width=this.height=0,this},t.prototype.recover=function(){this!=t.TEMP&&this!=t.EMPTY?Pool.recover("Rectangle",this.reset()):console.log("recover Temp or Empty:",this)},t.create=function(){return Pool.getItemByClass("Rectangle",t)},t.prototype.copyFrom=function(t){return this.x=t.x,this.y=t.y,this.width=t.width,this.height=t.height,this},t.prototype.contains=function(t,i){return!(this.width<=0||this.height<=0)&&(t>=this.x&&t<this.right&&i>=this.y&&i<this.bottom)},t.prototype.intersects=function(t){return!(t.x>this.x+this.width||t.x+t.width<this.x||t.y>this.y+this.height||t.y+t.height<this.y)},t.prototype.intersection=function(i,e){return void 0===e&&(e=null),this.intersects(i)?(e||(e=new t),e.x=Math.max(this.x,i.x),e.y=Math.max(this.y,i.y),e.width=Math.min(this.right,i.right)-e.x,e.height=Math.min(this.bottom,i.bottom)-e.y,e):null},t.prototype.union=function(i,e){return void 0===e&&(e=null),e||(e=new t),this.clone(e),i.width<=0||i.height<=0?e:(e.addPoint(i.x,i.y),e.addPoint(i.right,i.bottom),this)},t.prototype.clone=function(i){return void 0===i&&(i=null),i||(i=new t),i.x=this.x,i.y=this.y,i.width=this.width,i.height=this.height,i},t.prototype.toString=function(){return this.x+","+this.y+","+this.width+","+this.height},t.prototype.equals=function(t){return!(!t||t.x!==this.x||t.y!==this.y||t.width!==this.width||t.height!==this.height)},t.prototype.addPoint=function(t,i){return this.x>t&&(this.width+=this.x-t,this.x=t),this.y>i&&(this.height+=this.y-i,this.y=i),this.width<t-this.x&&(this.width=t-this.x),this.height<i-this.y&&(this.height=i-this.y),this},t.prototype._getBoundPoints=function(){var i=t._temB;return i.length=0,0==this.width||0==this.height||i.push(this.x,this.y,this.x+this.width,this.y,this.x,this.y+this.height,this.x+this.width,this.y+this.height),i},t._getBoundPointS=function(i,e,n,o){var h=t._temA;return h.length=0,0==n||0==o||h.push(i,e,i+n,e,i,e+o,i+n,e+o),h},t._getWrapRec=function(i,e){if(void 0===e&&(e=null),!i||i.length<1)return e?e.setTo(0,0,0,0):t.TEMP.setTo(0,0,0,0);e=e||t.create();var n,o,h,r,s,u=i.length,l=Point.TEMP;for(h=s=-(o=r=99999),n=0;n<u;n+=2)l.x=i[n],l.y=i[n+1],o=o<l.x?o:l.x,r=r<l.y?r:l.y,h=h>l.x?h:l.x,s=s>l.y?s:l.y;return e.setTo(o,r,h-o,s-r)},t.prototype.isEmpty=function(){return this.width<=0||this.height<=0},t}();e.EMPTY=new e,e.TEMP=new e,e._temB=[],e._temA=[],i.default=e},,,,,function(t,i,e){t.exports=e(6)},function(t,i,e){var n=function(t){return t&&t.__esModule?t:{default:t}};Object.defineProperty(i,"__esModule",{value:!0});var o=n(e(0)),h=function(){function t(t,i,e,n){void 0===e&&(e="auto"),void 0===n&&(n="auto");var h=document.getElementById("starlingCanvas");i=i||new o.default(0,0,h.width,h.height),this._rootClass=t,this._viewPort=i,this._previousViewPort=new o.default,this._stage=new Stage(i.width,i.height,stage.color),this.context3D=this.createGLContext(h),this.initialize()}return t.prototype.initialize=function(){this.initializeRoot()},t.prototype.initializeRoot=function(){if(null==_root&&null!=_rootClass){if(_root=new _rootClass,null==_root)throw new Error("Invalid root class: "+_rootClass);_stage.addChildAt(_root,0),dispatchEventWith(starling.events.Event.ROOT_CREATED,!1,_root)}},t.prototype.createGLContext=function(t){for(var i=["webgl","experimental-webgl"],e=null,n=0;n<i.length;n++){try{e=t.getContext(i[n])}catch(t){console.log(i[n]+":"+t)}if(e)break}return e?(e.viewportWidth=t.width,e.viewportHeight=t.height):alert("Failed to create WebGL context!"),e},t.init=function(t,i){var e=document.createElement("canvas");e.setAttribute("id","starlingCanvas"),e.setAttribute("width",t),e.setAttribute("height",i),document.body.appendChild(e)},t}();window.StarlingJS||(window.StarlingJS={}),window.StarlingJS.Starling=h,i.default=window.StarlingJS.Starling}]);
!function(e){var t={};function n(r){if(t[r])return t[r].exports;var o=t[r]={i:r,l:!1,exports:{}};return e[r].call(o.exports,o,o.exports,n),o.l=!0,o.exports}n.m=e,n.c=t,n.d=function(e,t,r){n.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:r})},n.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},n.t=function(e,t){if(1&t&&(e=n(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var r=Object.create(null);if(n.r(r),Object.defineProperty(r,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var o in e)n.d(r,o,function(t){return e[t]}.bind(null,o));return r},n.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return n.d(t,"a",t),t},n.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},n.p="",n(n.s=1)}([,function(e,t,n){e.exports=n(2)},function(e,t){StarlingJS.Starling.init(800,600),new StarlingJS.Starling(null,null)}]);
!function(e){var t={};function n(r){if(t[r])return t[r].exports;var o=t[r]={i:r,l:!1,exports:{}};return e[r].call(o.exports,o,o.exports,n),o.l=!0,o.exports}n.m=e,n.c=t,n.d=function(e,t,r){n.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:r})},n.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},n.t=function(e,t){if(1&t&&(e=n(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var r=Object.create(null);if(n.r(r),Object.defineProperty(r,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var o in e)n.d(r,o,function(t){return e[t]}.bind(null,o));return r},n.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return n.d(t,"a",t),t},n.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},n.p="",n(n.s=3)}([,,,function(e,t,n){e.exports=n(4)},function(e,t){Object.defineProperty(t,"__esModule",{value:!0}),function(e){var t=function(){function e(){}return e.prototype.test=function(){console.log("xxx")},e}();e.Test1=t}(t.A||(t.A={}))}]);