import React from "react"
import ReactDOM from "react-dom"
import _ from "lodash"
import { fromEvent } from "rxjs"
import { map, filter } from "rxjs/operators"
import "normalize.css/normalize.css"
import { ViewPort, Buffer, Runway, Page } from "./components"
import { FF_MULTIPLIER, PAGING_ENABLED, MAX_PAGE_BUFFER } from "./settings"

const d = (...args) => console.debug(...args)

// TODO
//
// Recycling
// dynamic page height

// #1 - mousewheel / DOMWheelScroll event
//   FF feels slightly janky
//   all others feel native
//   does not require scrollable container
//   all perf tests 60 fps
//   scroll updates are sub millisecond (0.2ms etc)

class VirtualList extends React.Component {
  runwayY = 0
  scrollStatus = {
    canScrollUp: true,
    canScrollDown: true
  }

  state = {
    pages: []
  }

  componentDidMount() {
    this.isFF = /firefox/i.test(navigator.userAgent)
    this.setup()
  }

  componentWillUnmount() {
    this.subscription$ && this.subscription$.unsubscribe()
  }

  setup = () => {
    this.viewport = document.getElementById("viewport")
    this.runway = document.getElementById("runway")
    this.bufferTop = document.getElementById("buffer-top")
    this.bufferBottom = document.getElementById("buffer-bottom")

    if (this.isFF) {
      // try to fix jitter
      this.runway.style.transition = "transform 50ms ease-in-out"
    }

    this.updateRunwayY(-this.bufferTop.offsetHeight)
    this.subscribeToScrollEvents()
    this.addBufferIntersectionObservers()
  }

  subscribeToScrollEvents() {
    this.subscription$ = fromEvent(
      this.viewport,
      this.isFF ? "DOMMouseScroll" : "mousewheel",
      {
        passive: true
      }
    )
      .pipe(
        map(event => {
          const delta = event.wheelDelta || event.detail * FF_MULTIPLIER
          const goingUp = delta >= 0
          return { delta, goingUp, event }
        }),
        filter(({ goingUp }) => {
          if (!this.scrollStatus.canScrollUp && goingUp) {
            return false
          }
          if (!this.scrollStatus.canScrollDown && !goingUp) {
            return false
          }
          return true
        })
      )
      .subscribe(next => this.updateRunwayY(next.delta))
  }

  addBufferIntersectionObservers = () => {
    this.bufferObserver = new IntersectionObserver(this.handleIntersection, {
      root: this.viewport,
      threshold: [0, 0.25, 0.5, 0.75, 1]
    })

    this.bufferObserver.observe(this.bufferTop)
    this.bufferObserver.observe(this.bufferBottom)
  }

  updateRunwayY = (delta = 0, force = false) => {
    this.runwayY = force ? delta : this.runwayY + delta
    requestAnimationFrame(() => {
      this.runway.style.transform = `translate3d(0, ${this.runwayY}px, 0)`
    })
  }

  getPrevPage = currentPage => {
    d("Requesting page before", currentPage)
    const id = _.uniqueId()
    return {
      id,
      name: `page-${id}`,
      children: `Page #${id}`
    }
  }

  getNextPage = currentPage => {
    d("Requesting page after", currentPage)
    const id = _.uniqueId()
    return {
      id,
      name: `page-${id}`,
      children: `Page #${id}`
    }
  }

  handleIntersection = entries =>
    _(entries)
      .map(entry => {
        const id = _.get(entry, "target.id")
        const isTopBuffer = id === "buffer-top"
        const isIntersecting = entry.intersectionRatio > 0.05
        const shouldPauseScrolling = entry.intersectionRatio > 0.2

        this.scrollStatus = {
          canScrollUp: isTopBuffer
            ? !shouldPauseScrolling
            : this.scrollStatus.canScrollUp,
          canScrollDown: !isTopBuffer
            ? !shouldPauseScrolling
            : this.scrollStatus.canScrollDown
        }

        const data = {
          id,
          isIntersecting,
          isTopBuffer,
          intersectionRatio: entry.intersectionRatio,
          clientRect: entry.boundingClientRect
        }
        return data
      })
      .filter(({ isIntersecting }) => isIntersecting)
      .each(({ id, isTopBuffer, clientRect, intersectionRatio }) => {
        d(
          id,
          intersectionRatio,
          isTopBuffer ? clientRect.bottom : clientRect.top
        )

        if (!PAGING_ENABLED) return

        const head = _.head(this.state.pages)
        const tail = _.last(this.state.pages)

        const pages = isTopBuffer
          ? [
              this.getPrevPage(head),
              ..._.take(this.state.pages, MAX_PAGE_BUFFER)
            ]
          : [
              ..._.takeRight(this.state.pages, MAX_PAGE_BUFFER),
              this.getNextPage(tail)
            ]

        this.setState({ pages }, () => {
          requestAnimationFrame(() => {
            const page = isTopBuffer
              ? _.head(this.state.pages)
              : _.last(this.state.pages)
            if (!page) return
            const rect = document
              .getElementById(page.id)
              .getBoundingClientRect()
            this.updateRunwayY(
              isTopBuffer ? -rect.top : this.viewport.clientHeight - rect.bottom
            )
          })
        })
      })

  render() {
    const { pages } = this.state

    return (
      <div>
        <ViewPort id="viewport">
          <Runway id="runway">
            <Buffer top id="buffer-top" />
            {pages.map(page => (
              <Page key={page.id} id={page.id} className={page.name}>
                {page.children}
              </Page>
            ))}
            <Buffer bottom id="buffer-bottom" />
          </Runway>
        </ViewPort>
      </div>
    )
  }
}

const rootElement = document.getElementById("root")
ReactDOM.render(<VirtualList />, rootElement)
