import React from "react";
import SVGViewer from "react-svg-viewer";
import "./App.css";

const SVG_W = 500;
const SVG_H = 500;
const CIRCLE_RADIUS = 20;

function nextColour(i) {
  let width = 127;
  let centre = 128;
  let r = Math.sin(i) * width + centre;
  let g = Math.sin(i + 1) * width + centre;
  let b = Math.sin(i + 2) * width + centre;
  let hex = ((r << 16) | (g << 8) | b).toString(16);
  return `#${hex}`;
}

function App() {
  let total = 100;
  let circles = [];
  for (let i = 0; i < total; ++i) {
    let cx = Math.random() * SVG_W;
    let cy = Math.random() * SVG_H;
    let r = Math.random() * CIRCLE_RADIUS + CIRCLE_RADIUS * 0.5;
    let fill = nextColour(i);
    circles.push([cx, cy, r, fill]);
  }
  return (
    <div className="App">
      <SVGViewer width={500} height={500}>
        {circles.map(([cx, cy, r, fill], i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill={fill} />
        ))}
      </SVGViewer>
    </div>
  );
}

export default App;
