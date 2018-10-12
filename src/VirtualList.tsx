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
  private renderBufferSize = 5;
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
          <div
            data-name="buffer"
            style={{
              height: "300px",
              background: "lightgray"
            }}
          />
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
    let { renderedStopIndex, renderedStartIndex} = this.state;
    const { items } = this.props;
    renderedStopIndex += this.renderBufferSize;
    const itemsToRender: any = [];

    renderedStartIndex = this.isVirtualized ? Math.max(0, renderedStopIndex - 10) : renderedStartIndex;

    for (let i = renderedStartIndex; i <= renderedStopIndex; i++) {
        const page = items[i];
        const item = <Page key={i} {...page} />;
        itemsToRender.push(item);
    }

    this.setState({
      itemsToRender: itemsToRender.reverse(),
      renderedStopIndex,
      renderedStartIndex,
      isRenderingItems: true
    });
  }
}
