import * as React from "react";
import "normalize.css/normalize.css";
import "./styles.css";
import * as _ from "lodash";
import { Page } from "./components";

export interface IVirtualizedListRendererProps {
  items: any[];
}

export interface IVirtualizedListRendererState {
  itemsToRender: JSX.Element[];
  itemId: string;
  height: string;
  currentAnchorId: string;
}

const ITEMS_LENGTH = 50;

export default class VirtualizedListRenderer extends React.Component<
  IVirtualizedListRendererProps,
  IVirtualizedListRendererState
> {
  private viewport;
  private elementRefs;
  private elementsObserver: IntersectionObserver;
  private currentAnchor;
  private hasAddedObserver: boolean;

  constructor(props: IVirtualizedListRendererProps) {
    super(props);
    this.elementRefs = {};
    this.hasAddedObserver = false;
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
    this.addItems();
  }

  public componentWillUnmount() {
    this.elementsObserver.disconnect();
  }

  public componentDidUpdate() {
    this.addIntersectionObservers();
  }

  public render() {
    return (
      <React.Fragment>
      <div
        data-name="viewport"
        ref={ref => (this.viewport = ref)}
        style={{
          height: "100vh",
          overflowY: "auto",
        }}>
        <div data-name="runway">
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

  private addItems() {
    const itemsToRender: any = [];

    for (let i = 0; i < ITEMS_LENGTH; i++) {
        const item = this.getItem(i);
        itemsToRender.push(item);
    }

    this.setState({
      itemsToRender: itemsToRender.reverse(),
    });
  }

  private getItem(index: number): JSX.Element {
    return (
      <div key={index} className="item" id={this.getElementId(index)} ref={ref => this.saveRef(index, ref)}>
        Index: {index}
      </div>
    );
  }

  private saveRef(index, ref) {
    this.elementRefs[index] = ref;
  }

  private addIntersectionObservers() {
    if (this.hasAddedObserver || Object.keys(this.elementRefs).length !== ITEMS_LENGTH) {
      return;
    }
    this.hasAddedObserver = true;

    this.elementsObserver = new IntersectionObserver(
      entries => entries.forEach(this.handleIntersection),
      {
        root: this.viewport,
        rootMargin: "0px",
        threshold: _.range(0, 1.0, 0.01)
      }
    );

    // observe each element in list
    _.each(this.elementRefs, element => {
      this.elementsObserver.observe(element);
    });
  }

  private handleIntersection(entry: IntersectionObserverEntry) {
    if (this.isIntersectingTopOfViewport(entry) && this.currentAnchor !== entry.target) {
      this.currentAnchor = entry.target;
      this.setState({
        currentAnchorId: this.currentAnchor.id
      });
    }
  }

  private isIntersectingTopOfViewport(entry: IntersectionObserverEntry) {
    return entry.intersectionRatio > 0 &&
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
