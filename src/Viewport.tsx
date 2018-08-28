import * as React from "react";
import * as _ from "lodash";
import { ICommonProps } from "./components";

export default class ViewPort extends React.Component<{} & ICommonProps> {
  viewport: HTMLDivElement;
  runway: HTMLDivElement;
  runwayObserver: MutationObserver;

  constructor(props) {
    super(props);
    this.handleMutations = this.handleMutations.bind(this);
  }

  componentDidMount() {
    this.runway = this.viewport.firstElementChild as any;
    const config: MutationObserverInit = {
      attributes: false,
      childList: true,
      subtree: true
    };
    this.runwayObserver = new MutationObserver(this.handleMutations);
    this.runwayObserver.observe(this.runway, config);
  }

  handleMutations([mutation]: MutationRecord[]) {
    const runwayHeight = this.runway.clientHeight;
  }

  componentWillUnmount() {
    this.runwayObserver.disconnect();
  }

  render() {
    const { element, style, ...rest } = this.props;
    return (
      <div
        ref={(ref: any) => {
          this.viewport = ref;
          element(ref);
        }}
        style={{
          height: "100vh",
          overscrollBehavior: "none",
          overflowY: "auto",
          overflowX: "hidden",
          willChange: "scroll-position",
          backfaceVisibility: "hidden",
          transform: "translate3d(0,0,0)",
          ...style
        }}
        {...rest}
      />
    );
  }
}
