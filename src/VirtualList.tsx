import * as React from "react";
import * as _ from "lodash";
import "normalize.css/normalize.css";
import "./styles.css";
import { ViewPort, Buffer, Runway, Page } from "./components";

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

export interface IVirtualListSettings {
  startBottomUp: boolean;
  maxPageBuffer: number;
  debug: boolean;
}

const defaultSettings: IVirtualListSettings = {
  startBottomUp: false,
  maxPageBuffer: 5,
  debug: false
};

export interface IPage {
  id: string | number;
  cards: {
    id: string | number;
    card: any;
    image: any;
  };
}

export interface IVirtualListProps {
  getPrevPage: (currentPage?: IPage) => Promise<IPage | undefined>;
  getNextPage: (currentPage?: IPage) => Promise<IPage | undefined>;
  style?: React.CSSProperties;
  settings?: Partial<IVirtualListSettings>;
}

export interface IVirtualListState {
  pages: IPage[];
  settings: IVirtualListSettings;
}

export default class VirtualList extends React.Component<
  IVirtualListProps,
  IVirtualListState
> {
  private runwayY = 0;
  private scrollStatus = {
    canScrollUp: true,
    canScrollDown: true
  };
  private runway;
  private bufferTop;
  private bufferBottom;
  private bufferObserver;

  constructor(props) {
    super(props);
    this.handleIntersection = this.handleIntersection.bind(this);
    this.onScroll = this.onScroll.bind(this);
    this.state = {
      pages: [],
      settings: { ...defaultSettings, ...this.props.settings }
    };
  }

  public componentDidMount() {
    this.setup();
  }

  public componentWillUnmount() {
    const viewport = document.querySelector("#viewport");
    if (!viewport) {
      return;
    }
    viewport.removeEventListener("wheel", this.onScroll);
  }

  public render() {
    const { pages } = this.state;
    const B: any = Buffer;
    const P: any = Page;

    let debugButtons: JSX.Element | null = null;
    if (this.state.settings.debug) {
      debugButtons = (
        <div
          style={{
            position: "absolute",
            display: "inline-flex",
            top: "25px",
            left: "25px"
          }}
        >
          <button onClick={e => this.addPage(true)}>Add page before</button>
          <button onClick={e => this.addPage(false)}>Add page after</button>
        </div>
      );
    }

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

        {debugButtons}
      </div>
    );
  }

  private setup() {
    this.runway = document.getElementById("runway");
    this.bufferTop = document.getElementById("buffer-top");
    this.bufferBottom = document.getElementById("buffer-bottom");

    if (!this.state.settings.startBottomUp) {
      this.updateRunwayY(-this.bufferBottom.offsetHeight);
    }

    this.subscribeToScrollEvents();
    this.addBufferIntersectionObservers();
  }

  private subscribeToScrollEvents() {
    const viewport = document.querySelector("#viewport");
    if (!viewport) {
      return;
    }

    viewport.addEventListener("wheel", this.onScroll, { passive: true });
  }

  private onScroll(event: WheelEvent) {
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

  private addBufferIntersectionObservers() {
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

  private async updateRunwayY(delta: number | string = 0) {
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

  private async handleIntersection(entry) {
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

    if (this.state.settings.debug) {
      return;
    }

    const page = isTopBuffer
      ? await this.props.getPrevPage(_.head(this.state.pages))
      : await this.props.getNextPage(_.last(this.state.pages));

    if (!page) {
      return;
    }

    const pages = isTopBuffer
      ? [page, ..._.take(this.state.pages, this.state.settings.maxPageBuffer)]
      : [
          ..._.takeRight(this.state.pages, this.state.settings.maxPageBuffer),
          page
        ];

    this.setState({ pages }, () => {
      if (isTopBuffer) {
        this.updateRunwayY(`vrpage-${page.id}`);
      }
    });
  }

  private async addPage(prev = false) {
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
}
