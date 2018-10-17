import * as React from "react";
import "normalize.css/normalize.css";
import "./styles.css";
import { Page } from "./components";

export interface IVirtualizedListRendererProps {
  items: any[];
}

export interface IVirtualizedListRendererState {
  itemsToRender: JSX.Element[];
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
    this.state = {
      itemsToRender: []
    };
  }

  public componentDidMount() {
    this.addItems();
  }

  public render() {
    return (
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
    const id = `item-${index}`;
    return (
      <div className="item" id={id}>
        Index: {index}
      </div>
    );
  }
}
