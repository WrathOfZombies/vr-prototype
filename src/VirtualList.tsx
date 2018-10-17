import * as React from "react";
import "normalize.css/normalize.css";
import "./styles.css";
import { Page } from "./components";

export interface IVirtualizedListRendererProps {
  items: any[];
}

export interface IVirtualizedListRendererState {
  isRenderingItems: boolean;
  itemsToRender: JSX.Element[];
  renderedStartIndex: number;
  renderedStopIndex: number;
}

export default class VirtualizedListRenderer extends React.Component<
  IVirtualizedListRendererProps,
  IVirtualizedListRendererState
> {
  private viewport;
  private renderBufferSize = 10;
  private isVirtualized: boolean;

  constructor(props: IVirtualizedListRendererProps) {
    super(props);
    this.viewport = React.createRef();
    this.isVirtualized = false;
    this.state = {
      itemsToRender: [],
      renderedStopIndex: 0,
      renderedStartIndex: 0,
      isRenderingItems: false
    };
  }

  public componentDidMount() {
    this.addMoreItems();
    requestAnimationFrame(() => {
      this.viewport.current.scrollTop = this.viewport.current.scrollHeight;
    });
  }

  public render() {
    if (this.state.isRenderingItems) {
      requestAnimationFrame(() => {
        this.setState({
          isRenderingItems: false
        });
      });
    }

    return (
      <div
        data-name="viewport"
        ref={this.viewport}
        onScroll={this.onScroll}
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

  private onScroll = (event) => {
    if (
      this.state.isRenderingItems ||
      event.target.scrollTop > 400
    ) {
      return;
    }

    this.addMoreItems();
  }

  private addMoreItems() {
    let { renderedStopIndex } = this.state;
    const { items } = this.props;
    renderedStopIndex += this.renderBufferSize;
    const itemsToRender: any = [];

    for (let i = 0; i <= renderedStopIndex; i++) {
        const page = items[i];
        const item = <Page key={i} {...page} />;
        itemsToRender.push(item);
    }

    this.setState({
      itemsToRender: itemsToRender.reverse(),
      renderedStopIndex,
      isRenderingItems: true
    });
  }
}
