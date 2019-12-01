import * as React from "react";
import * as ReactDOM from "react-dom";

import SVGView from "./SVGView";

const App = () => {
  return (
    <div>
      <h1>Heading</h1>
      <SVGView
        width={300}
        height={200}
        scaleFactor={0.1}
        minScale={0.5}
        maxScale={2}
      />
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById("app"));
