import * as React from "react";
import * as _ from "lodash";
import "normalize.css/normalize.css";
import "./styles.css";
import { ViewPort, Buffer, Runway, Page } from "./components";
import { PAGING_ENABLED, MAX_PAGE_BUFFER, REVERSE_SCROLL } from "./settings";

const getDelta = event => {
  if (/chrome/i.test(navigator.userAgent)) {
    return event.deltaY * -3;
  } else if (/firefox/i.test(navigator.userAgent)) {
    return event.deltaY * -3;
  } else if (/safari/i.test(navigator.userAgent)) {
    return event.deltaY * -300;
  } else {
    return 0;
  }
};

export interface IVirtualListProps {
  getPrevPage: (currentPage?: any) => Promise<any>;
  getNextPage: (currentPage?: any) => Promise<any>;
}

export default class VirtualList extends React.Component<IVirtualListProps> {
  runwayY = 0;
  scrollStatus = {
    canScrollUp: true,
    canScrollDown: true
  };
  subscription$;
  runway;
  bufferTop;
  bufferBottom;
  bufferObserver;

  state = {
    pages: []
  };

  constructor(props) {
    super(props);
    this.handleIntersection = this.handleIntersection.bind(this);
    this.addPage = this.addPage.bind(this);
    this.onScroll = this.onScroll.bind(this);
  }

  componentDidMount() {
    this.setup();
  }

  componentWillUnmount() {
    const viewport = document.querySelector("#viewport");
    if (!viewport) {
      return;
    }
    viewport.removeEventListener("wheel", this.onScroll);
  }

  setup() {
    this.runway = document.getElementById("runway");
    this.bufferTop = document.getElementById("buffer-top");
    this.bufferBottom = document.getElementById("buffer-bottom");

    if (!REVERSE_SCROLL) {
      this.updateRunwayY(-this.bufferBottom.offsetHeight);
    }

    this.subscribeToScrollEvents();
    this.addBufferIntersectionObservers();
  }

  subscribeToScrollEvents() {
    const viewport = document.querySelector("#viewport");
    if (!viewport) {
      return;
    }

    viewport.addEventListener("wheel", this.onScroll, { passive: true });
  }

  onScroll(event: WheelEvent) {
    const delta = getDelta(event);
    const goingUp = delta >= 0;
    if (
      (!this.scrollStatus.canScrollUp && goingUp) ||
      (!this.scrollStatus.canScrollDown && !goingUp)
    ) {
      return;
    }
    this.updateRunwayY(delta);
  }

  addBufferIntersectionObservers() {
    this.bufferObserver = new IntersectionObserver(
      entries => entries.forEach(this.handleIntersection),
      {
        rootMargin: "150px 0px",
        threshold: [0, 0.25, 0.5, 0.75, 1]
      }
    );

    this.bufferObserver.observe(this.bufferTop);
    this.bufferObserver.observe(this.bufferBottom);
  }

  async updateRunwayY(delta: number | string = 0) {
    requestAnimationFrame(() => {
      if (typeof delta === "number") {
        this.runwayY = this.runwayY + delta;
      } else if (typeof delta === "string") {
        const lastPageElement = document.querySelector(
          `#${delta}`
        ) as HTMLElement;
        if (!lastPageElement) {
          return;
        }
        this.runwayY = this.runwayY - lastPageElement.offsetHeight;
      }
      this.runway.style.transform = `translate3d(0, ${this.runwayY}px, 0)`;
    });
  }

  async handleIntersection(entry) {
    const id = _.get(entry, "target.id");
    const isTopBuffer = id === "buffer-top";
    const isIntersecting = entry.intersectionRatio > 0.05;
    const shouldPauseScrolling = entry.intersectionRatio > 0.2;

    this.scrollStatus = {
      canScrollUp: isTopBuffer
        ? !shouldPauseScrolling
        : this.scrollStatus.canScrollUp,
      canScrollDown: !isTopBuffer
        ? !shouldPauseScrolling
        : this.scrollStatus.canScrollDown
    };

    if (!isIntersecting) {
      return;
    }

    if (!PAGING_ENABLED) {
      return;
    }

    const page = isTopBuffer
      ? await this.props.getPrevPage(_.head(this.state.pages))
      : await this.props.getNextPage(_.last(this.state.pages));

    if (!page) {
      return;
    }

    const pages = isTopBuffer
      ? [page, ..._.take(this.state.pages, MAX_PAGE_BUFFER)]
      : [..._.takeRight(this.state.pages, MAX_PAGE_BUFFER), page];

    this.setState({ pages }, () => {
      if (isTopBuffer) {
        this.updateRunwayY(`vrpage-${page.id}`);
      }
    });
  }

  async addPage(prev = false) {
    const page = await (prev
      ? this.props.getPrevPage()
      : this.props.getNextPage());
    if (!page) {
      alert("No more pages...");
      return;
    }

    const pages = prev
      ? [page, ...this.state.pages]
      : [...this.state.pages, page];

    this.setState({ pages }, () => {
      if (prev) {
        this.updateRunwayY(`vrpage-${page.id}`);
      }
    });
  }

  render() {
    const { pages } = this.state;
    const B: any = Buffer;
    const P: any = Page;
    return (
      <div>
        <ViewPort id="viewport">
          <Runway id="runway">
            <B top id="buffer-top" />
            {pages.map((page: any) => (
              <P
                key={page.id}
                id={`vrpage-${page.id}`}
                className={page.name}
                cards={page.cards}
              >
                {page.children}
              </P>
            ))}
            <B bottom id="buffer-bottom" />
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
    );
  }
}
