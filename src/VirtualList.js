import React from "react"
import _ from "lodash"
import { fromEvent } from "rxjs"
import { map, filter } from "rxjs/operators"
import "normalize.css/normalize.css"
import "./styles.css"
import { ViewPort, Buffer, Runway, Page } from "./components"
import { PAGING_ENABLED, MAX_PAGE_BUFFER, REVERSE_SCROLL } from "./settings"

const getDelta = event => {
  if (/chrome/i.test(navigator.userAgent)) {
    return event.deltaY * -3
  } else if (/firefox/i.test(navigator.userAgent)) {
    return event.deltaY * -3
  } else if (/safari/i.test(navigator.userAgent)) {
    return event.deltaY * -300
  }
}

export default class VirtualList extends React.Component {
  runwayY = 0
  scrollStatus = {
    canScrollUp: true,
    canScrollDown: true
  }

  state = {
    pages: []
  }

  componentDidMount() {
    this.setup()
  }

  componentWillUnmount() {
    this.subscription$ && this.subscription$.unsubscribe()
  }

  setup = () => {
    this.runway = document.getElementById("runway")
    this.bufferTop = document.getElementById("buffer-top")
    this.bufferBottom = document.getElementById("buffer-bottom")

    if (!REVERSE_SCROLL) {
      this.updateRunwayY(-this.bufferBottom.offsetHeight)
    }

    this.subscribeToScrollEvents()
    this.addBufferIntersectionObservers()
  }

  subscribeToScrollEvents() {
    this.subscription$ = fromEvent(
      document.querySelector("#viewport"),
      "wheel",
      {
        passive: true
      }
    )
      .pipe(
        map(event => {
          const delta = getDelta(event)
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
    this.bufferObserver = new IntersectionObserver(
      entries => entries.forEach(this.handleIntersection),
      {
        rootMargin: "150px 0px",
        threshold: [0, 0.25, 0.5, 0.75, 1]
      }
    )

    this.bufferObserver.observe(this.bufferTop)
    this.bufferObserver.observe(this.bufferBottom)
  }

  updateRunwayY = (delta = 0) => {
    requestAnimationFrame(() => {
      if (typeof delta === "number") {
        this.runwayY = this.runwayY + delta
      } else if (typeof delta === "string") {
        const lastPageElement = document.querySelector(`#${delta}`)
        this.runwayY = this.runwayY - lastPageElement.offsetHeight
      }
      this.runway.style.transform = `translate3d(0, ${this.runwayY}px, 0)`
    })
  }

  handleIntersection = async entry => {
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

    if (!isIntersecting) {
      return
    }

    if (!PAGING_ENABLED) return

    const page = isTopBuffer
      ? await this.props.getPrevPage(_.head(this.state.pages))
      : await this.props.getNextPage(_.last(this.state.pages))

    if (!page) {
      return
    }

    const pages = isTopBuffer
      ? [page, ..._.take(this.state.pages, MAX_PAGE_BUFFER)]
      : [..._.takeRight(this.state.pages, MAX_PAGE_BUFFER), page]

    this.setState({ pages }, () => {
      if (isTopBuffer) {
        this.updateRunwayY(`vrpage-${page.id}`)
      }
    })
  }

  addPage = async (prev = false) => {
    const page = await (prev
      ? this.props.getPrevPage()
      : this.props.getNextPage())
    if (!page) {
      alert("No more pages...")
      return
    }

    const pages = prev
      ? [page, ...this.state.pages]
      : [...this.state.pages, page]

    this.setState({ pages }, () => {
      if (prev) {
        this.updateRunwayY(`vrpage-${page.id}`)
      }
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
                id={`vrpage-${page.id}`}
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
          <div
            style={{
              position: "fixed",
              display: "inline-flex",
              top: "25px",
              left: "25px"
            }}
          >
            <button onClick={e => this.addPage(true)}>Add page before</button>
            <button onClick={e => this.addPage(false)}>Add page after</button>
          </div>
        )}
      </div>
    )
  }
}
