import React from "react"
import ReactDOM from "react-dom"
import _ from "lodash"

import "normalize.css/normalize.css"

const PAGE_HEIGHT = 700
const PAGING_ENABLED = true
const ANCHORS_ENABLED = true

// TODO
//
// Fix bug with initial scroll up not loading previous page
// Recycling
// dynamic page height

// #1 - mousewheel / DOMWheelScroll event
//   FF feels slightly janky
//   all others feel native
//   does not require scrollable container
//   all perf tests 60 fps
//   scroll updates are sub millisecond (0.2ms etc)

const ViewPort = props => (
  <div
    {...props}
    style={{
      overflow: "hidden",
      border: "8px solid black",
      height: PAGE_HEIGHT,
      ...props.style
    }}
  />
)

const Buffer = ({ top, bottom, style, ...rest }) => (
  <div
    style={{
      background: `linear-gradient(${
        top ? "lightgreen, cyan" : "lightgreen, green"
      })`,
      height: PAGE_HEIGHT,
      ...style
    }}
    {...rest}
  >
    {top ? "TOP" : bottom ? "bottom" : ""} BUFFER
  </div>
)

const Runway = props => {
  return (
    <div
      {...props}
      style={{
        display: "flex",
        flexDirection: "column",
        ...props.style
      }}
    />
  )
}

const Page = props => (
  <div
    style={{
      background: "linear-gradient(white, gray)",
      height: PAGE_HEIGHT,
      ...props.style
    }}
  >
    {props.children || "Page"}
  </div>
)
const ScrollAnchor = ({ style, children, ...rest }) => (
  <div
    style={{
      background: "red",
      height: PAGE_HEIGHT,
      ...style
    }}
    className="scroll-anchor"
    {...rest}
  >
    {children || "ANCHOR"}
  </div>
)

class App extends React.Component {
  canScrollUp = true
  canScrollDown = true
  runwayY = -PAGE_HEIGHT

  state = {
    pages: []
  }

  componentDidMount() {
    this.isFF = /firefox/i.test(navigator.userAgent)
    this.setup()
  }

  componentWillUnmount() {
    this.viewport.removeEventListener(
      this.isFF ? "DOMMouseScroll" : "mousewheel",
      this.handleViewPortMouseWheel
    )
  }

  addBufferIntersectionObservers = () => {
    this.bufferObserver = new IntersectionObserver(this.handleIntersection, {
      root: this.viewport,
      rootMargin: "0px"
    })

    this.bufferObserver.observe(this.bufferTop)
    this.bufferObserver.observe(this.bufferBottom)
    this.scrollAnchors.forEach(scrollAnchor => {
      this.bufferObserver.observe(scrollAnchor)
    })
  }

  getPrevPage = () => {
    const id = _.uniqueId()
    return <Page key={id}>Prev Page (id: {id})</Page>
  }

  getNextPage = () => {
    const id = _.uniqueId()
    return <Page key={id}>Next Page (id: {id})</Page>
  }

  handleIntersection = entries => {
    console.log(entries)
    entries.forEach(entry => {
      if (entry.target.id === "scroll-anchor-top") {
        this.canScrollUp = !entry.isIntersecting
      }
      if (entry.target.id === "scroll-anchor-bottom") {
        this.canScrollDown = !entry.isIntersecting
      }
    })

    console.log({
      canScrollUp: this.canScrollUp,
      canScrollDown: this.canScrollDown
    })

    if (!PAGING_ENABLED) return

    const buferEntry = entries.find(({ isIntersecting }) => isIntersecting)
    if (!buferEntry) return

    const isTop = buferEntry.target.id === "buffer-top"
    const pages = isTop
      ? [this.getPrevPage(), ...this.state.pages]
      : [...this.state.pages, this.getNextPage()]

    console.log("new pages", ...pages)

    this.setState({ pages }, () => {
      if (isTop) this.updateRunwayY(-PAGE_HEIGHT)
    })
  }

  setup = () => {
    this.viewport = document.getElementById("viewport")
    this.runway = document.getElementById("runway")
    this.bufferTop = document.getElementById("buffer-top")
    this.bufferBottom = document.getElementById("buffer-bottom")
    this.scrollAnchors = document.querySelectorAll(".scroll-anchor")

    if (this.isFF) {
      // try to fix jitter
      this.runway.style.transition = "transform 50ms ease-in-out"
    }

    this.updateRunwayY()
    this.addEventListeners()
    this.addBufferIntersectionObservers()
  }

  addEventListeners = () => {
    this.viewport.addEventListener(
      this.isFF ? "DOMMouseScroll" : "mousewheel",
      this.handleViewPortMouseWheel
    )
  }

  updateRunwayY = (delta = 0) => {
    console.log("updateRunwayY", delta)
    this.runwayY = this.runwayY + delta

    requestAnimationFrame(() => {
      this.runway.style.transform = `translate3d(0, ${this.runwayY}px, 0)`
    })
  }

  handleViewPortMouseWheel = e => {
    e.preventDefault()

    const delta = this.isFF ? -e.detail * (PAGE_HEIGHT * 0.05) : e.wheelDelta
    const isUp = delta >= 0
    const isDown = !isUp

    if (!ANCHORS_ENABLED) {
      this.updateRunwayY(delta)
    } else if ((isUp && this.canScrollUp) || (isDown && this.canScrollDown)) {
      this.updateRunwayY(delta)
    }
  }

  render() {
    const { pages } = this.state

    return (
      <div>
        <ViewPort id="viewport">
          <Runway id="runway">
            <ScrollAnchor id="scroll-anchor-top" />
            <Buffer top id="buffer-top" />
            {pages}
            <Buffer bottom id="buffer-bottom" />
            <ScrollAnchor id="scroll-anchor-bottom" />
          </Runway>
        </ViewPort>
      </div>
    )
  }
}

const rootElement = document.getElementById("root")
ReactDOM.render(<App />, rootElement)
