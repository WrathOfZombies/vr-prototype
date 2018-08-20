import React from "react"
import _ from "lodash"
export const PAGE_HEIGHT = "auto"

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
)

export const Buffer = ({ top, bottom, style, ...rest }) => (
  <div
    style={{
      background: `linear-gradient(${
        top ? "lightgreen, cyan" : "lightgreen, green"
      })`,
      height: "50vh",
      ...style
    }}
    {...rest}
  >
    {top ? "TOP" : bottom ? "BOTTOM" : ""} BUFFER
  </div>
)

export const Runway = props => {
  return (
    <div
      {...props}
      style={{
        display: "flex",
        flexDirection: "column",
        ...props.style
      }}
    />
  )
}

export class Page extends React.Component {
  render() {
    return (
      <div
        {...this.props}
        style={{
          border: "dashed 2px blue",
          margin: "10px 0",
          background: "linear-gradient(white, gray)",
          height: PAGE_HEIGHT,
          ...this.props.style
        }}
      >
        {_.map(this.props.cards, item => (
          <Card key={item.id} card={item.card} image={item.image} />
        ))}
      </div>
    )
  }
}

export class Card extends React.PureComponent {
  render() {
    if (!this.props.card) {
      return null
    }
    const data = _.head(this.props.card.posts)
    return (
      <div
        className="card"
        {...this.props}
        style={{
          display: "grid",
          border: "dashed 1px red",
          gridTemplateColumns: "80px auto auto",
          gridTemplateAreas:
            '"avatar name name" "avatar email phone" "avatar message message"',
          fontFamily: "'San Francisco', 'Segoe UI', Tahoma",
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
            margin: "0px"
          }}
        >
          {this.props.card.phone}
        </p>
        <p
          style={{
            gridArea: "message"
          }}
        >
          <span style={{ fontWeight: 600, display: "block" }}>
            {data.sentence}
          </span>
          <br />
          {data.paragraph}
        </p>
      </div>
    )
  }
}
