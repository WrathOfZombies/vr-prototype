import * as React from "react";
import "normalize.css/normalize.css";
import "./styles.css";
import { Page } from "./components";

export interface IVirtualizedListRendererProps {
  items: any[];
}

export interface IVirtualizedListRendererState {
  itemsToRender: JSX.Element[];
  itemId: string;
  height: string;
}

const ITEMS_LENGTH = 50;

export default class VirtualizedListRenderer extends React.Component<
  IVirtualizedListRendererProps,
  IVirtualizedListRendererState
> {
  private viewport;

  constructor(props: IVirtualizedListRendererProps) {
    super(props);
    this.viewport = React.createRef();
    this.onValueChanged = this.onValueChanged.bind(this);
    this.changeHeight = this.changeHeight.bind(this);
    this.state = {
      itemsToRender: [],
      itemId: "",
      height: ""
    };
  }

  public componentDidMount() {
    this.addItems();
  }

  public render() {
    return (
      <React.Fragment>
      <div
        data-name="viewport"
        ref={this.viewport}
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
      <div className="item" id={this.getElementId(index)}>
        Index: {index}
      </div>
    );
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
    element.style.height = height;
  }
}

export const DebugPanel = ({ itemId, height, onValueChanged, changeHeight }) => (
  <div id="debug">
    <label>
    <input
        type="text"
        value={itemId}
        defaultValue={"element number to change height"}
        onChange={e => onValueChanged(e, "itemId")}
      />
    </label>
    <label>
      <input
        type="text"
        value={height}
        defaultValue={"# of pixels to change height"}
        onChange={e => onValueChanged(e, "height")}
      />
    </label>
    <button onClick={e => changeHeight(true)}>Grow element</button>
    <button onClick={e => changeHeight(false)}>Shrink element</button>
  </div>
);
