import * as React from "react";
import * as _ from "lodash";
import "normalize.css/normalize.css";
import "./styles.css";
import { Buffer, Runway, Page, IPageProps, DebugPanel } from "./components";
import ViewPort from "./Viewport";

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
  isScrollingUp: boolean;
  prunedElementHeight: number;
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
    const settings = { ...defaultSettings, ...this.props.settings };
    this.state = {
      pages: [],
      previousBufferHeight: 0,
      nextBufferHeight: 0,
      settings,
      isScrollingUp: settings.startBottomUp,
      prunedElementHeight: 0
    };
  }

  public componentDidMount() {
    this.setup();
  }

  public componentWillUnmount() {
    this.bufferObserver.disconnect();
  }

  public getSnapshotBeforeUpdate() {
    return { scrollTop: this.viewport.scrollTop };
  }

  public componentDidUpdate(
    prevProps: IVirtualListProps,
    prevState: IVirtualListState,
    { scrollTop }: any
  ) {
    if (this.state.pages.length > 0) {
      this.adjustScrollTop(prevState.isScrollingUp, scrollTop, this.state.prunedElementHeight);
    }
  }

  public render() {
    const { pages } = this.state;
    const direction = this.state.settings.startBottomUp
      ? "bottom-up"
      : "top-down";

    return (
      <React.Fragment>
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
              <Page {...page} />
            ))}
            <Buffer
              name="next"
              element={ref => (this.nextBuffer = ref)}
              height={this.state.nextBufferHeight} />
          </Runway>
        </ViewPort>
        {this.state.settings.debug ? (
          <DebugPanel
            addPage={this.addPage}
            toggle={this.toggle}
            settings={this.state.settings}
          />
        ) : null}
      </React.Fragment>
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

    const heightUpdate = this.getHeightChanges(isScrollingUp);

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

    this.setState({
      pages,
      isScrollingUp,
      prunedElementHeight: heightUpdate.prunedElementHeight,
      nextBufferHeight: heightUpdate.nextBufferHeight,
      previousBufferHeight: heightUpdate.previousBufferHeight
    });
  }

  private getHeightChanges(isScrollingUp: boolean): {
    prunedElementHeight: number,
    nextBufferHeight: number,
    previousBufferHeight: number
  } {
    let nextBufferHeight = this.state.nextBufferHeight;
    let previousBufferHeight = this.state.previousBufferHeight;
    let prunedElementHeight = 0;
    let bufferToResize;
    const prune = this.state.pages[this.state.settings.maxPageBuffer];
    if (isScrollingUp) {
      bufferToResize = this.previousBuffer.nextElementSibling;
      if (prune) {
        const prunedElement: any = this.nextBuffer.previousElementSibling;
        prunedElementHeight = prunedElement.offsetHeight;
        nextBufferHeight += prunedElementHeight;

        // this calculation is not correct, it should be reducing the buffer for the size of the item that is being added
        // but we don't know that here. This should probably be done in adjustScrollTop.
        // For now, it works fine as it uses the existing last item as an estimate and this only affects the scrollbar size
        previousBufferHeight = Math.max(0, previousBufferHeight - bufferToResize.offsetHeight);
      }
    } else {
      if (prune) {
        bufferToResize = this.nextBuffer.previousElementSibling;
        const prunedElement: any = this.previousBuffer.nextElementSibling;
        prunedElementHeight = prunedElement.offsetHeight;
        previousBufferHeight += prunedElementHeight;

        // this calculation is not correct, it should be reducing the buffer for the size of the item that is being added
        // but we don't know that here. This should probably be done in adjustScrollTop.
        // For now, it works fine as it uses the existing last item as an estimate and this only affects the scrollbar size
        nextBufferHeight = Math.max(0, nextBufferHeight - bufferToResize.offsetHeight);
      }
    }

    return {
      prunedElementHeight,
      nextBufferHeight,
      previousBufferHeight
    }
  }

  private adjustScrollTop(isScrollingUp: boolean, previousScrollTop: number, prunedElementHeight: number) {
    requestAnimationFrame(() => {
      const page: any = isScrollingUp
        ? this.previousBuffer.nextElementSibling
        : this.nextBuffer.previousElementSibling;
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
