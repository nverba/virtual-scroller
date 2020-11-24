!function(e,t){"object"==typeof exports&&"undefined"!=typeof module?module.exports=t():"function"==typeof define&&define.amd?define(t):(e=e||self).VirtualScroller=t()}(this,function(){"use strict";var e="undefined"!=typeof globalThis?globalThis:"undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof self?self:{};for(var t,n=(function(t){(function(){var e,n,i,r,o,s;"undefined"!=typeof performance&&null!==performance&&performance.now?t.exports=function(){return performance.now()}:"undefined"!=typeof process&&null!==process&&process.hrtime?(t.exports=function(){return(e()-o)/1e6},n=process.hrtime,r=(e=function(){var e;return 1e9*(e=n())[0]+e[1]})(),s=1e9*process.uptime(),o=r-s):Date.now?(t.exports=function(){return Date.now()-i},i=Date.now()):(t.exports=function(){return(new Date).getTime()-i},i=(new Date).getTime())}).call(e)}(t={exports:{}},t.exports),t.exports),i="undefined"==typeof window?e:window,r=["moz","webkit"],o="AnimationFrame",s=i["request"+o],a=i["cancel"+o]||i["cancelRequest"+o],l=0;!s&&l<r.length;l++)s=i[r[l]+"Request"+o],a=i[r[l]+"Cancel"+o]||i[r[l]+"CancelRequest"+o];if(!s||!a){var u=0,h=0,d=[];s=function(e){if(0===d.length){var t=n(),i=Math.max(0,1e3/60-(t-u));u=i+t,setTimeout(function(){var e=d.slice(0);d.length=0;for(var t=0;t<e.length;t++)if(!e[t].cancelled)try{e[t].callback(u)}catch(e){setTimeout(function(){throw e},0)}},Math.round(i))}return d.push({handle:++h,callback:e,cancelled:!1}),h},a=function(e){for(var t=0;t<d.length;t++)d[t].handle===e&&(d[t].cancelled=!0)}}var c=function(e){return s.call(i,e)};c.cancel=function(){a.apply(i,arguments)},c.polyfill=function(e){e||(e=i),e.requestAnimationFrame=s,e.cancelAnimationFrame=a};var m=c.cancel;function f(e,t){var n=Date.now(),i=c(function r(){Date.now()-n>=t?e():i=c(r)});return{clear:function(){return m(i)}}}function g(e){e&&e.clear()}function I(e){return(I="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}function p(e,t){return!t||"object"!==I(t)&&"function"!=typeof t?function(e){if(void 0===e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return e}(e):t}function v(e){return(v=Object.setPrototypeOf?Object.getPrototypeOf:function(e){return e.__proto__||Object.getPrototypeOf(e)})(e)}function S(e,t){return(S=Object.setPrototypeOf||function(e,t){return e.__proto__=t,e})(e,t)}function y(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}function w(e,t){for(var n=0;n<t.length;n++){var i=t[n];i.enumerable=i.enumerable||!1,i.configurable=!0,"value"in i&&(i.writable=!0),Object.defineProperty(e,i.key,i)}}function b(e,t,n){return t&&w(e.prototype,t),n&&w(e,n),e}var x=function(){function e(t){y(this,e),this.element=t}return b(e,[{key:"getScrollY",value:function(){return this.element.scrollTop}},{key:"scrollTo",value:function(e,t){this.element.scrollTo(e,t)}},{key:"getWidth",value:function(){return this.element.offsetWidth}},{key:"getHeight",value:function(){return this.element.offsetHeight}},{key:"getContentHeight",value:function(){return this.element.scrollHeight}},{key:"getTopOffset",value:function(e){var t=this.element.getBoundingClientRect().top,n=this.element.clientTop;return e.getBoundingClientRect().top-t+this.getScrollY()-n}},{key:"addScrollListener",value:function(e){var t=this;return this.element.addEventListener("scroll",e),function(){return t.element.removeEventListener("scroll",e)}}},{key:"onResize",value:function(e){var t,n=this;if("undefined"!=typeof ResizeObserver){var i=new ResizeObserver(function(t){var n=t,i=Array.isArray(n),r=0;for(n=i?n:n[Symbol.iterator]();;){if(i){if(r>=n.length)break;n[r++]}else{if((r=n.next()).done)break;r.value}return e()}});i.observe(this.element),t=function(){return i.unobserve(n.element)}}var r=(new C).onResize(e);return function(){t&&t(),r()}}}]),e}(),C=function(e){function t(){return y(this,t),p(this,v(t).call(this,window))}return function(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function");e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,writable:!0,configurable:!0}}),t&&S(e,t)}(t,x),b(t,[{key:"getScrollY",value:function(){return window.pageYOffset}},{key:"getWidth",value:function(){return window.innerWidth}},{key:"getHeight",value:function(){return window.innerHeight}},{key:"getContentHeight",value:function(){return document.documentElement.scrollHeight}},{key:"getTopOffset",value:function(e){var t=document.clientTop||document.body.clientTop||0;return e.getBoundingClientRect().top+this.getScrollY()-t}},{key:"onResize",value:function(e){return window.addEventListener("resize",e),function(){return window.removeEventListener("resize",e)}}}]),t}();function H(e){return e.toFixed(2)+"px"}var k="[virtual-scroller] It looks like you're using Internet Explorer which doesn't support CSS variables required for a <tbody/> container. VirtualScroller has been switched into \"bypass\" mode (render all items). See: https://gitlab.com/catamphetamine/virtual-scroller/-/issues/1";function O(e){return function(e){if(Array.isArray(e)){for(var t=0,n=new Array(e.length);t<e.length;t++)n[t]=e[t];return n}}(e)||function(e){if(Symbol.iterator in Object(e)||"[object Arguments]"===Object.prototype.toString.call(e))return Array.from(e)}(e)||function(){throw new TypeError("Invalid attempt to spread non-iterable instance")}()}function A(){if(R()){for(var e,t=arguments.length,n=new Array(t),i=0;i<t;i++)n[i]=arguments[i];(e=console).log.apply(e,O(["[virtual-scroller]"].concat(n)))}}function R(){return"undefined"!=typeof window&&window.VirtualScrollerDebug}function L(e,t){for(var n=0;n<t.length;n++){var i=t[n];i.enumerable=i.enumerable||!1,i.configurable=!0,"value"in i&&(i.writable=!0),Object.defineProperty(e,i.key,i)}}var T=function(){function e(t,n){!function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,e),this.getContainerElement=t,this.getState=n,this.initialize()}var t,n,i;return t=e,(n=[{key:"initialize",value:function(){this.reset(),this.getState()&&this.onStateUpdate()}},{key:"reset",value:function(){this.measuredItemsHeight=0,this.firstMeasuredItemIndex=void 0,this.lastMeasuredItemIndex=void 0}},{key:"onStateUpdate",value:function(){for(var e=0;e<this.getState().itemHeights.length;){if(void 0===this.getState().itemHeights[e]){if(void 0!==this.firstMeasuredItemIndex){this.lastMeasuredItemIndex=e-1;break}}else void 0===this.firstMeasuredItemIndex&&(this.firstMeasuredItemIndex=e),this.measuredItemsHeight+=this.getState().itemHeights[e];e++}}},{key:"_getItemHeight",value:function(e,t){var n=this.getContainerElement();if(n){var i=e-t;if(i>=0&&i<n.childNodes.length)return n.childNodes[i].getBoundingClientRect().height}}},{key:"getItemSpacing",value:function(){var e=this.getContainerElement();if(e&&e.childNodes.length>1){var t=e.childNodes[0],n=e.childNodes[1],i=t.getBoundingClientRect(),r=n.getBoundingClientRect().top-(i.top+i.height);return window.VirtualScrollerDebug&&A("Measure item spacing",r),r}}},{key:"update",value:function(e,t,n){void 0===this.getState().itemSpacing&&(this.getState().itemSpacing=this.getItemSpacing()),void 0!==this.firstMeasuredItemIndex&&(e>this.lastMeasuredItemIndex+1||t<this.firstMeasuredItemIndex-1)&&this.reset();for(var i=this.firstMeasuredItemIndex,r=this.lastMeasuredItemIndex,o=!1,s=e;s<=t;){var a=this._getItemHeight(s,n);void 0!==a&&(this.set(s,a),(void 0===i||s<i)&&(this.measuredItemsHeight+=a,o||(this.firstMeasuredItemIndex=s,o=!0)),(void 0===r||s>r)&&(void 0!==r&&(this.measuredItemsHeight+=a),this.lastMeasuredItemIndex=s)),s++}}},{key:"updateItemHeight",value:function(e,t){var n=this.get(e),i=this._getItemHeight(e,t);void 0!==n&&void 0!==i&&(this.set(e,i),this.measuredItemsHeight+=i-n)}},{key:"getAverage",value:function(){return this.measuredItemsHeight?this.measuredItemsHeight/(this.lastMeasuredItemIndex-this.firstMeasuredItemIndex+1):0}},{key:"get",value:function(e){return this.getState().itemHeights[e]}},{key:"set",value:function(e,t){this.getState().itemHeights[e]=t}},{key:"onPrepend",value:function(e){void 0!==this.firstMeasuredItemIndex&&(this.firstMeasuredItemIndex+=e,this.lastMeasuredItemIndex+=e)}}])&&L(t.prototype,n),i&&L(t,i),e}();function P(e){return(P="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}var M=Object.prototype.hasOwnProperty;function E(e,t){return e===t?0!==e||0!==t||1/e==1/t:e!=e&&t!=t}function U(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{},i=Object.keys(n);"function"==typeof Object.getOwnPropertySymbols&&(i=i.concat(Object.getOwnPropertySymbols(n).filter(function(e){return Object.getOwnPropertyDescriptor(n,e).enumerable}))),i.forEach(function(t){z(e,t,n[t])})}return e}function B(e,t){for(var n=0;n<t.length;n++){var i=t[n];i.enumerable=i.enumerable||!1,i.configurable=!0,"value"in i&&(i.writable=!0),Object.defineProperty(e,i.key,i)}}function z(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}var V=250,j=100;function D(e,t){var n=-1,i=-1;return e.length>0&&(n=t.findIndex(function(t){var n=t.id,i=void 0===n?null:n;return i&&i===e[0].id}))>=0&&function(e,t,n){var i=0;for(;i<e.length;){if(t[n+i].id!==e[i].id)return!1;i++}return!0}(e,t,n)&&(i=n+e.length-1),n>=0||i>=0?{prependedItemsCount:n,appendedItemsCount:t.length-(i+1)}:{prependedItemsCount:-1,appendedItemsCount:-1}}return function(){function e(t,n){var i,r,o,s=this,a=arguments.length>2&&void 0!==arguments[2]?arguments[2]:{};!function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,e),z(this,"updateLayout",function(){return s.onUpdateShownItemIndexes({reason:"manual"})}),z(this,"onScroll",function(){return s.onUpdateShownItemIndexes({reason:"scroll"})}),z(this,"restoreScrollPosition",function(){var e=s.getState().scrollY;void 0!==e&&s.scrollTo(0,e)}),z(this,"updateScrollPosition",function(){return s.getState().scrollY=s.getScrollY()}),z(this,"layout",function(){return s.updateLayout()}),z(this,"onResize",(i=function(e){if(s.isRendered){var t=s.shouldUpdateLayoutOnScrollableContainerResize(e);"UPDATE_LAYOUT"===t?(A("~ Scrollable container size changed, re-measure item heights. ~"),s.resized=!0,s.setState(s.getInitialLayoutState())):"UPDATE_INDEXES"===t&&s.onUpdateShownItemIndexes({reason:"resize"})}},r=V,function(){for(var e=this,t=arguments.length,n=new Array(t),s=0;s<t;s++)n[s]=arguments[s];clearTimeout(o),o=setTimeout(function(){return i.apply(e,n)},r)})),z(this,"willUpdateState",function(e,t){if(t&&s.preserveScrollPositionOnPrependItems){s.preserveScrollPositionOnPrependItems=void 0;var n=t.items,i=e.items,r=D(n,i).prependedItemsCount;s.captureScroll(n,i,r)}}),z(this,"didUpdateState",function(e){var t=s.getState();if(s.onStateChange&&(function(e,t){if(E(e,t))return!0;if("object"!==P(e)||null===e||"object"!==P(t)||null===t)return!1;var n=Object.keys(e),i=Object.keys(t);if(n.length!==i.length)return!1;for(var r=0;r<n.length;r++)if(!M.call(t,n[r])||!E(e[n[r]],t[n[r]]))return!1;return!0}(t,e)||s.onStateChange(t,e)),e&&s.isRendered){A("~ Rendered ~"),t.firstShownItemIndex===e.firstShownItemIndex&&t.lastShownItemIndex===e.lastShownItemIndex&&t.items===e.items||s.onRendered();var n=e.items,i=t.items;if(i!==n){var r=D(n,i),o=r.prependedItemsCount,a=r.appendedItemsCount;return o>0||a>0?o>0&&(s.itemHeights.onPrepend(o),void 0!==s.firstSeenItemIndex&&(s.firstSeenItemIndex+=o,s.lastSeenItemIndex+=o)):(s.itemHeights.initialize(),s.firstSeenItemIndex=void 0,s.lastSeenItemIndex=void 0),s.updateSeenItemIndexes(),s.multiRenderLayout&&s.stopMultiRenderLayout(),s.onUpdateShownItemIndexes({reason:"update items",force:!0})}return s.resized?(s.resized=void 0,A("~ Rendered (resize) ~"),s.multiRenderLayout&&s.stopMultiRenderLayout(),s.onUpdateShownItemIndexes({reason:"resize"})):s.multiRenderLayout?s.onMultiRenderLayoutRendered():void 0}}),z(this,"updateShownItemIndexes",function(){var e=s.getShownItemIndexes(),t=e.firstShownItemIndex,n=e.lastShownItemIndex,i=e.redoLayoutAfterRender,r=s.getBeforeItemsHeight(t,n),o=s.getAfterItemsHeight(t,n);s.updateWillBeHiddenItemHeightsAndState(t,n),A("~ Layout results "+(s.bypass?"(bypass) ":"")+"~"),A("First shown item index",t),A("Last shown item index",n),A("Before items height",r),A("After items height (actual or estimated)",o),A("Average item height (calculated on previous render)",s.itemHeights.getAverage()),R()&&(A("Item heights",s.getState().itemHeights.slice()),A("Item states",s.getState().itemStates.slice())),i&&(A("Schedule a re-layout after the upcoming rerender"),s.redoLayoutAfterRender=!0),void 0!==s.firstSeenItemIndex&&(t>s.lastSeenItemIndex+1||n<s.firstSeenItemIndex-1)&&(s.firstSeenItemIndex=void 0,s.lastSeenItemIndex=void 0),s.onBeforeShowItems(s.getState().items,t,n,s.firstSeenItemIndex,s.lastSeenItemIndex),s.setState({firstShownItemIndex:t,lastShownItemIndex:n,beforeItemsHeight:r,afterItemsHeight:o})}),z(this,"updateShownItemIndexesRecursive",function(){s.multiRenderLayout=!0,s.updateShownItemIndexes()}),z(this,"restoreScroll",function(){var e=s.restoreScrollAfterPrepend,t=e.index,n=e.visibleAreaTop;s.restoreScrollAfterPrepend=void 0;var i=s.getItemElement(t).getBoundingClientRect().top-n;0!==i&&(A("Restore scroll position: scroll by",i),s.scrollTo(0,s.getScrollY()+i))}),z(this,"onUpdateShownItemIndexes",function(e){var t=e.reason;e.force;if(0!==s.getItemsCount()&&!s.multiRenderLayout){if(g(s.onUserStopsScrollingTimeout),"scroll"===t){var n=void 0!==s.latestLayoutVisibleAreaTopAfterIncludingMargin&&s.getScrollY()<s.latestLayoutVisibleAreaTopAfterIncludingMargin&&s.getState().firstShownItemIndex>0||void 0!==s.latestLayoutVisibleAreaBottomAfterIncludingMargin&&s.getScrollY()+s.scrollableContainer.getHeight()>s.latestLayoutVisibleAreaBottomAfterIncludingMargin&&s.getState().lastShownItemIndex<s.getItemsCount()-1;if(A(n?"The user has scrolled far enough: force re-render":"The user hasn't scrolled too much: delay re-render"),!n)return s.onUserStopsScrollingTimeout=f(s.onUserStoppedScrolling,j)}A("~ Update layout (on ".concat(t,") ~")),s.updateShownItemIndexesRecursive()}}),z(this,"onUserStoppedScrolling",function(){s.isRendered&&s.updateLayout("stopped scrolling")});var l=a.getState,u=a.setState,h=a.onStateChange,d=a.customState,c=a.preserveScrollPositionAtBottomOnMount,m=a.shouldUpdateLayoutOnWindowResize,I=a.measureItemsBatchSize,p=a.getScrollableContainer,v=a.tbody,S=a.bypass,y=a.estimatedItemHeight,w=a.onItemInitialRender,b=a.onItemFirstRender,H=a.scrollableContainer,O=a.preserveScrollPositionOfTheBottomOfTheListOnMount,L=a.state;A("~ Initialize ~"),L&&(n=L.items),!H&&p&&(H=p()),H?this.scrollableContainer=new x(H):"undefined"!=typeof window&&(this.scrollableContainer=new C),v&&(A("~ <tbody/> detected ~"),this.tbody=!0,"undefined"!=typeof window&&window.document.documentMode&&(A("~ <tbody/> not supported ~"),"undefined"!=typeof window?setTimeout(function(){throw new Error(k)},0):console.error(k),S=!0)),S&&A('~ "bypass" mode ~'),this.bypass=S,this.initialItems=n,this.estimatedItemHeight=y,this.onStateChange=h,this._shouldUpdateLayoutOnWindowResize=m,this.measureItemsBatchSize=void 0===I?50:I,w?this.onItemFirstRender=w:b&&(this.onItemFirstRender=function(e){console.warn("[virtual-scroller] `onItemFirstRender(i)` is deprecated, use `onItemInitialRender(item)` instead.");var t=s.getState().items.indexOf(e);t>=0&&b(t)}),u?(this.getState=l,this.setState=function(e){return u(e,{willUpdateState:s.willUpdateState,didUpdateState:s.didUpdateState})}):(this.getState=function(){return s.state},this.setState=function(e){var t=s.getState(),n=U({},t,e);s.willUpdateState(n,t),s.state=n,s.didUpdateState(t)}),L&&A("Initial state (passed)",L),this.getContainerElement=t,t()&&function(e){for(;e.firstChild;)e.removeChild(e.firstChild)}(t()),this.itemHeights=new T(this.getContainerElement,this.getState),this.scrollableContainer&&(c&&(console.warn("[virtual-scroller] `preserveScrollPositionAtBottomOnMount` option/property has been renamed to `preserveScrollPositionOfTheBottomOfTheListOnMount`"),O=c),O&&(this.preserveScrollPositionOfTheBottomOfTheListOnMount={scrollableContainerContentHeight:this.scrollableContainer.getContentHeight()})),this.setState(L||this.getInitialState(d)),A("Items count",n.length),y&&A("Estimated item height",y)}var t,n,i;return t=e,(n=[{key:"getInitialState",value:function(e){var t=this.initialItems.length,n=U({},e,this.getInitialLayoutState(),{items:this.initialItems,itemStates:new Array(t)});return A("Initial state (autogenerated)",n),A("First shown item index",n.firstShownItemIndex),A("Last shown item index",n.lastShownItemIndex),n}},{key:"getInitialLayoutState",value:function(){var e,t,n=this.initialItems,i=n.length;return i>0&&(e=0,t=this.getLastShownItemIndex(e,i)),this.preserveScrollPositionOfTheBottomOfTheListOnMount&&(e=0,t=i-1),this.onBeforeShowItems(n,e,t,this.firstSeenItemIndex,this.lastSeenItemIndex),{itemHeights:new Array(i),itemSpacing:void 0,beforeItemsHeight:0,afterItemsHeight:0,firstShownItemIndex:e,lastShownItemIndex:t,scrollY:void 0}}},{key:"getEstimatedItemHeight",value:function(){return this.itemHeights&&this.itemHeights.getAverage()||this.estimatedItemHeight||0}},{key:"getItemSpacing",value:function(){return this.getState()&&this.getState().itemSpacing||0}},{key:"getEstimatedItemsCount",value:function(e){return this.getEstimatedItemHeight()?Math.ceil((e+this.getItemSpacing())/(this.getEstimatedItemHeight()+this.getItemSpacing())):1}},{key:"getEstimatedItemsCountOnScreen",value:function(){return this.scrollableContainer?this.getEstimatedItemsCount(2*this.getMargin()+this.scrollableContainer.getHeight()):1}},{key:"getLastShownItemIndex",value:function(e,t){return this.bypass?t-1:Math.min(e+(this.getEstimatedItemsCountOnScreen()-1),t-1)}},{key:"getItemsCount",value:function(){return this.getState().items.length}},{key:"getMargin",value:function(){return 1*this.scrollableContainer.getHeight()}},{key:"onBeforeShowItems",value:function(e,t,n,i,r){var o=this.onItemFirstRender;if(o)if(void 0===i)for(var s=t;s<=n;)o(e[s]),s++;else{if(t<i)for(var a=t,l=Math.min(n,i-1),u=a;u<=l;)o(e[u]),u++;if(n>r)for(var h=n,d=Math.max(t,r+1);d<=h;)o(e[d]),d++}}},{key:"updateSeenItemIndexes",value:function(){var e=this.firstSeenItemIndex,t=this.lastSeenItemIndex,n=this.getState(),i=n.firstShownItemIndex,r=n.lastShownItemIndex;void 0===e?(e=i,t=r):(i<e&&(e=i),r>t&&(t=r)),this.firstSeenItemIndex=e,this.lastSeenItemIndex=t}},{key:"onMount",value:function(){console.warn("[virtual-scroller] `.onMount()` instance method name is deprecated, use `.listen()` instance method name instead."),this.listen()}},{key:"render",value:function(){console.warn("[virtual-scroller] `.render()` instance method name is deprecated, use `.listen()` instance method name instead."),this.listen()}},{key:"listen",value:function(){if(!1===this.isRendered)throw new Error("[virtual-scroller] Can't restart a `VirtualScroller` after it has been stopped");A("~ Rendered (initial) ~"),this.isRendered=!0,this.onRendered(),this.scrollableContainerWidth=this.scrollableContainer.getWidth(),this.scrollableContainerHeight=this.scrollableContainer.getHeight(),this.restoreScrollPosition(),this.updateScrollPosition(),this.removeScrollPositionListener=this.scrollableContainer.addScrollListener(this.updateScrollPosition),this.bypass||(this.removeScrollListener=this.scrollableContainer.addScrollListener(this.onScroll),this.scrollableContainerUnlistenResize=this.scrollableContainer.onResize(this.onResize)),this.tbody&&function(e){e.classList.add("VirtualScroller");var t=document.getElementById("VirtualScrollerStyle");t||((t=document.createElement("style")).id="VirtualScrollerStyle",t.innerText="\n\t\t\ttbody.VirtualScroller:before {\n\t\t\t\tcontent: '';\n\t\t\t\tdisplay: table-row;\n\t\t\t\theight: var(--VirtualScroller-paddingTop);\n\t\t\t}\n\t\t\ttbody.VirtualScroller:after {\n\t\t\t\tcontent: '';\n\t\t\t\tdisplay: table-row;\n\t\t\t\theight: var(--VirtualScroller-paddingBottom);\n\t\t\t}\n\t\t".replace(/[\n\t]/g,""),document.head.appendChild(t))}(this.getContainerElement()),this.preserveScrollPositionOfTheBottomOfTheListOnMount?this.scrollTo(0,this.getScrollY()+(this.scrollableContainer.getHeight()-this.preserveScrollPositionOfTheBottomOfTheListOnMount.scrollableContainerContentHeight)):this.onUpdateShownItemIndexes({reason:"mount"})}},{key:"onRendered",value:function(){this.updateItemHeights(),this.tbody&&this.updateTbodyPadding()}},{key:"scrollTo",value:function(e,t){this.scrollableContainer.scrollTo(e,t)}},{key:"getScrollY",value:function(){return this.scrollableContainer.getScrollY()}},{key:"getVisibleAreaBounds",value:function(){var e=this.getScrollY();return{top:e,bottom:e+this.scrollableContainer.getHeight()}}},{key:"getHeight",value:function(){return this.getContainerElement().getBoundingClientRect().height}},{key:"getTopOffset",value:function(){return this.scrollableContainer.getTopOffset(this.getContainerElement())}},{key:"shouldUpdateLayoutOnScrollableContainerResize",value:function(e){if(e&&e.target===window){if(document.fullscreenElement&&this.getContainerElement().contains(document.fullscreenElement))return!1;if(this._shouldUpdateLayoutOnWindowResize&&!this._shouldUpdateLayoutOnWindowResize(e))return!1}var t=this.scrollableContainerWidth,n=this.scrollableContainerHeight;return this.scrollableContainerWidth=this.scrollableContainer.getWidth(),this.scrollableContainerHeight=this.scrollableContainer.getHeight(),this.scrollableContainerWidth===t?this.scrollableContainerHeight!==n&&"UPDATE_INDEXES":"UPDATE_LAYOUT"}},{key:"onUnmount",value:function(){console.warn("[virtual-scroller] `.onUnmount()` instance method name is deprecated, use `.stop()` instance method name instead."),this.stop()}},{key:"destroy",value:function(){console.warn("[virtual-scroller] `.destroy()` instance method name is deprecated, use `.stop()` instance method name instead."),this.stop()}},{key:"stop",value:function(){this.isRendered=!1,this.removeScrollPositionListener(),this.bypass||(this.removeScrollListener(),this.scrollableContainerUnlistenResize(),g(this.onUserStopsScrollingTimeout),g(this.watchContainerElementCoordinatesTimer))}},{key:"updateTbodyPadding",value:function(){var e=this.getState(),t=e.beforeItemsHeight,n=e.afterItemsHeight;!function(e,t,n){e.style.setProperty("--VirtualScroller-paddingTop",H(t)),e.style.setProperty("--VirtualScroller-paddingBottom",H(n))}(this.getContainerElement(),t,n)}},{key:"updateItemHeights",value:function(){var e=this.getState(),t=e.firstShownItemIndex,n=e.lastShownItemIndex,i=this.getState().firstShownItemIndex;void 0!==t&&(A("~ Measure item heights ~"),this.itemHeights.update(t,n,i),R()&&A("Item heights",this.getState().itemHeights.slice()))}},{key:"updateItemHeight",value:function(e){var t=this.getState().firstShownItemIndex;this.itemHeights.updateItemHeight(e,t)}},{key:"onItemStateChange",value:function(e,t){R()&&(A("~ Item state changed ~"),A("Item",e),A("Previous state\n"+JSON.stringify(this.getState().itemStates[e],null,2)),A("New state\n"+JSON.stringify(t,null,2))),this.getState().itemStates[e]=t}},{key:"onItemHeightChange",value:function(e){var t=this.getState().itemHeights,n=t[e];this.updateItemHeight(e);var i=t[e];n!==i&&(A("~ Item height changed ~"),A("Item",e),A("Previous height",n),A("New height",i),this.onUpdateShownItemIndexes({reason:"item height change"}))}},{key:"getItemCoordinates",value:function(e){for(var t=this.getTopOffset(),n=0;n<e;)t+=this.getState().itemHeights[n],t+=this.getItemSpacing(),n++;return{top:t,bottom:t+this.getState().itemHeights[e],height:this.getState().itemHeights[n]}}},{key:"getVisibleItemIndexes",value:function(e,t,n){for(var i,r,o,s=0,a=!1,l=0;l<this.getItemsCount();){var u=this.itemHeights.get(l);if(void 0===u){A("Item index ".concat(l,' lies within the visible area or its "margins", but its height hasn\'t been measured yet. Mark the item as "shown", render the list, measure the item\'s height and redo the layout.')),o=l,void 0===i&&(i=l);var h=t-(n+s);r=Math.min(l+(this.getEstimatedItemsCount(h)-1),this.getItemsCount()-1),a=!0;break}if(s+=u,void 0===i&&n+s>e&&(A("First visible item index",l),i=l),l<this.getItemsCount()-1&&(s+=this.getItemSpacing()),n+s>t){A("Last visible item index",l),void 0!==i&&(r=l);break}l++}return void 0!==i&&void 0===r&&A("Last item index (is fully visible)",r=this.getItemsCount()-1),this.restoreScrollAfterPrepend&&(r<this.restoreScrollAfterPrepend.index&&(r=this.restoreScrollAfterPrepend.index),a=!1),a&&this.measureItemsBatchSize&&(r=Math.min(r,o+this.measureItemsBatchSize-1)),{firstShownItemIndex:i,lastShownItemIndex:r,redoLayoutAfterRender:a}}},{key:"getOffscreenListShownItemIndexes",value:function(){return{firstShownItemIndex:0,lastShownItemIndex:0,redoLayoutAfterRender:void 0===this.itemHeights.get(0)}}},{key:"getItemIndexes",value:function(e,t,n,i){if(n+i>e&&n<t){var r=this.getVisibleItemIndexes(e,t,n);if(void 0!==r.firstShownItemIndex)return r;A("Off-screen")}else A("Off-screen")}},{key:"getBeforeItemsHeight",value:function(e,t){for(var n=0,i=0;i<e;)n+=this.itemHeights.get(i)||this.itemHeights.getAverage(),n+=this.getItemSpacing(),i++;return n}},{key:"getAfterItemsHeight",value:function(e,t){for(var n=0,i=t+1;i<this.getItemsCount();)n+=this.getItemSpacing(),n+=this.itemHeights.get(i)||this.itemHeights.getAverage(),i++;return n}},{key:"updateWillBeHiddenItemHeightsAndState",value:function(e,t){for(var n=this.getState().firstShownItemIndex;n<=this.getState().lastShownItemIndex;)n>=e&&n<=t||this.updateItemHeight(n),n++}},{key:"watchContainerElementCoordinates",value:function(){var e=this,t=Date.now();!function n(){e.isRendered&&(void 0!==e.topOffset&&e.getTopOffset()!==e.topOffset&&e.onUpdateShownItemIndexes({reason:"top offset change"}),Date.now()-t<3e3&&(e.watchContainerElementCoordinatesTimer=f(n,500)))}()}},{key:"getShownItemIndexes",value:function(){if(this.bypass)return{firstShownItemIndex:0,lastShownItemIndex:this.getItemsCount()-1};var e=this.getTopOffset();void 0===this.topOffset&&this.watchContainerElementCoordinates(),this.topOffset=e;var t=this.getVisibleAreaBounds(),n=t.top,i=t.bottom;return this.latestLayoutVisibleAreaTopAfterIncludingMargin=n-this.getMargin(),this.latestLayoutVisibleAreaBottomAfterIncludingMargin=i+this.getMargin(),this.getItemIndexes(n-this.getMargin(),i+this.getMargin(),e,this.getHeight())||this.getOffscreenListShownItemIndexes()}},{key:"onMultiRenderLayoutRendered",value:function(){var e=this;if(this.redoLayoutAfterRender)return this.redoLayoutAfterRender=void 0,f(function(){e.isRendered&&e.updateShownItemIndexesRecursive()},0);this.stopMultiRenderLayout()}},{key:"stopMultiRenderLayout",value:function(){this.multiRenderLayout=void 0,this.redoLayoutAfterRender||this.restoreScrollAfterPrepend&&this.restoreScroll()}},{key:"captureScroll",value:function(e,t,n){0!==e.length&&(void 0===n&&(n=t.indexOf(e[0])),n<0||0!==n&&(this.getState().firstShownItemIndex>0||this.restoreScrollAfterPrepend&&this.restoreScrollAfterPrepend.previousItems===e&&this.restoreScrollAfterPrepend.nextItems===t||(this.restoreScrollAfterPrepend={previousItems:e,nextItems:t,index:n,visibleAreaTop:this.getItemElement(0).getBoundingClientRect().top})))}},{key:"updateItems",value:function(e,t){return this.setItems(e,t)}},{key:"setItems",value:function(e){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{},n=this.getState().items,i=this.getState(),r=i.firstShownItemIndex,o=i.lastShownItemIndex,s=i.beforeItemsHeight,a=i.afterItemsHeight,l=i.itemStates,u=i.itemHeights,h=(i.itemSpacing,this.firstSeenItemIndex),d=this.lastSeenItemIndex;A("~ Update items ~");var c=D(n,e),m=c.prependedItemsCount,f=c.appendedItemsCount;m>=0||f>=0?(m>=0&&(A("Prepend",m,"items"),u=new Array(m).concat(u),l&&(l=new Array(m).concat(l))),f>=0&&(A("Append",f,"items"),u=u.concat(new Array(f)),l&&(l=l.concat(new Array(f)))),r+=m,o+=m,void 0!==h&&(h+=m,d+=m),s+=this.itemHeights.getAverage()*m,a+=this.itemHeights.getAverage()*f):(A("Items have changed, and it's not a simple append and/or prepend: rerender the entire list from scratch."),A("Previous items",n),A("New items",e),h=void 0,d=void 0,u=new Array(e.length),l=new Array(e.length),0===e.length?(r=void 0,o=void 0):(r=0,o=this.getLastShownItemIndex(r,e.length)),s=0,a=0),A("First shown item index",r),A("Last shown item index",o),A("Before items height",s),A("After items height (actual or estimated)",a),this.onBeforeShowItems(e,r,o,h,d),this.preserveScrollPositionOnPrependItems=t.preserveScrollPositionOnPrependItems||t.preserveScrollPosition,this.setState({items:e,itemStates:l,itemHeights:u,firstShownItemIndex:r,lastShownItemIndex:o,beforeItemsHeight:s,afterItemsHeight:a})}},{key:"getItemElement",value:function(e){return this.getContainerElement().childNodes[e]}}])&&B(t.prototype,n),i&&B(t,i),e}()});
//# sourceMappingURL=virtual-scroller.js.map
