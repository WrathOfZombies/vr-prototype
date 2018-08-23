import * as React from "react";
import * as _ from "lodash";
export const PAGE_HEIGHT = "auto";

export const ViewPort = props => (
  <div
    {...props}
    style={{
      overflow: "hidden",
      height: "100vh",
      ...props.style,
      overscrollBehavior: "contain"
    }}
  />
);

export const Buffer = ({ top, bottom, style, ...rest }) => (
  <div
    style={{
      background: `linear-gradient(${
        top ? "lightgreen, cyan" : "lightgreen, green"
      })`,
      height: "100vh",
      ...style
    }}
    {...rest}
  >
    {top ? "TOP" : bottom ? "BOTTOM" : ""} BUFFER
  </div>
);

export const Runway = props => {
  return (
    <div
      {...props}
      style={{
        display: "flex",
        flexDirection: "column",
        ...props.style,
        transformStyle: "preserve-3d"
      }}
    />
  );
};

export class Page extends React.Component<any> {
  render() {
    return (
      <div
        {...this.props}
        style={{
          border: "dashed 1px rgba(0,0,0,0.4)",
          height: PAGE_HEIGHT,
          // transform: "translateY(200px)",
          // animation: "moveUp 0.34s ease forwards",
          ...this.props.style
        }}
      >
        <h3
          style={{
            textAlign: "center",
            fontWeight: 200,
            backgroundColor: "#EAEAEA",
            margin: "0px",
            padding: "15px"
          }}
        >
          {this.props.id}
        </h3>
        {_.map(this.props.cards, item => (
          <Card key={item.id} card={item.card} image={item.image} />
        ))}
      </div>
    );
  }
}

export class Card extends React.PureComponent<any> {
  render() {
    if (!this.props.card) {
      return null;
    }
    const data: any = _.head(this.props.card.posts);
    return (
      <div
        className="card"
        {...this.props}
        style={{
          display: "grid",
          gridTemplateColumns: "80px auto auto",
          gridTemplateAreas:
            "'avatar name name' 'avatar email phone' 'avatar message message'",
          backgroundColor: "#F4F4F4",
          ...this.props.style
        }}
      >
        <img
          src={this.props.image}
          style={{
            gridArea: "avatar",
            width: "60px",
            height: "60px",
            margin: "25px 10px 10px",
            borderRadius: "50%"
          }}
        />
        <h1
          style={{
            gridArea: "name",
            marginBottom: "8px",
            fontWeight: 200
          }}
        >
          {this.props.card.name}
        </h1>
        <a
          style={{
            gridArea: "email",
            margin: 0
          }}
          href="#"
        >
          {this.props.card.email}
        </a>
        <p
          style={{
            gridArea: "phone",
            margin: "0px 15px 0px 0px",
            textAlign: "right"
          }}
        >
          {this.props.card.phone}
        </p>
        <p
          style={{
            gridArea: "message",
            margin: "0px 15px 25px 0px"
          }}
        >
          <span style={{ fontWeight: 600, display: "block" }}>
            {data.sentence}
          </span>
          <br />
          {data.paragraph}
        </p>
      </div>
    );
  }
}
