import * as React from "react";
import "normalize.css/normalize.css";
import "./styles.css";
import * as _ from "lodash";
import ListItem from "./ListItem";
import ResizeObserver from "./resizeObserver";

export interface IVirtualizedListRendererProps {
  items: any[];
}

export interface IVirtualizedListRendererState {
  itemsToRender: JSX.Element[];
  itemId: string;
  height: string;
  currentAnchorId: string;
}

const ITEMS_BUFFER = 20;

export default class VirtualizedListRenderer extends React.Component<
  IVirtualizedListRendererProps,
  IVirtualizedListRendererState
> {
  private viewport;
  private runwayArea;
  private elementRefs;
  private elementsObserver: IntersectionObserver;
  private resizeObserver;
  private mutationObserver: MutationObserver;
  private currentAnchor;
  private isAnchorBeingSelected: boolean;
  private isLoadingMore: boolean;

  private pauseAnchorSelection = _.debounce(
    () => (this.isAnchorBeingSelected = false),
    10
  );

  constructor(props: IVirtualizedListRendererProps) {
    super(props);
    this.elementRefs = {};
    this.onValueChanged = this.onValueChanged.bind(this);
    this.changeHeight = this.changeHeight.bind(this);
    this.saveRef = this.saveRef.bind(this);
    this.handleIntersection = this.handleIntersection.bind(this);
    this.state = {
      itemsToRender: [],
      itemId: "",
      height: "",
      currentAnchorId: ""
    };
  }

  public componentDidMount() {
    this.createIntersectionObserver();
    this.createResizeObserver();
    this.addMoreItems();
    requestAnimationFrame(() => {
      this.isAnchorBeingSelected = true;
      this.viewport.scrollTop = this.viewport.scrollHeight;
      this.pauseAnchorSelection();
    });
  }

  public componentWillUnmount() {
    this.elementsObserver.disconnect();
    this.mutationObserver.disconnect();
  }

  public componentDidUpdate(prevProps: IVirtualizedListRendererProps, prevState: IVirtualizedListRendererState) {
    if (this.state.itemsToRender.length !== prevState.itemsToRender.length && this.isLoadingMore) {
      this.isLoadingMore = false;
    }
  }

  public render() {
    return (
      <React.Fragment>
      <div
        data-name="viewport"
        ref={ref => (this.viewport = ref)}
        onScroll={this.onScroll}
        style={{
          height: "100vh",
          overflowY: "auto",
          transform: "translate3d(0,0,0)",
          willChange: "scroll-position",
          backfaceVisibility: "hidden",
          overscrollBehavior: "none",
          overflowAnchor: "none"
      }}>
        <div data-name="runway"
          ref={ref => (this.runwayArea = ref)}
          style={{
            display: "flex",
            flexDirection: "column",
            transformStyle: "preserve-3d",
            position: "relative"
          }}>
            {this.state.itemsToRender}
        </div>
      </div>
      <DebugPanel
        itemId={this.state.itemId}
        onValueChanged={this.onValueChanged}
        height={this.state.height}
        changeHeight={this.changeHeight}
        currentAnchor={this.state.currentAnchorId}
      />
      </React.Fragment>
    );
  }

  private onScroll = (event) => {
    this.isAnchorBeingSelected = true;
    // console.log("Scroll happened");
    this.pauseAnchorSelection();
    if (event.target.scrollTop < 500 && !this.isLoadingMore) {
      this.addMoreItems();
    }
  }

  private addMoreItems() {
    this.isLoadingMore = true;
    const { itemsToRender } = this.state;
    const length = itemsToRender.length;
    const newItems: any = [];

    for (let i = length; i < length + ITEMS_BUFFER; i++) {
      const item = this.getItem(i);
      newItems.push(item);
    }

    this.setState({
      itemsToRender: newItems.reverse().concat(itemsToRender)
    });
  }

  private getItem(index: number): JSX.Element {
    return (
      <ListItem key={index} index={index} id={this.getElementId(index)} observer={this.elementsObserver} />
    );
  }

  private saveRef(index, ref) {
    this.elementRefs[index] = ref;
  }

  private createResizeObserver() {
    this.resizeObserver = ResizeObserver(this.updateAnchorPosition);
    this.resizeObserver.observe(this.runwayArea);
  }

  private updateAnchorPosition = () => {
    if (!this.currentAnchor) {
      return;
    }

    const newBoundingClientRect = this.currentAnchor.target.getBoundingClientRect();

    const delta =
      newBoundingClientRect.top -
      this.currentAnchor.boundingClientRect.top;

    // console.log(
    //   newBoundingClientRect,
    //   this.currentAnchor.boundingClientRect
    // );
    console.debug("Scrolling you to:", delta);
    this.adjustScroll(delta);
  }

  private adjustScroll(delta) {
    if (!this.viewport) {
      return;
    }
    if (this.viewport.scrollBy) {
      this.viewport.scrollBy(0, delta);
    } else {
      this.viewport.scrollTop += delta;
    }
  }

  private createIntersectionObserver() {
    this.elementsObserver = new IntersectionObserver(
      entries => entries.forEach(this.handleIntersection),
      {
        root: this.viewport,
        rootMargin: "0px",
        threshold: _.range(0, 1.0, 0.01)
      }
    );
  }

  private handleIntersection(entry: IntersectionObserverEntry) {
    if (this.shouldSelectAnchor(entry)) {
      this.currentAnchor = entry;
      this.setState({
        currentAnchorId: this.currentAnchor.target.id
      });
    }
  }

  private shouldSelectAnchor(entry: IntersectionObserverEntry) {
    return this.isAnchorBeingSelected &&
      entry.intersectionRatio > 0 &&
      entry.boundingClientRect.top < entry.rootBounds.top &&
      entry.boundingClientRect.bottom > entry.rootBounds.top;
  }


  private onValueChanged(event, propName: string) {
    const state = { ...this.state };
    state[propName] = event.target.value;
    this.setState(state);
  }

  private getElementId(index) {
    return `item-${index}`;
  }

  private changeHeight() {
    const { itemId, height } = this.state;
    const elementId = this.getElementId(itemId);
    const element = document.getElementById(elementId);

    if (!element) {
      return;
    }
    element.style.height = height + "px";
  }
}

export const DebugPanel = ({ itemId, height, onValueChanged, changeHeight, currentAnchor }) => (
  <div id="debug">
    <div>
      <span>Item id:</span>
      <input
        type="text"
        value={itemId}
        onChange={e => onValueChanged(e, "itemId")}
      />
    </div>
    <div>
      <span>New Height:</span>
      <input
        type="text"
        value={height}
        onChange={e => onValueChanged(e, "height")}
      />
    </div>
    <button onClick={e => changeHeight()}>Change Element Height</button>
    <div>
      <span>Current Anchor: {currentAnchor}</span>
    </div>
  </div>
);
