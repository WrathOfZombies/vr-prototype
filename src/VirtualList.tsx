import * as React from "react";
import * as _ from "lodash";
import "normalize.css/normalize.css";
import "./styles.css";
import { ViewPort, Buffer, Runway, Page, IPageProps } from "./components";
import { findDOMNode } from "react-dom";

const getDelta = event => {
  if (/edge/i.test(navigator.userAgent)) {
    return event.deltaY * -1;
  } else if (/chrome/i.test(navigator.userAgent)) {
    return event.deltaY * -3;
  } else if (/firefox/i.test(navigator.userAgent)) {
    return event.deltaY * -3;
  } else {
    return 0;
  }
};

export interface IVirtualListSettings {
  startBottomUp: boolean;
  maxPageBuffer: number;
  isPagingEnabled: boolean;
  debug: boolean;
}

const defaultSettings: IVirtualListSettings = {
  isPagingEnabled: true,
  startBottomUp: false,
  maxPageBuffer: 25,
  debug: false
};

export interface IVirtualListProps {
  getPageBefore: (currentPage?: IPageProps) => Promise<IPageProps | undefined>;
  getPageAfter: (currentPage?: IPageProps) => Promise<IPageProps | undefined>;
  style?: React.CSSProperties;
  settings?: Partial<IVirtualListSettings>;
}

export interface IVirtualListState {
  pages: IPageProps[];
  settings: IVirtualListSettings;
}

export default class VirtualList extends React.Component<
  IVirtualListProps,
  IVirtualListState
> {
  // private scrollStatus = {
  //   canScrollUp: true,
  //   canScrollDown: true
  // };
  private runwayY = 0;
  private viewport: HTMLElement;
  private viewportRect: ClientRect;
  private runway: HTMLElement;
  private previousBuffer: HTMLElement;
  private nextBuffer: HTMLElement;
  private bufferObserver: IntersectionObserver;

  constructor(props) {
    super(props);
    this.handleIntersection = this.handleIntersection.bind(this);
    this.onWheel = this.onWheel.bind(this);
    this.state = {
      pages: [],
      settings: { ...defaultSettings, ...this.props.settings }
    };
  }

  public componentDidMount() {
    this.setup();
  }

  public componentWillUnmount() {
    this.viewport.removeEventListener("wheel", this.onWheel);
    this.bufferObserver.disconnect();
  }

  public render() {
    const { pages } = this.state;
    let debugButtons: JSX.Element | null = null;
    if (this.state.settings.debug) {
      debugButtons = (
        <div id="debug">
          <label>
            <input
              type="checkbox"
              defaultChecked={this.state.settings.isPagingEnabled}
              onClick={e => this.togglePaging()}
            />{" "}
            Toggle paging
          </label>
          <button onClick={e => this.addPage(true)}>Add page before</button>
          <button onClick={e => this.addPage(false)}>Add page after</button>
        </div>
      );
    }

    const direction = this.state.settings.startBottomUp
      ? "bottom-up"
      : "top-down";

    return (
      <ViewPort
        data-direction={direction}
        element={ref => (this.viewport = ref)}
      >
        <Runway element={ref => (this.runway = ref)}>
          <Buffer
            name="previous"
            element={ref => (this.previousBuffer = ref)}
          />
          {pages.map(page => (
            <Page key={page.id} {...page} />
          ))}
          <Buffer name="next" element={ref => (this.nextBuffer = ref)} />
        </Runway>
        {debugButtons}
      </ViewPort>
    );
  }

  private setup() {
    if (!this.state.settings.startBottomUp) {
      this.slideRunwayInPx(-this.nextBuffer.offsetHeight);
    }
    this.addBufferIntersectionObservers();
    this.viewport.addEventListener("wheel", this.onWheel, { passive: true });
    this.viewportRect = this.viewport.getBoundingClientRect();
  }

  private addBufferIntersectionObservers() {
    this.bufferObserver = new IntersectionObserver(
      entries => entries.forEach(this.handleIntersection),
      {
        root: this.viewport,
        rootMargin: "0px",
        threshold: _.range(0, 1.0, 0.01)
      }
    );
    this.bufferObserver.observe(this.previousBuffer);
    this.bufferObserver.observe(this.nextBuffer);
  }

  private onWheel(event: WheelEvent) {
    const delta = getDelta(event);
    const goingUp = delta >= 0;
    // if (
    //   (!this.scrollStatus.canScrollUp && goingUp) ||
    //   (!this.scrollStatus.canScrollDown && !goingUp)
    // ) {
    //   return;
    // }
    const runwayRect = this.runway.getBoundingClientRect();

    if (goingUp) {
      console.debug("stopping scroll above");
      const reset =
        this.runwayY + 1285.3333740234375 - 200 - this.viewportRect.top;
      if (reset > 0) {
        this.slideRunwayInPx(-reset);
        return;
      }
    } else {
      console.debug("stopping scroll below");
      const reset =
        this.viewportRect.bottom - runwayRect.bottom - 1285.3333740234375;
      if (reset < 0) {
        this.slideRunwayInPx(-reset);
        return;
      }
    }
    this.slideRunwayInPx(delta);
  }

  private async handleIntersection(entry) {
    const isScrollingUp = entry.target === this.previousBuffer;
    const isIntersecting = entry.intersectionRatio > 0;
    if (!isIntersecting || !this.state.settings.isPagingEnabled) {
      return;
    }
    this.addPage(isScrollingUp);
  }

  private async addPage(isScrollingUp = false) {
    const page = isScrollingUp
      ? await this.props.getPageBefore(_.head(this.state.pages))
      : await this.props.getPageAfter(_.last(this.state.pages));

    if (!page) {
      return;
    }

    // let prunedElementHeight = 0;
    // if (isScrollingUp) {
    //   const prune = this.state.pages[this.state.settings.maxPageBuffer];
    //   if (prune) {
    //     const prunedElement: any = this.nextBuffer.previousElementSibling;
    //     prunedElementHeight = prunedElement.offsetHeight;
    //   }
    // }

    let pages: IPageProps[] = [];
    if (isScrollingUp) {
      const remainingPages = _.take(
        this.state.pages,
        this.state.settings.maxPageBuffer
      );
      pages = [page, ...remainingPages];
    } else {
      const remainingPages = _.takeRight(
        this.state.pages,
        this.state.settings.maxPageBuffer
      );
      pages = [...remainingPages, page];
    }

    this.setState({ pages }, () => {
      this.slideRunwayToBuffer(isScrollingUp);
    });
  }

  private slideRunwayToBuffer(
    isGoingUp: boolean,
    prunedElementHeight: number = 0
  ) {
    if (!isGoingUp) {
      return;
    }
    const page: any = this.previousBuffer.nextElementSibling;
    this.slideRunwayInPx(-page.offsetHeight + prunedElementHeight);
  }

  private slideRunwayInPx(delta: number) {
    this.runwayY = this.runwayY + delta;
    requestAnimationFrame(() => {
      this.runway.style.transform = `translate3d(0, ${this.runwayY}px, 0)`;
    });
  }

  private togglePaging() {
    const settings = { ...this.state.settings };
    settings.isPagingEnabled = !settings.isPagingEnabled;
    this.setState({ settings });
  }
}
