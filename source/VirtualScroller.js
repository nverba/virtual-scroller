// For some weird reason, in Chrome, `setTimeout()` would lag up to a second (or more) behind.
// Turns out, Chrome developers have deprecated `setTimeout()` API entirely without asking anyone.
// Replacing `setTimeout()` with `requestAnimationFrame()` can work around that Chrome bug.
// https://github.com/bvaughn/react-virtualized/issues/722
import { setTimeout, clearTimeout } from 'request-animation-frame-timeout'

import ScrollableContainer, {
	ScrollableWindowContainer
} from './ScrollableContainer'

import {
	supportsTbody,
	reportTbodyIssue,
	addTbodyStyles,
	setTbodyPadding
} from './tbody'

import ItemHeights from './ItemHeights'
import { clearElement } from './DOM'
import log, { isDebug } from './log'
import { debounce } from './utility'
import shallowEqual from './shallowEqual'

const WATCH_CONTAINER_ELEMENT_TOP_COORDINATE_INTERVAL = 500
const WATCH_CONTAINER_ELEMENT_TOP_COORDINATE_MAX_DURATION = 3000
const SCROLLABLE_CONTAINER_RESIZE_DEBOUNCE_INTERVAL = 250
const WAIT_FOR_USER_TO_STOP_SCROLLING_TIMEOUT = 100

export default class VirtualScroller {
	/**
	 * @param  {function} getContainerNode — Returns container DOM `Element`.
	 * @param  {any[]} items — Are only used for getting items count and for comparing "previous" items to "next" items if `.setItems(newItems)` is called.
	 * @param  {Object} [options] — See README.md.
	 * @return {VirtualScroller}
	 */
	constructor(
		getContainerNode,
		items,
		options = {}
	) {
		const {
			getState,
			setState,
			onStateChange,
			customState,
			preserveScrollPositionAtBottomOnMount,
			shouldUpdateLayoutOnWindowResize,
			measureItemsBatchSize,
			// `getScrollableContainer` option is deprecated.
			// Use `scrollableContainer` instead.
			getScrollableContainer,
			tbody,
			// bypassBatchSize
		} = options

		let {
			bypass,
			// margin,
			estimatedItemHeight,
			// getItemState,
			onItemFirstRender,
			scrollableContainer,
			state
		} = options

		log('~ Initialize ~')

		// If `state` is passed then use `items` from `state`
		// instead of the `items` argument.
		if (state) {
			items = state.items
		}

		// `getScrollableContainer` option is deprecated.
		// Use `scrollableContainer` instead.
		if (!scrollableContainer && getScrollableContainer) {
			scrollableContainer = getScrollableContainer()
		}
		if (scrollableContainer) {
			this.scrollableContainer = new ScrollableContainer(scrollableContainer)
		} else if (typeof window !== 'undefined') {
			this.scrollableContainer = new ScrollableWindowContainer()
		}

		// if (margin === undefined) {
		// 	// Renders items which are outside of the screen by this "margin".
		// 	// Is the screen height by default: seems to be the optimal value
		// 	// for "Page Up" / "Page Down" navigation and optimized mouse wheel scrolling.
		// 	margin = typeof window === 'undefined' ? 0 : this.scrollableContainer.getHeight()
		// }

		// Work around `<tbody/>` not being able to have `padding`.
		// https://gitlab.com/catamphetamine/virtual-scroller/-/issues/1
		if (tbody) {
			log('~ <tbody/> detected ~')
			this.tbody = true
			if (!supportsTbody()) {
				log('~ <tbody/> not supported ~')
				reportTbodyIssue()
				bypass = true
			}
		}

		if (bypass) {
			log('~ "bypass" mode ~')
		}

		// In `bypass` mode, `VirtualScroller` doesn't wait
		// for the user to scroll down to render all items:
		// instead, it renders all items right away, as if
		// the list is rendered without using `VirtualScroller`.
		// It was added just to measure how much is the
		// performance difference between using a `VirtualScroller`
		// and not using a `VirtualScroller`.
		// It turned out that unmounting large React component trees
		// is a very long process, so `VirtualScroller` does seem to
		// make sense when used in a React application.
		this.bypass = bypass
		// this.bypassBatchSize = bypassBatchSize || 10

		this.initialItems = items
		// this.margin = margin

		this.estimatedItemHeight = estimatedItemHeight
		// this.getItemState = getItemState

		this._shouldUpdateLayoutOnWindowResize = shouldUpdateLayoutOnWindowResize
		this.measureItemsBatchSize = measureItemsBatchSize === undefined ? 50 : measureItemsBatchSize

		if (onItemFirstRender) {
			this.onItemFirstRender = onItemFirstRender
		}

		// Remove any accidental text nodes from container (like whitespace).
    // Also guards against cases when someone accidentally tries
    // using `VirtualScroller` on a non-empty element.
		if (getContainerNode()) {
			clearElement(getContainerNode())
		}

		if (setState) {
			this.getState = getState
			this.setState = setState
		} else {
			this.getState = () => this.state
			this.setState = (state, callback) => {
				const prevState = this.state
				this.state = {
					...prevState,
					...state
				}
				if (!shallowEqual(this.state, prevState)) {
					if (onStateChange) {
						onStateChange(this.state, prevState)
					}
					if (this.isMounted) {
						this.onUpdate(prevState)
					}
				}
				if (callback) {
					callback()
				}
			}
		}

		if (state) {
			log('Initial state (passed)', state)
		}

		this.getContainerNode = getContainerNode
		this.itemHeights = new ItemHeights(getContainerNode, this.getState)

		if (this.scrollableContainer) {
			if (preserveScrollPositionAtBottomOnMount) {
				this.preserveScrollPositionAtBottomOnMount = {
					scrollableContainerContentHeight: this.scrollableContainer.getContentHeight()
				}
			}
		}

		this.setState(state || this.getInitialState(customState), () => {
			this.itemHeights.onInitItemHeights()
		})

		log('Items count', items.length)
		if (estimatedItemHeight) {
			log('Estimated item height', estimatedItemHeight)
		}
	}

	/**
	 * Returns the initial state of the `VirtualScroller`.
	 * @param  {object} [customState] — Any additional "custom" state may be stored in `VirtualScroller`'s state. For example, React implementation stores item "refs" as "custom" state.
	 * @return {object}
	 */
	getInitialState(customState) {
		const itemsCount = this.initialItems.length
		const state = {
			...customState,
			...this.getInitialLayoutState(),
			items: this.initialItems,
			itemStates: new Array(itemsCount)
		}
		log('Initial state (autogenerated)', state)
		log('First shown item index', state.firstShownItemIndex)
		log('Last shown item index', state.lastShownItemIndex)
		return state
	}

	getInitialLayoutState() {
		let firstShownItemIndex
		let lastShownItemIndex
		const itemsCount = this.initialItems.length
		// If there're no items then `firstShownItemIndex` stays `undefined`.
		if (itemsCount > 0) {
			firstShownItemIndex = 0
			lastShownItemIndex = this.getLastShownItemIndex(firstShownItemIndex, itemsCount)
		}
		if (this.preserveScrollPositionAtBottomOnMount) {
			firstShownItemIndex = 0
			lastShownItemIndex = itemsCount - 1
		}
		// Optionally preload items to be rendered.
		this.onBeforeShowItems(firstShownItemIndex, lastShownItemIndex)
		return {
			itemHeights: new Array(itemsCount),
			itemSpacing: undefined,
			beforeItemsHeight: 0,
			afterItemsHeight: 0,
			firstShownItemIndex,
			lastShownItemIndex,
			scrollY: undefined
		}
	}

	/**
	 * Returns estimated list item height.
	 * (depends on which items have been previously rendered and measured).
	 * @return {number}
	 */
	getEstimatedItemHeight() {
		return this.itemHeights && this.itemHeights.getAverage() || this.estimatedItemHeight || 0
	}

	getItemSpacing() {
		return this.getState() && this.getState().itemSpacing || 0
	}

	getEstimatedItemsCount(height) {
		if (this.getEstimatedItemHeight()) {
			return Math.ceil((height + this.getItemSpacing()) / (this.getEstimatedItemHeight() + this.getItemSpacing()))
		} else {
			return 1
		}
	}

	getEstimatedItemsCountOnScreen() {
		if (this.scrollableContainer) {
			return this.getEstimatedItemsCount(this.getMargin() * 2 + this.scrollableContainer.getHeight())
		} else {
			return 1
		}
	}

	getLastShownItemIndex(firstShownItemIndex, itemsCount) {
		if (this.bypass) {
			return itemsCount - 1
		}
		return Math.min(
			firstShownItemIndex + (this.getEstimatedItemsCountOnScreen() - 1),
			itemsCount - 1
		)
	}

	getItemsCount() {
		return this.getState().items.length
	}

	getMargin() {
		// Renders items that are outside of the screen by this "margin".
		// Is the screen height by default: seems to be the optimal value
		// for "Page Up" / "Page Down" navigation and optimized mouse wheel scrolling.
		return this.scrollableContainer.getHeight()
	}

	onBeforeShowItems(firstShownItemIndex, lastShownItemIndex) {
		if (this.onItemFirstRender) {
			if (this.firstSeenItemIndex === undefined) {
				let i = firstShownItemIndex
				while (i <= lastShownItemIndex) {
					this.onItemFirstRender(i)
					i++
				}
				this.firstSeenItemIndex = firstShownItemIndex
				this.lastSeenItemIndex = lastShownItemIndex
			} else {
				// The library is designed in such a way that
				// `[firstShownItemIndex, lastShownItemIndex]` always intersects
				// (or touches or contains or is contained by)
				// `[this.firstSeenItemIndex, this.lastSeenItemIndex]`.
				if (firstShownItemIndex < this.firstSeenItemIndex) {
					const fromIndex = firstShownItemIndex
					const toIndex = Math.min(lastShownItemIndex, this.firstSeenItemIndex - 1)
					let i = fromIndex
					while (i <= toIndex) {
						this.onItemFirstRender(i)
						i++
					}
					this.firstSeenItemIndex = firstShownItemIndex
				}
				if (lastShownItemIndex > this.lastSeenItemIndex) {
					const toIndex = lastShownItemIndex
					const fromIndex = Math.max(firstShownItemIndex, this.lastSeenItemIndex + 1)
					let i = fromIndex
					while (i <= toIndex) {
						this.onItemFirstRender(i)
						i++
					}
					this.lastSeenItemIndex = lastShownItemIndex
				}
			}
		}
	}

	onMount() {
		// `this.isMounted = true` should be the first statement in this function,
		// because otherwise `DOMVirtualScroller` would enter an infinite re-render loop
		// if `this.onInitialRender('mount')` is called before setting `this.isMounted` to `true`.
		this.isMounted = true
		this.onInitialRender('mount')
		this.scrollableContainerWidth = this.scrollableContainer.getWidth()
		this.scrollableContainerHeight = this.scrollableContainer.getHeight()
		this.restoreScrollPosition()
		this.updateScrollPosition()
		this.removeScrollPositionListener = this.scrollableContainer.addScrollListener(this.updateScrollPosition)
		if (!this.bypass) {
			this.removeScrollListener = this.scrollableContainer.addScrollListener(this.onScroll)
			this.scrollableContainerUnlistenResize = this.scrollableContainer.onResize(this.onResize)
		}
		// Work around `<tbody/>` not being able to have `padding`.
		// https://gitlab.com/catamphetamine/virtual-scroller/-/issues/1
		if (this.tbody) {
			addTbodyStyles(this.getContainerNode())
			this.updateTbodyPadding()
		}
	}

	onInitialRender(reason) {
		const {
			firstShownItemIndex,
			lastShownItemIndex
		} = this.getState()
		log('~ Rendered (initial) ~')
		// If there're any items.
		if (this.getItemsCount() > 0) {
			// Update item heights.
			this.updateItemHeights(
				firstShownItemIndex,
				lastShownItemIndex
			)
		}
		if (this.preserveScrollPositionAtBottomOnMount) {
			this.scrollTo(0, this.getScrollY() + (this.scrollableContainer.getHeight() - this.preserveScrollPositionAtBottomOnMount.scrollableContainerContentHeight))
		} else {
			this.onUpdateShownItemIndexes({ reason })
		}
	}

	updateLayout = () => this.onUpdateShownItemIndexes({ reason: 'manual' })
	onScroll = () => this.onUpdateShownItemIndexes({ reason: 'scroll' })

	/**
	 * Restores page scroll Y on `VirtualScroller` mount
	 * if a previously captured `VirtualScroller` `state` was passed.
	 */
	restoreScrollPosition = () => {
		const { scrollY } = this.getState()
		if (scrollY !== undefined) {
			this.scrollTo(0, scrollY)
		}
	}

	updateScrollPosition = () => this.getState().scrollY = this.getScrollY()

	// `.layout()` method name is deprecated, use `.updateLayout()` instead.
	layout = () => this.updateLayout()

	scrollTo(scrollX, scrollY) {
		this.scrollableContainer.scrollTo(scrollX, scrollY)
	}

	getScrollY() {
		return this.scrollableContainer.getScrollY()
	}

	/**
	 * Returns visible area coordinates relative to the scrollable container.
	 * @return {object} `{ top: number, bottom: number }`
	 */
	getVisibleAreaBounds() {
		const scrollY = this.getScrollY()
		return {
			// The first pixel of the screen.
			top: scrollY,
			// The pixel after the last pixel of the screen.
			bottom: scrollY + this.scrollableContainer.getHeight()
		}
	}

	/**
	 * Returns list height.
	 * @return {number}
	 */
	getHeight() {
		return this.getContainerNode().getBoundingClientRect().height
	}

	/**
	 * Returns list top coordinate relative to the scrollable container.
	 * @return {number}
	 */
	getTopOffset() {
		return this.scrollableContainer.getTopOffset(this.getContainerNode())
	}

	shouldUpdateLayoutOnScrollableContainerResize(event) {
		if (event && event.target === window) {
			// By default, `VirtualScroller` always performs a re-layout
			// on window `resize` event. But browsers (Chrome, Firefox)
			// [trigger](https://developer.mozilla.org/en-US/docs/Web/API/Window/fullScreen#Notes)
			// window `resize` event also when a user switches into fullscreen mode:
			// for example, when a user is watching a video and double-clicks on it
			// to maximize it. And also when the user goes out of the fullscreen mode.
			// Each such fullscreen mode entering/exiting will trigger window `resize`
			// event that will it turn trigger a re-layout of `VirtualScroller`,
			// resulting in bad user experience. To prevent that, such cases are filtered out.
			// Some other workaround:
			// https://stackoverflow.com/questions/23770449/embedded-youtube-video-fullscreen-or-causing-resize
			if (document.fullscreenElement && this.getContainerNode().contains(document.fullscreenElement)) {
				return false
			}
			if (this._shouldUpdateLayoutOnWindowResize) {
				if (!this._shouldUpdateLayoutOnWindowResize(event)) {
					return false
				}
			}
		}
		const prevScrollableContainerWidth = this.scrollableContainerWidth
		const prevScrollableContainerHeight = this.scrollableContainerHeight
		this.scrollableContainerWidth = this.scrollableContainer.getWidth()
		this.scrollableContainerHeight = this.scrollableContainer.getHeight()
		if (this.scrollableContainerWidth === prevScrollableContainerWidth) {
			if (this.scrollableContainerHeight === prevScrollableContainerHeight) {
				return false
			} else {
				this.onUpdateShownItemIndexes({ reason: 'resize' })
				return false
			}
		} else {
			return true
		}
	}

	/**
	 * On scrollable container resize.
	 * @param  {Event} [event] — DOM resize event.
	 */
	onResize = debounce((event) => {
		// If `VirtualScroller` has been unmounted
		// while `setTimeout()` was waiting, then exit.
		if (!this.isMounted) {
			return
		}
		if (this.shouldUpdateLayoutOnScrollableContainerResize(event)) {
			// Reset item heights because if scrollable container's width (or height)
			// has changed, the list width (or height) most likely also has changed,
			// and also some CSS `@media()` rules might have been added or removed.
			// Re-render the list entirely.
			log('~ Scrollable container size changed, re-measure item heights. ~')
			this.setState(this.getInitialLayoutState(), () => {
				this.onInitialRender('resize')
			})
		}
	}, SCROLLABLE_CONTAINER_RESIZE_DEBOUNCE_INTERVAL)

	onUnmount() {
		this.isMounted = false
		this.removeScrollPositionListener()
		if (!this.bypass) {
			this.removeScrollListener()
			this.scrollableContainerUnlistenResize()
			// this.untrackScrollableContainer
			clearTimeout(this.onUserStopsScrollingTimeout)
			clearTimeout(this.watchContainerElementCoordinatesTimer)
		}
	}

	onUpdate(prevState) {
		const {
			items,
			firstShownItemIndex,
			lastShownItemIndex
		} = this.getState()
		log('~ Rendered ~')
		// If new items are shown (or older items are hidden).
		if (firstShownItemIndex !== prevState.firstShownItemIndex ||
			lastShownItemIndex !== prevState.lastShownItemIndex ||
			items !== prevState.items) {
			// // If some items' height changed then maybe adjust scroll position accordingly.
			// const prevItemHeights = this.getState().itemHeights.slice()
			// Update seen item heights.
			this.updateItemHeights(
				firstShownItemIndex,
				lastShownItemIndex
			)
			// let i = firstShownItemIndex
			// while (i <= lastShownItemIndex) {
			// 	this.adjustScrollPositionIfNeeded(i, prevItemHeights[i])
			// 	i++
			// }
			if (this.tbody) {
				this.updateTbodyPadding()
			}
		}
	}

  /**
   * Is part of a workaround for `<tbody/>` not being able to have `padding`.
   * https://gitlab.com/catamphetamine/virtual-scroller/-/issues/1
   * CSS variables aren't supported in Internet Explorer.
   */
	updateTbodyPadding() {
		const { beforeItemsHeight, afterItemsHeight } = this.getState()
		setTbodyPadding(this.getContainerNode(), beforeItemsHeight, afterItemsHeight)
	}

	updateItemHeights(fromIndex, toIndex) {
		const {
			firstShownItemIndex
		} = this.getState()
		if (fromIndex !== undefined) {
			log('~ Measure item heights ~')
			this.itemHeights.update(
				fromIndex,
				toIndex,
				firstShownItemIndex
			)
			if (isDebug()) {
				log('Item heights', this.getState().itemHeights.slice())
			}
		}
	}

	updateItemHeight(i) {
		const { firstShownItemIndex } = this.getState()
		this.itemHeights.updateItemHeight(i, firstShownItemIndex)
	}

	onItemStateChange(i, itemState) {
		if (isDebug()) {
			log('~ Item state changed ~')
			log('Item', i)
			log('Previous state' + '\n' + JSON.stringify(this.getState().itemStates[i], null, 2))
			log('New state' + '\n' + JSON.stringify(itemState, null, 2))
		}
		this.getState().itemStates[i] = itemState
	}

	onItemHeightChange(i) {
		const { itemHeights } = this.getState()
		const previousHeight = itemHeights[i]
		this.updateItemHeight(i)
		const newHeight = itemHeights[i]
		if (previousHeight !== newHeight) {
			log('~ Item height changed ~')
			log('Item', i)
			log('Previous height', previousHeight)
			log('New height', newHeight)
			this.onUpdateShownItemIndexes({ reason: 'item height change' })
		}
	}

	/**
	 * Returns coordinates of item with index `i` relative to the document.
	 * `top` is the top offset of the item relative to the start of the document.
	 * `bottom` is the top offset of the item's bottom edge relative to the start of the document.
	 * `height` is the item's height.
	 * @param  {number} i
	 * @return {object} coordinates — An object of shape `{ top, bottom, height }`.
	 */
	getItemCoordinates(i) {
		let top = this.getTopOffset()
		let j = 0
		while (j < i) {
			top += this.getState().itemHeights[j]
			top += this.getItemSpacing()
			j++
		}
		return {
			top,
			bottom: top + this.getState().itemHeights[i],
			height: this.getState().itemHeights[j]
		}
	}

	// Finds the items which are displayed in the viewport.
	getVisibleItemIndexes(visibleAreaTop, visibleAreaBottom, listTopOffset) {
		let firstShownItemIndex
		let lastShownItemIndex
		let itemsHeight = 0
		let firstNonMeasuredItemIndex
		let redoLayoutAfterRender = false
		let i = 0
		while (i < this.getItemsCount()) {
			const height = this.itemHeights.get(i)
			// If an item that hasn't been shown (and measured) yet is encountered
			// then show such item and then retry after it has been measured.
			if (height === undefined) {
				log(`Item index ${i} lies within the visible area or its "margins", but its height hasn't been measured yet. Mark the item as "shown", render the list, measure the item's height and redo the layout.`)
				firstNonMeasuredItemIndex = i
				if (firstShownItemIndex === undefined) {
					firstShownItemIndex = i
				}
				const heightLeft = visibleAreaBottom - (listTopOffset + itemsHeight)
				lastShownItemIndex = Math.min(
					i + (this.getEstimatedItemsCount(heightLeft) - 1),
					// Guard against index overflow.
					this.getItemsCount() - 1
				)
				redoLayoutAfterRender = true
				break
			}
			itemsHeight += height
			// If this is the first item visible
			// then start showing items from it.
			if (firstShownItemIndex === undefined) {
				if (listTopOffset + itemsHeight > visibleAreaTop) {
					log('First visible item index', i)
					firstShownItemIndex = i
				}
			}
			// Items can have spacing.
			if (i < this.getItemsCount() - 1) {
				itemsHeight += this.getItemSpacing()
			}
			// If this item is the last one visible in the viewport then exit.
			if (listTopOffset + itemsHeight > visibleAreaBottom) {
				log('Last visible item index', i)
				// The list height is estimated until all items have been seen,
				// so it's possible that even when the list DOM element happens
				// to be in the viewport in reality the list isn't visible
				// in which case `firstShownItemIndex` will be `undefined`.
				if (firstShownItemIndex !== undefined) {
					lastShownItemIndex = i
				}
				break
			}
			i++
		}
		// If there're no more items then the last item is the last one to show.
		if (firstShownItemIndex !== undefined && lastShownItemIndex === undefined) {
			lastShownItemIndex = this.getItemsCount() - 1
			log('Last item index (is fully visible)', lastShownItemIndex)
		}
		// If scroll position is scheduled to be restored after render
		// then the anchor item must be rendered, and all the prepended
		// items before it, all in a single pass. This way, all the
		// prepended items could be measured right after the render
		// and the scroll position can then be immediately restored.
		if (this.restoreScrollAfterPrepend) {
			if (lastShownItemIndex < this.restoreScrollAfterPrepend.index) {
				lastShownItemIndex = this.restoreScrollAfterPrepend.index
			}
			// `firstShownItemIndex` is always `0` when prepending items.
			// And `lastShownItemIndex` always covers all prepended items in this case.
			// None of the prepended items have been rendered before,
			// so their heights are unknown. The code at the start of this function
			// did therefore set `redoLayoutAfterRender` to `true`
			// in order to render just the first prepended item in order to
			// measure it, and only then make a decision on how many other
			// prepended items to render. But since we've instructed the code
			// to show all of the prepended items at once, then no need to
			// "redo layout after render". Additionally, if `redoLayoutAfterRender`
			// was left `true` then there would be a short the visual "jitter"
			// happening due to scroll position restoration waiting for two
			// layout cycles instead of one.
			redoLayoutAfterRender = false
		}
		// If some items will be rendered in order to measure their height,
		// and it's not a `preserveScrollPositionOnPrependItems` case,
		// then limit the amount of such items being measured in a single pass.
		if (redoLayoutAfterRender && this.measureItemsBatchSize) {
			lastShownItemIndex = Math.min(lastShownItemIndex, firstNonMeasuredItemIndex + this.measureItemsBatchSize - 1)
		}
		return {
			firstShownItemIndex,
			lastShownItemIndex,
			redoLayoutAfterRender
		}
	}

	getOffscreenListShownItemIndexes() {
		return {
			firstShownItemIndex: 0,
			lastShownItemIndex: 0,
			redoLayoutAfterRender: this.itemHeights.get(0) === undefined
		}
	}

	getItemIndexes(visibleAreaTop, visibleAreaBottom, listTopOffset, listHeight) {
		const isVisible = listTopOffset + listHeight > visibleAreaTop && listTopOffset < visibleAreaBottom
		if (!isVisible) {
			log('Off-screen')
			return
		}
		// Find the items which are displayed in the viewport.
		const indexes = this.getVisibleItemIndexes(visibleAreaTop, visibleAreaBottom, listTopOffset)
		// The list height is estimated until all items have been seen,
		// so it's possible that even when the list DOM element happens
		// to be in the viewport, in reality the list isn't visible
		// in which case `firstShownItemIndex` will be `undefined`.
		if (indexes.firstShownItemIndex === undefined) {
			log('Off-screen')
			return
		}
		return indexes
	}

	/**
	 * Measures "before" items height.
	 * @param  {number} firstShownItemIndex — New first shown item index.
	 * @param  {number} lastShownItemIndex — New last shown item index.
	 * @return {number}
	 */
	getBeforeItemsHeight(firstShownItemIndex, lastShownItemIndex) {
		let beforeItemsHeight = 0
		// Add all "before" items height.
		let i = 0
		while (i < firstShownItemIndex) {
			beforeItemsHeight += (this.itemHeights.get(i) || this.itemHeights.getAverage())
			beforeItemsHeight += this.getItemSpacing()
			i++
		}
		return beforeItemsHeight
	}

	/**
	 * Measures "after" items height.
	 * @param  {number} firstShownItemIndex — New first shown item index.
	 * @param  {number} lastShownItemIndex — New last shown item index.
	 * @return {number}
	 */
	getAfterItemsHeight(firstShownItemIndex, lastShownItemIndex) {
		let afterItemsHeight = 0
		let i = lastShownItemIndex + 1
		// Add all "after" items height.
		while (i < this.getItemsCount()) {
			afterItemsHeight += this.getItemSpacing()
			afterItemsHeight += (this.itemHeights.get(i) || this.itemHeights.getAverage())
			i++
		}
		return afterItemsHeight
	}

	/**
	 * Updates the heights of items to be hidden on next render.
	 * For example, a user could click a "Show more" button,
	 * or an "Expand YouTube video" button, which would result
	 * in the list item height changing and `this.itemHeights[i]`
	 * being stale, so it's updated here when hiding the item.
	 */
	updateWillBeHiddenItemHeightsAndState(firstShownItemIndex, lastShownItemIndex) {
		let i = this.getState().firstShownItemIndex
		while (i <= this.getState().lastShownItemIndex) {
			if (i >= firstShownItemIndex && i <= lastShownItemIndex) {
				// The item's still visible.
			} else {
				// Update item's height before hiding it
				// because the height of the item may have changed
				// while it was visible.
				this.updateItemHeight(i)
				// // Update item's state because it's about to be hidden.
				// if (this.getItemState) {
				// 	this.getState().itemStates[i] = this.getItemState(
				// 		this.getState().items[i],
				// 		i,
				// 		this.getState().items
				// 	)
				// }
			}
			i++
		}
	}

	// `VirtualScroller` calls `getShownItemIndexes()` on mount
	// but if the page styles are applied after `VirtualScroller` mounts
	// (for example, if styles are applied via javascript, like Webpack does)
	// then the list might not render correctly and will only show the first item.
	// The reason for that would be that calling `.getBoundingClientRect()`
	// on the list container element on mount returned "incorrect" `top` position
	// because the styles haven't been applied yet.
	// For example, consider a page:
	// <div class="page">
	//   <nav class="sidebar">...</nav>
	//   <main>...</main>
	// </div>
	// The sidebar is styled as `position: fixed`, but until
	// the page styles have been applied it's gonna be a regular `<div/>`
	// meaning that `<main/>` will be rendered below the sidebar
	// and will appear offscreen and so it will only render the first item.
	// Then, the page styles are loaded and applied and the sidebar
	// is now `position: fixed` so `<main/>` is now rendered at the top of the page
	// but `VirtualScroller`'s `onMount()` has already been called
	// and it won't re-render until the user scrolls or the window is resized.
	// This type of a bug doesn't occur in production, but it can appear
	// in development mode when using Webpack. The workaround `VirtualScroller`
	// implements for such cases is calling `.getBoundingClientRect()` on the
	// list container DOM element periodically (every second) to check if the
	// `top` coordinate has changed as a result of CSS being applied:
	// if it has then it recalculates the shown item indexes.
	watchContainerElementCoordinates() {
		const startedAt = Date.now()
		const check = () => {
			// If `VirtualScroller` has been unmounted
			// while `setTimeout()` was waiting, then exit.
			if (!this.isMounted) {
				return
			}
			// Skip comparing `top` coordinate of the list
			// when this function is called the first time.
			if (this.topOffset !== undefined) {
				// Calling `this.getTopOffset()` on an element is about
				// 0.003 milliseconds on a modern desktop CPU,
				// so I guess it's fine calling it twice a second.
				const topOffset = this.getTopOffset()
				if (topOffset !== this.topOffset) {
					this.onUpdateShownItemIndexes({ reason: 'top offset change' })
				}
			}
			// Compare `top` coordinate of the list twice a second
			// to find out if it has changed as a result of loading CSS styles.
			// The total duration of 3 seconds would be enough for any styles to load, I guess.
			// There could be other cases changing the `top` coordinate
			// of the list (like collapsing an "accordeon" panel above the list
			// without scrolling the page), but those cases should be handled
			// by manually calling `.updateLayout()` instance method on `VirtualScroller` instance.
			if (Date.now() - startedAt < WATCH_CONTAINER_ELEMENT_TOP_COORDINATE_MAX_DURATION) {
				this.watchContainerElementCoordinatesTimer = setTimeout(check, WATCH_CONTAINER_ELEMENT_TOP_COORDINATE_INTERVAL)
			}
		}
		// Run the cycle.
		check()
	}

	/**
	 * Finds the items that are displayed in the viewport.
	 * @return {object} `{ firstShownItemIndex: number, lastShownItemIndex: number, redoLayoutAfterRender: boolean }`
	 */
	getShownItemIndexes() {
		if (this.bypass) {
			return {
				firstShownItemIndex: 0,
				lastShownItemIndex: this.getItemsCount() - 1
			}
			// This code emulates batch loading in bypass mode.
			// const { firstShownItemIndex } = this.getState()
			// let { lastShownItemIndex } = this.getState()
			// lastShownItemIndex = Math.min(
			// 	lastShownItemIndex + this.bypassBatchSize,
			// 	this.getItemsCount() - 1
			// )
			// return {
			// 	firstShownItemIndex,
			// 	lastShownItemIndex,
			// 	// Redo layout until all items are rendered.
			// 	redoLayoutAfterRender: lastShownItemIndex < this.getItemsCount() - 1
			// }
		}
		// // A minor optimization. Just because I can.
		// let topOffset
		// if (this.topOffsetCached !== undefined) {
		// 	topOffset = this.topOffsetCached
		// 	this.topOffsetCached = undefined
		// } else {
		// 	topOffset = this.getTopOffset()
		// }
		const topOffset = this.getTopOffset()
		// `this.topOffset` is not used for any "caching",
		// it's only used in `this.watchContainerElementCoordinates()` method.
		if (this.topOffset === undefined) {
			// See the comments for `watchContainerElementCoordinates()` method
			// for the rationale on why it's here.
			this.watchContainerElementCoordinates()
		}
		this.topOffset = topOffset
		const { top: visibleAreaTop, bottom: visibleAreaBottom } = this.getVisibleAreaBounds()
		// Set screen top and bottom for current layout.
		this.latestLayoutVisibleAreaTopAfterIncludingMargin = visibleAreaTop - this.getMargin()
		this.latestLayoutVisibleAreaBottomAfterIncludingMargin = visibleAreaBottom + this.getMargin()
		// For scrollable containers, this function could not only check
		// the scrollable container visibility here, but also
		// adjust `visibleAreaTop` and `visibleAreaBottom`
		// because some parts of the scrollable container
		// could be off the screen and therefore not actually visible.
		// That would also involve somehow fixing the "should rerender on scroll"
		// function, because currently it only checks the scrollable container's
		// `this.getScrollY()` and compares it to the latest `visibleAreaTop` and `visibleAreaBottom`,
		// so if those "actual visibility" adjustments were applied, they would have to
		// be somehow accounted for in that "should rerender on scroll" function.
		// Overall, I suppose that such "actual visibility" feature would be
		// a very minor optimization and not something I'd deal with.
		// Find the items that are displayed in the viewport.
		return this.getItemIndexes(
			visibleAreaTop - this.getMargin(),
			visibleAreaBottom + this.getMargin(),
			topOffset,
			this.getHeight()
		) || this.getOffscreenListShownItemIndexes()
	}

	/**
	 * Updates the "from" and "to" shown item indexes.
	 * `callback(redoLayoutAfterRender)` is called after it re-renders.
	 * If the list is visible and some of the items being shown are new
	 * and required to be measured first then `redoLayoutAfterRender` is `true`.
	 * If the list is visible and all items being shown have been encountered
	 * (and measured) before then `redoLayoutAfterRender` is `false`.
	 * @param {Function} callback
	 */
	updateShownItemIndexes = (callback) => {
		// Find the items which are displayed in the viewport.
		const {
			firstShownItemIndex,
			lastShownItemIndex,
			redoLayoutAfterRender
		} = this.getShownItemIndexes()
		// Measure "before" items height.
		const beforeItemsHeight = this.getBeforeItemsHeight(firstShownItemIndex, lastShownItemIndex)
		// Measure "after" items height.
		const afterItemsHeight = this.getAfterItemsHeight(firstShownItemIndex, lastShownItemIndex)
		// Update the heights of items to be hidden on next render.
		// For example, a user could click a "Show more" button,
		// or an "Expand YouTube video" button, which would result
		// in the list item height changing and `this.itemHeights[i]`
		// being stale, so it's updated here when hiding the item.
		this.updateWillBeHiddenItemHeightsAndState(firstShownItemIndex, lastShownItemIndex)
		// Debugging.
		log('~ Layout results ' + (this.bypass ? '(bypass) ' : '') + '~')
		log('First shown item index', firstShownItemIndex)
		log('Last shown item index', lastShownItemIndex)
		log('Before items height', beforeItemsHeight)
		log('After items height (actual or estimated)', afterItemsHeight)
		log('Average item height (calculated on previous render)', this.itemHeights.getAverage())
		if (isDebug()) {
			log('Item heights', this.getState().itemHeights.slice())
			log('Item states', this.getState().itemStates.slice())
		}
		if (redoLayoutAfterRender) {
			log('Schedule a re-layout after the upcoming rerender')
		}
		// The page could be scrolled up, to any scroll position,
		// for example, via "Home" key, resulting in `lastShownItemIndex`
		// being less than `this.firstSeenItemIndex`.
		// `firstShownItemIndex` can't be greater than `this.lastSeenItemIndex`
		// in the current design of this library, but just in case.
		if (this.firstSeenItemIndex !== undefined) {
			if (firstShownItemIndex > this.lastSeenItemIndex + 1 ||
				lastShownItemIndex < this.firstSeenItemIndex - 1) {
				// Reset "seen" indexes.
				this.firstSeenItemIndex = undefined
				this.lastSeenItemIndex = undefined
			}
		}
		// Optionally preload items to be rendered.
		this.onBeforeShowItems(firstShownItemIndex, lastShownItemIndex)
		// Render.
		this.setState({
			firstShownItemIndex,
			lastShownItemIndex,
			beforeItemsHeight,
			afterItemsHeight,
			// // Average item height is stored in state to differentiate between
			// // the initial state and "anything has been measured already" state.
			// averageItemHeight: this.itemHeights.getAverage()
		}, () => callback(redoLayoutAfterRender))
	}

	updateShownItemIndexesRecursive = () => {
		this.updateShownItemIndexes((redoLayoutAfterRender) => {
			if (redoLayoutAfterRender) {
				// Recurse in a timeout to prevent React error:
				// "Maximum update depth exceeded.
				//  This can happen when a component repeatedly calls
				//  setState inside componentWillUpdate or componentDidUpdate.
				//  React limits the number of nested updates to prevent infinite loops."
				setTimeout(() => {
					if (this.isMounted) {
						this.updateShownItemIndexesRecursive()
					} else {
						this.onDoneUpdatingItemIndexes()
					}
				}, 0)
			} else {
				this.onDoneUpdatingItemIndexes()
			}
		})
	}

	onDoneUpdatingItemIndexes() {
		this.isUpdatingItemIndexes = false
		if (this.restoreScrollAfterPrepend) {
			this.restoreScroll()
		}
	}

	captureScroll(previousItems, nextItems, firstPreviousItemIndex) {
		// If there were no items in the list
		// then there's no point in restoring scroll position.
		if (previousItems.length === 0) {
			return
		}
		if (firstPreviousItemIndex === undefined) {
			firstPreviousItemIndex = nextItems.indexOf(previousItems[0])
		}
		// If the items update wasn't incremental
		// then there's no point in restoring scroll position.
		if (firstPreviousItemIndex < 0) {
			return
		}
		// If no items were prepended then no need to restore scroll position.
		if (firstPreviousItemIndex === 0) {
			return
		}
		// The first item DOM Element must be rendered in order to get its top position.
		if (this.getState().firstShownItemIndex > 0) {
			return
		}
		// If the scroll position for these `previousItems` -> `nextItems`
		// has already been captured then skip.
		// This could happen when using `<ReactVirtualScroller/>`
		// because it calls `.captureScroll()` inside `.render()`
		// which is followed by `<VirtualScroller/>`'s `.componentDidUpdate()`
		// which also calls `.captureScroll()` with the same arguments.
		// (this is done to prevent scroll Y position from jumping
		//  when showing the first page of the "Previous items",
		//  see the comments in `<ReactVirtualScroller/>`'s `.render()` method).
		if (this.restoreScrollAfterPrepend &&
			this.restoreScrollAfterPrepend.previousItems === previousItems &&
			this.restoreScrollAfterPrepend.nextItems === nextItems) {
			return
		}
		this.restoreScrollAfterPrepend = {
			previousItems,
			nextItems,
			index: firstPreviousItemIndex,
			visibleAreaTop: this.getItemElement(0).getBoundingClientRect().top
		}
	}

	restoreScroll = () => {
		const { index, visibleAreaTop } = this.restoreScrollAfterPrepend
		this.restoreScrollAfterPrepend = undefined
		const newVisibleAreaTop = this.getItemElement(index).getBoundingClientRect().top
		const scrollByY = newVisibleAreaTop - visibleAreaTop
		if (scrollByY !== 0) {
			log('Restore scroll position: scroll by', scrollByY)
			this.scrollTo(0, this.getScrollY() + scrollByY)
		}
	}

	// This turned out to not work so well:
	// scrolling becomes "janky" with this feature turned on
	// when there're items whose height did change while they were hidden.
	// adjustScrollPositionIfNeeded(i, prevItemHeight) {
	// 	const itemHeight = this.getState().itemHeights[i]
	// 	if (itemHeight !== prevItemHeight) {
	// 		const { bottom } = this.getItemCoordinates(i)
	// 		const scrollY = this.getScrollY()
	// 		const horizonLine = scrollY + this.scrollableContainer.getHeight() / 2
	// 		if (bottom < horizonLine) {
	// 			this.scrollTo(0, scrollY + (itemHeight - prevItemHeight))
	// 		}
	// 	}
	// }

	onUpdateShownItemIndexes = ({ reason, force }) => {
		// Not implementing the "delayed" layout feature for now.
		// if (this.delayLayout({ reason, force })) {
		// 	return
		// }
		//
		// If there're no items then no need to calculate the layout:
		// if empty `items` have been set on `state` then it has rendered nothing.
		if (this.getItemsCount() === 0) {
			return
		}
		// If a re-layout is already scheduled then it will happen anyway
		// for the same `state` so there's no need to start another one.
		if (this.isUpdatingItemIndexes) {
			return
		}
		// Prefer not re-rendering the list as the user's scrolling.
		// Instead, prefer delaying such re-renders until the user stops scrolling.
		//
		// If the user has scrolled then it means that they haven't
		// stopped scrolling so cancel the timeout.
		// Otherwise, a layout happens so no need for the deferred one
		// so cancel the timeout anyway.
		clearTimeout(this.onUserStopsScrollingTimeout)
		//
		if (reason === 'scroll') {
			// See whether rendering new previous/next items is required right now
			// or it can be deferred until the user stops scrolling for better perceived performance.
			// const top = this.getTopOffset()
			// const height = this.scrollableContainer.getHeight()
			// const bottom = top + height
			// const { top: visibleAreaTop, bottom: visibleAreaBottom } = this.getVisibleAreaBounds()
			// const renderedItemsTop = top + this.getState().beforeItemsHeight
			// const renderedItemsBottom = top + height - this.getState().afterItemsHeight
			// const forceRender = (visibleAreaTop < renderedItemsTop && this.getState().firstShownItemIndex > 0) ||
			// 	(visibleAreaBottom > renderedItemsBottom && this.getState().lastShownItemIndex < this.getItemsCount() - 1)
			const forceRender = (
				// If the items have been rendered at least one
				this.latestLayoutVisibleAreaTopAfterIncludingMargin !== undefined &&
					// If the user has scrolled up past the extra "margin"
					(this.getScrollY() < this.latestLayoutVisibleAreaTopAfterIncludingMargin) &&
					// and if there're any previous non-rendered items to render.
					(this.getState().firstShownItemIndex > 0)
			) || (
				// If the items have been rendered at least one
				this.latestLayoutVisibleAreaBottomAfterIncludingMargin !== undefined &&
					// If the user has scrolled down past the extra "margin"
					(this.getScrollY() + this.scrollableContainer.getHeight() > this.latestLayoutVisibleAreaBottomAfterIncludingMargin) &&
					// and if there're any next non-rendered items to render.
					(this.getState().lastShownItemIndex < this.getItemsCount() - 1)
			)
			if (forceRender) {
				log('The user has scrolled far enough: force re-render')
			} else {
				log('The user hasn\'t scrolled too much: delay re-render')
			}
			// "scroll" events are usually dispatched every 16 milliseconds
			// for the 60fps refresh rate, so waiting for 100 milliseconds
			// is about 6 frames of inactivity which would definitely mean
			// that either the user's no longer scrolling or the browser's
			// stuttering (skipping frames due to high load) anyway.
			if (!forceRender) {
				return this.onUserStopsScrollingTimeout = setTimeout(this.onUserStoppedScrolling, WAIT_FOR_USER_TO_STOP_SCROLLING_TIMEOUT)
			}
		}
		// // A minor optimization. Just because I can.
		// this.listCoordinatesCached = listCoordinates
		// Re-render the list.
		log(`~ Update layout (on ${reason}) ~`)
		this.isUpdatingItemIndexes = true
		this.updateShownItemIndexesRecursive()
	}

	onUserStoppedScrolling = () => {
		if (this.isMounted) {
			// Re-render the list.
			this.updateLayout('stopped scrolling')
		}
	}

	/**
	 * @deprecated
	 * `.updateItems()` has been renamed to `.setItems()`.
	 */
	updateItems(newItems, options) {
		return this.setItems(newItems, options)
	}

	/**
	 * Updates `items`. For example, can prepend or append new items to the list.
	 * @param  {any[]} newItems
	 * @param {boolean} [options.preserveScrollPositionOnPrependItems] — Set to `true` to enable "restore scroll position after prepending items" feature (could be useful when implementing "Show previous items" button).
	 */
	setItems(newItems, options = {}) {
		// * @param  {object} [newCustomState] — If `customState` was passed to `getInitialState()`, this `newCustomState` updates it.
		const {
			items: previousItems
		} = this.getState()
		let {
			firstShownItemIndex,
			lastShownItemIndex,
			beforeItemsHeight,
			afterItemsHeight,
			itemStates,
			itemHeights,
			itemSpacing
		} = this.getState()
		log('~ Update items ~')
		const {
			prependedItemsCount,
			appendedItemsCount
		} = getItemsDiff(previousItems, newItems)
		const isIncrementalUpdate = prependedItemsCount > 0 || appendedItemsCount > 0
		if (isIncrementalUpdate) {
			if (prependedItemsCount > 0) {
				log('Prepended items count', prependedItemsCount)
				itemHeights = new Array(prependedItemsCount).concat(itemHeights)
				this.itemHeights.onPrepend(prependedItemsCount)
				if (itemStates) {
					itemStates = new Array(prependedItemsCount).concat(itemStates)
				}
				// Since some items were prepended restore scroll Y
				// position after rendering those new items.
				// `preserveScrollPosition` property name is deprecated,
				// use `preserveScrollPositionOnPrependItems` instead.
				if (options.preserveScrollPositionOnPrependItems || options.preserveScrollPosition) {
					this.captureScroll(
						previousItems,
						newItems,
						prependedItemsCount
					)
				}
			}
			if (appendedItemsCount > 0) {
				log('Appended items count', appendedItemsCount)
				itemHeights = itemHeights.concat(new Array(appendedItemsCount))
				if (itemStates) {
					itemStates = itemStates.concat(new Array(appendedItemsCount))
				}
			}
			if (this.firstSeenItemIndex !== undefined) {
				this.firstSeenItemIndex += prependedItemsCount
				this.lastSeenItemIndex += prependedItemsCount
			}
			firstShownItemIndex += prependedItemsCount
			lastShownItemIndex += prependedItemsCount
			beforeItemsHeight += this.itemHeights.getAverage() * prependedItemsCount
			afterItemsHeight += this.itemHeights.getAverage() * appendedItemsCount
		} else {
			log('Non-incremental items update')
			log('Previous items', previousItems)
			log('New items', newItems)
			itemHeights = new Array(newItems.length)
			itemStates = new Array(newItems.length)
			this.firstSeenItemIndex = undefined
			this.lastSeenItemIndex = undefined
			if (newItems.length === 0) {
				firstShownItemIndex = undefined
				lastShownItemIndex = undefined
			} else {
				firstShownItemIndex = 0
				lastShownItemIndex = this.getLastShownItemIndex(firstShownItemIndex, newItems.length)
			}
			beforeItemsHeight = 0
			afterItemsHeight = 0
		}
		let customState
		// `newCustomState` argument is not currently being used.
		// if (newCustomState) {
		// 	if (typeof newCustomState === 'function') {
		// 		customState = newCustomState(this.getState(), {
		// 			prependedCount: isIncrementalUpdate ? undefined : prependedItemsCount,
		// 			appendedCount: isIncrementalUpdate ? undefined : appendedItemsCount
		// 		})
		// 	} else {
		// 		customState = newCustomState
		// 	}
		// }
		log('First shown item index', firstShownItemIndex)
		log('Last shown item index', lastShownItemIndex)
		log('Before items height', beforeItemsHeight)
		log('After items height (actual or estimated)', afterItemsHeight)
		// Optionally preload items to be rendered.
		this.onBeforeShowItems(firstShownItemIndex, lastShownItemIndex)
		// Render.
		this.setState({
			...customState,
			items: newItems,
			itemStates,
			itemHeights,
			firstShownItemIndex,
			lastShownItemIndex,
			beforeItemsHeight,
			afterItemsHeight
		}, () => {
			if (!isIncrementalUpdate) {
				this.itemHeights.onInitItemHeights()
			}
			this.onUpdateShownItemIndexes({
				reason: 'update items',
				force: true
			})
		})
	}

	getItemElement(i) {
		return this.getContainerNode().childNodes[i]
	}

	// Turns out this optimization won't work
	// because sometimes item height is an average approximation
	// and the other times it's the real item height
	// and sometimes it can change while item's not visible.
	// /**
	//  * Measures new "before" items height.
	//  * @param  {number} firstShownItemIndex — New first shown item index.
	//  * @param  {number} lastShownItemIndex — New last shown item index.
	//  * @return {number}
	//  */
	// getBeforeItemsHeightOptimized(firstShownItemIndex, lastShownItemIndex) {
	// 	// If the previous and new shown item indexes intersect
	// 	// then the new "before" items height may be calculated
	// 	// based on the previous "before" items height.
	// 	if (this.getState().averageItemHeight !== undefined &&
	// 		this.doPrevAndNextItemIndexesIntersect(firstShownItemIndex, lastShownItemIndex)) {
	// 		let beforeItemsHeight = this.getState().beforeItemsHeight
	// 		// Add all "before" will-be-hidden items' height.
	// 		let i = this.getState().firstShownItemIndex
	// 		while (i <= this.getState().lastShownItemIndex && i < firstShownItemIndex) {
	// 			beforeItemsHeight += (this.itemHeights.get(i) || this.itemHeights.getAverage())
	// 			beforeItemsHeight += this.getItemSpacing()
	// 			i++
	// 		}
	// 		// Subtract all "before" will-be-shown items' height.
	// 		i = firstShownItemIndex
	// 		while (i <= lastShownItemIndex && i < this.getState().firstShownItemIndex) {
	// 			beforeItemsHeight -= (this.itemHeights.get(i) || this.itemHeights.getAverage())
	// 			beforeItemsHeight -= this.getItemSpacing()
	// 			i++
	// 		}
	// 		return beforeItemsHeight
	// 	}
	// 	// If the previous and new shown item indexes don't intersect
	// 	// then re-calculate "before" items height.
	// 	else {
	// 		return this.getBeforeItemsHeight(firstShownItemIndex, lastShownItemIndex)
	// 	}
	// }

	// Turns out this optimization won't work
	// because sometimes item height is an average approximation
	// and the other times it's the real item height
	// and sometimes it can change while item's not visible.
	// /**
	//  * Measures new "after" items height.
	//  * @param  {number} firstShownItemIndex — New first shown item index.
	//  * @param  {number} lastShownItemIndex — New last shown item index.
	//  * @return {number}
	//  */
	// getAfterItemsHeightOptimized(firstShownItemIndex, lastShownItemIndex) {
	// 	// If the previous and new shown item indexes intersect
	// 	// then the new "after" items height may be calculated
	// 	// based on the previous "after" items height.
	// 	if (this.getState().averageItemHeight !== undefined &&
	// 		this.doPrevAndNextItemIndexesIntersect(firstShownItemIndex, lastShownItemIndex)) {
	// 		let afterItemsHeight = this.getState().afterItemsHeight
	// 		// Add all "after" will-be-hidden items' height.
	// 		let i = this.getState().lastShownItemIndex
	// 		while (i >= this.getState().firstShownItemIndex && i > lastShownItemIndex) {
	// 			afterItemsHeight += (this.itemHeights.get(i) || this.itemHeights.getAverage())
	// 			afterItemsHeight += this.getItemSpacing()
	// 			i--
	// 		}
	// 		// Subtract all "after" will-be-shown items' height.
	// 		i = lastShownItemIndex
	// 		while (i >= firstShownItemIndex && i > this.getState().lastShownItemIndex) {
	// 			afterItemsHeight -= (this.itemHeights.get(i) || this.itemHeights.getAverage())
	// 			afterItemsHeight -= this.getItemSpacing()
	// 			i--
	// 		}
	// 		return afterItemsHeight
	// 	}
	// 	// If the previous and new shown item indexes don't intersect
	// 	// then re-calculate "after" items height.
	// 	else {
	// 		return this.getAfterItemsHeight(firstShownItemIndex, lastShownItemIndex)
	// 	}
	// }

	// Was used it `.getBeforeItemsHeightOptimized()` and `.getAfterItemsHeightOptimized()`.
	// doPrevAndNextItemIndexesIntersect(firstShownItemIndex, lastShownItemIndex) {
	// 	return firstShownItemIndex <= this.getState().lastShownItemIndex &&
	// 		lastShownItemIndex >= this.getState().firstShownItemIndex
	// }

	// Not implementing the "delayed" layout feature for now.
	// delayLayout(args) {
	// 	// Suppose there's a "router" library which restores scroll position
	// 	// on "Back" navigation but only does so after `componentDidMount()`
	// 	// is called on the underlying page meaning that by the time
	// 	// the scroll position is restored the `VirtualScroller` component
	// 	// has already rendered with previous page's scroll position
	// 	// resulting in an unnecessary layout. "Delaying" layout
	// 	// means that the layout is called in a `setTimeout(..., 0)` call
	// 	// rather than immediately on mount.
	// 	if (this.shouldDelayLayout) {
	// 		this.layoutDelayedWithArgs = args
	// 		// Then in `.onMount()`:
	// 		// if (this.layoutDelayedWithArgs) {
	// 		// 	this.shouldDelayLayout = false
	// 		// 	setTimeout(() => {
	// 		// 		if (this.isMounted) {
	// 		// 			this.onUpdateShownItemIndexes(this.layoutDelayedWithArgs)
	// 		// 			this.layoutDelayedWithArgs = undefined
	// 		// 		}
	// 		// 	}, 0)
	// 		// }
	// 		return true
	// 	}
	// }
}

function getRemainderRest(n, divider) {
	const remainder = n % divider
	if (remainder > 0) {
		return divider - remainder
	}
	return 0
}

export function getItemsDiff(previousItems, newItems) {
	let firstPreviousItemIndex = -1
	let lastPreviousItemIndex = -1
	if (previousItems.length > 0) {
		firstPreviousItemIndex = newItems.indexOf(previousItems[0])
		if (firstPreviousItemIndex >= 0) {
			if (arePreviousItemsPreserved(previousItems, newItems, firstPreviousItemIndex)) {
				lastPreviousItemIndex = firstPreviousItemIndex + previousItems.length - 1
			}
		}
	}
	const isIncrementalUpdate = firstPreviousItemIndex >= 0 && lastPreviousItemIndex >= 0
	if (isIncrementalUpdate) {
		return {
			prependedItemsCount: firstPreviousItemIndex,
			appendedItemsCount: newItems.length - (lastPreviousItemIndex + 1)
		}
	}
	return {
		prependedItemsCount: -1,
		appendedItemsCount: -1
	}
}

function arePreviousItemsPreserved(previousItems, newItems, offset) {
	// Check each item of the `previousItems` to determine
	// whether it's an "incremental" items update.
	// (an update when items are prepended or appended)
	let i = 0
	while (i < previousItems.length) {
		if (newItems.length <= offset + i ||
			newItems[offset + i] !== previousItems[i]) {
			return false
		}
		i++
	}
	return true
}