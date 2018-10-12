import * as React from "react";
import * as _ from "lodash";
import { ICommonProps } from "./components";

export class ViewPort extends React.Component<{ onScroll: any } & ICommonProps> {
  viewport: HTMLDivElement;

  constructor(props) {
    super(props);
  }

  render() {
    const { element, ...rest } = this.props;

    return (
      <div
        ref={(ref: any) => {
          element(ref);
        }}
        onScroll={this.props.onScroll}
        style={{
          height: "100vh",
          overflowY: "auto",
        }}
        {...rest}
      />
    );
  }
}
