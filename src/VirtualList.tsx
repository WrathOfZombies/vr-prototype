import * as React from "react";
import * as _ from "lodash";
import "normalize.css/normalize.css";
import "./styles.css";
import { Buffer, Runway, Page, IPageProps, DebugPanel } from "./components";
import { findDOMNode } from "react-dom";
import { ViewPort } from "./Viewport";

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
  maxPageBuffer: 15,
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
  previousBufferHeight: number;
  nextBufferHeight: number;
}

export default class VirtualList extends React.Component<
  IVirtualListProps,
  IVirtualListState
> {
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
    this.toggle = this.toggle.bind(this);
    this.addPage = this.addPage.bind(this);
    this.state = {
      pages: [],
      previousBufferHeight: 0,
      nextBufferHeight: 0,
      settings: { ...defaultSettings, ...this.props.settings }
    };
  }

  public componentDidMount() {
    this.setup();
  }

  public componentWillUnmount() {
    this.bufferObserver.disconnect();
  }

  public render() {
    const { pages } = this.state;
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
            height={this.state.previousBufferHeight}
          />
          {pages.map(page => (
            <Page key={page.id} {...page} />
          ))}
          <Buffer
            name="next"
            element={ref => (this.nextBuffer = ref)}
            height={this.state.nextBufferHeight}/>
        </Runway>
        {this.state.settings.debug ? (
          <DebugPanel
            addPage={this.addPage}
            toggle={this.toggle}
            settings={this.state.settings}
          />
        ) : null}
      </ViewPort>
    );
  }

  private setup() {
    this.addBufferIntersectionObservers();
    this.viewportRect = this.viewport.getBoundingClientRect();
    this.setState({
      previousBufferHeight: this.viewportRect.height,
      nextBufferHeight: this.viewportRect.height
    });
  }

  private addBufferIntersectionObservers() {
    this.bufferObserver = new IntersectionObserver(
      entries => entries.forEach(this.handleIntersection),
      {
        root: this.viewport,
        rootMargin: "100px 0px 0px 0px",
        threshold: _.range(0, 1.0, 0.01)
      }
    );
    this.bufferObserver.observe(this.previousBuffer);
    this.bufferObserver.observe(this.nextBuffer);
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

    let prunedElementHeight = 0;
    if (isScrollingUp) {
      const prune = this.state.pages[this.state.settings.maxPageBuffer];
      if (prune) {
        const prunedElement: any = this.nextBuffer.previousElementSibling;
        prunedElementHeight = prunedElement.offsetHeight;
      }
    } else {
      const prune = this.state.pages[this.state.settings.maxPageBuffer];
      if (prune) {
        const prunedElement: any = this.previousBuffer.nextElementSibling;
        prunedElementHeight = prunedElement.offsetHeight;
      }
    }

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

    const scrollTop = this.viewport.scrollTop;
    this.setState({ pages }, () => {
      this.adjustScrollTop(isScrollingUp, scrollTop, prunedElementHeight);
    });
  }

  private adjustScrollTop(isScrollingUp: boolean, previousScrollTop: number, prunedElementHeight: number) {
    requestAnimationFrame(() => {
      const page: any = isScrollingUp ? this.previousBuffer.nextElementSibling : this.nextBuffer.previousElementSibling;
      const pageOffset = page.offsetHeight;

      // let nextBufferHeight;
      // let previousBufferHeight;
      // if (prunedElementHeight > 0) {
      //   if (isScrollingUp) {
      //     nextBufferHeight = this.state.nextBufferHeight + prunedElementHeight;
      //     previousBufferHeight = Math.max(0, this.state.previousBufferHeight - pageOffset);
      //   } else {
      //     previousBufferHeight = this.state.previousBufferHeight + prunedElementHeight;
      //     nextBufferHeight = Math.max(0, this.state.nextBufferHeight - pageOffset);
      //   }

      //   this.setState({
      //     nextBufferHeight: nextBufferHeight,
      //     previousBufferHeight: previousBufferHeight
      //   });
      // }

      if (isScrollingUp) {
        const newScrollTop = previousScrollTop + page.offsetHeight;
        this.viewport.scrollTop = newScrollTop;
      }
    });
  }

  private toggle(setting) {
    const settings = { ...this.state.settings };
    settings[setting] = !settings[setting];
    this.setState({ settings });
  }
}
