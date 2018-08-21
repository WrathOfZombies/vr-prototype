import React from "react"
import ReactDOM from "react-dom"
import _ from "lodash"
import { fromEvent } from "rxjs"
import { map, filter } from "rxjs/operators"
import "normalize.css/normalize.css"
import { ViewPort, Buffer, Runway, Page } from "./components"
import {
  FF_MULTIPLIER,
  PAGING_ENABLED,
  MAX_PAGE_BUFFER,
  REVERSE_SCROLL
} from "./settings"
import createDataSource from "./dataSource"

const dataSource = createDataSource()

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

    if (!REVERSE_SCROLL) {
      this.updateRunwayY(-this.bufferBottom.offsetHeight)
    }

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
          const delta = event.wheelDelta || -(event.detail * FF_MULTIPLIER)
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
      rootMargin: "150px 0px",
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
    return runAsync(() => dataSource.pop())
  }

  getNextPage = currentPage => {
    // if (REVERSE_SCROLL) {
    //   return Promise.resolve(null)
    // }
    d("Requesting page after", currentPage)
    return runAsync(() => dataSource.pop())
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
          clientRect: entry.boundingClientRect,
          intersectionRect: entry.intersectionRect
        }
        return data
      })
      .filter(({ isIntersecting }) => isIntersecting)
      .each(
        async ({ id, isTopBuffer, intersectionRect, intersectionRatio }) => {
          d(id, intersectionRatio)

          if (!PAGING_ENABLED) return

          const page = isTopBuffer
            ? await this.getPrevPage(_.head(this.state.pages))
            : await this.getNextPage(_.last(this.state.pages))

          if (!page) {
            return
          }

          const pages = isTopBuffer
            ? [page, ..._.take(this.state.pages, MAX_PAGE_BUFFER)]
            : [..._.takeRight(this.state.pages, MAX_PAGE_BUFFER), page]

          this.setState({ pages }, () => {
            requestAnimationFrame(() => {
              if (isTopBuffer) {
                const lastPageElement = document.getElementById(page.id)
                this.updateRunwayY(-lastPageElement.offsetHeight)
              }
            })
          })
        }
      )

  addPage = async (prev = false) => {
    const page = await (prev ? this.getPrevPage() : this.getNextPage())
    if (!page) {
      alert("No more pages...")
      return
    }

    const pages = prev
      ? [page, ...this.state.pages]
      : [...this.state.pages, page]

    this.setState({ pages }, () => {
      requestAnimationFrame(() => {
        if (prev) {
          const lastPageElement = document.getElementById(page.id)
          this.updateRunwayY(-lastPageElement.offsetHeight)
        }
      })
    })
  }

  render() {
    const { pages } = this.state

    return (
      <div>
        <ViewPort id="viewport">
          <Runway id="runway">
            <Buffer top id="buffer-top" />
            {pages.map(page => (
              <Page
                key={page.id}
                id={page.id}
                className={page.name}
                cards={page.cards}
              >
                {page.children}
              </Page>
            ))}
            <Buffer bottom id="buffer-bottom" />
          </Runway>
        </ViewPort>

        {PAGING_ENABLED ? null : (
          <React.Fragment>
            <button
              style={{
                cursor: "pointer",
                position: "fixed",
                zIndex: 9999,
                padding: "10px",
                padding: "10px",
                bottom: "75px",
                right: "25px",
                borderRadius: "5px"
              }}
              onClick={e => this.addPage(true)}
            >
              Add page before
            </button>
            <button
              style={{
                cursor: "pointer",
                position: "fixed",
                zIndex: 9999,
                padding: "10px",
                padding: "10px",
                bottom: "25px",
                right: "25px",
                borderRadius: "5px",
                fontFamily: "'San Francisco', 'Segoe UI', Tahoma"
              }}
              onClick={e => this.addPage(false)}
            >
              Add page after
            </button>
          </React.Fragment>
        )}
      </div>
    )
  }
}

const rootElement = document.getElementById("root")
ReactDOM.render(<VirtualList />, rootElement)

const runAsync = (cb, timer = 0) =>
  new Promise(resolve => setTimeout(() => resolve(cb()), timer))
