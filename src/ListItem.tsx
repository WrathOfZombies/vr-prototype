import * as React from "react";

export interface IListItemRendererProps {
  observer: any;
  id: string;
  index: number;
}

export interface IListItemRendererState {
}

export default class ListItem extends React.Component<
IListItemRendererProps,
IListItemRendererState
> {
  private ref;

  public componentDidMount() {
    if (!this.props.observer) {
      throw new Error("WTF! we need to be observed!!");
    }

    console.debug("Observing....", this.props.index);
    this.props.observer.observe(this.ref);
  }

  public componentWillUnmount() {
    console.debug("UnObserving....", this.props.index);
    this.props.observer.unobserve(this.ref);
  }

  public render() {
    return (
      <div key={this.props.index} className="item" id={this.props.id} ref={ref => this.ref = ref}>
        Index: {this.props.index}
      </div>
    );
  }
}
