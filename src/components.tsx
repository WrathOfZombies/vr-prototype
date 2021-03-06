import * as React from "react";
import * as _ from "lodash";

export interface ICommonProps {
  element: (ref: any) => void;
  style?: React.CSSProperties;
}

export class Runway extends React.Component<{} & ICommonProps> {
  render() {
    const { element, style, ...rest } = this.props;
    return (
      <div
        ref={ref => element && element(ref)}
        style={{
          display: "flex",
          flexDirection: "column",
          transformStyle: "preserve-3d",
          overscrollBehavior: "none",
          ...style
        }}
        {...rest}
      />
    );
  }
}

export const Buffer = ({ element, name, ...props }) => (
  <div
    data-id={name}
    ref={ref => element && element(ref)}
    // style={{
    //   background: `linear-gradient(${"lightgreen, cyan"})`,
    //   height: "100vh"
    // }}
  >
    <Greek />
    <Greek />
    <Greek />
    <Greek />
    <Greek />
    <Greek />
  </div>
);

export interface IPageProps {
  id: string | number;
  cards: {
    id: string | number;
    card: any;
    image: any;
  };
}

export const Page = ({ id, cards }) => {
  return (
    <div data-id={`page-${id}`}>
      <h3
        style={{
          textAlign: "center",
          fontWeight: 200,
          backgroundColor: "#EAEAEA",
          margin: "0px",
          padding: "15px"
        }}
      >
        Page {id}
      </h3>
      {_.map(cards, item => (
        <Card key={item.id} card={item.card} image={item.image} />
      ))}
    </div>
  );
};

export const Greek = () => {
  return (
    <div
      className="card"
      style={{
        display: "grid",
        gridTemplateColumns: "80px auto auto",
        gridTemplateAreas:
          "'avatar name name' 'avatar email phone' 'avatar message message'",
        backgroundColor: "#F4F4F4",
        padding: "20px 0 0 10px",
        animation: "blink 1.5s ease-in-out infinite forwards"
      }}
    >
      <div
        style={{
          backgroundColor: "#DDD",
          gridArea: "avatar",
          width: "60px",
          height: "60px",
          margin: "25px 10px 10px",
          borderRadius: "50%"
        }}
      />
      <div
        style={{
          backgroundColor: "#CCC",
          gridArea: "name",
          marginBottom: "8px",
          fontWeight: 200,
          height: "36px"
        }}
      />
      <div
        style={{
          backgroundColor: "#DDD",
          gridArea: "email",
          margin: "0px 15px 10px 0px",
          height: "21px"
        }}
      />
      <div
        style={{
          backgroundColor: "#DDD",
          gridArea: "phone",
          margin: "0px 15px 10px 0px",
          textAlign: "right",
          height: "21px"
        }}
      />
      <div
        style={{
          backgroundColor: "#EEE",
          gridArea: "message",
          margin: "0px 15px 25px 0px",
          height: "100px"
        }}
      />
    </div>
  );
};

export const Card = ({ card, image }) => {
  const data: any = _.head(card.posts);
  return (
    <div
      className="card"
      style={{
        display: "grid",
        gridTemplateColumns: "80px auto auto",
        gridTemplateAreas:
          "'avatar name name' 'avatar email phone' 'avatar message message'",
        backgroundColor: "#F4F4F4",
        transform: "scale(0.85)",
        animation: "scaleUp 0.45s ease-in-out forwards"
      }}
    >
      <img
        src={image}
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
        {card.name}
      </h1>
      <a
        style={{
          gridArea: "email",
          margin: 0
        }}
        href="#"
      >
        {card.email}
      </a>
      <p
        style={{
          gridArea: "phone",
          margin: "0px 15px 0px 0px",
          textAlign: "right"
        }}
      >
        {card.phone}
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
};

export const DebugPanel = ({ settings, toggle, addPage }) => (
  <div id="debug">
    <label>
      <input
        type="checkbox"
        defaultChecked={settings.isPagingEnabled}
        onClick={e => toggle("isPagingEnabled")}
      />
      isPagingEnabled?
    </label>
    <label>
      <input
        type="checkbox"
        defaultChecked={settings.startBottomUp}
        onClick={e => toggle("startBottomUp")}
      />
      startBottomUp?
    </label>
    <button onClick={e => addPage(true)}>Add page before</button>
    <button onClick={e => addPage(false)}>Add page after</button>
  </div>
);
