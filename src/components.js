import React from "react"
export const PAGE_HEIGHT = 300

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
      height: "300vh",
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

export const Page = props => (
  <div
    {...props}
    style={{
      background: "linear-gradient(white, gray)",
      height: PAGE_HEIGHT,
      ...props.style
    }}
  >
    {props.children || "Page"}
  </div>
)
