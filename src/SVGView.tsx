import * as React from "react";

export interface SVGViewProps {
  width: number;
  height: number;
  scaleFactor: number;
  maxScale: number;
  minScale: number;
}

type Point = {
  x: number;
  y: number;
};

type ViewState = {
  offset: Point;
  dragging: boolean;
  vtm: SVGMatrix;
};

type Action =
  | { type: "DRAG_START" }
  | { type: "DRAG_END" }
  | { type: "OFFSET"; payload: Point }
  | { type: "MATRIX"; payload: SVGMatrix };

const initialState: ViewState = {
  dragging: false,
  offset: { x: 0, y: 0 },
  vtm: null
};

function reducer(state: ViewState, action: Action) {
  switch (action.type) {
    case "DRAG_START":
      return {
        ...state,
        dragging: true
      };
    case "DRAG_END":
      return {
        ...state,
        dragging: false
      };
    case "OFFSET":
      return {
        ...state,
        offset: action.payload
      };
    case "MATRIX":
      return {
        ...state,
        vtm: action.payload
      };
    default:
      throw new Error();
  }
}

export default function SVGView(props: SVGViewProps) {
  const ref = React.useRef<SVGSVGElement>(null);
  const [state, dispatch] = React.useReducer(reducer, initialState);

  let translateSVGMatrix = React.useCallback(
    (x, y) => {
      let vtm = state.vtm || ref.current.createSVGMatrix();
      return ref.current
        .createSVGMatrix()
        .translate(x, y)
        .multiply(vtm);
    },
    [state.vtm]
  );

  let scaleSVGMatrix = React.useCallback(
    (scale, x, y) => {
      let vtm = state.vtm || ref.current.createSVGMatrix();

      if (vtm.a > props.maxScale && scale > 1) return vtm;
      if (vtm.a < props.minScale && scale < 1) return vtm;

      return ref.current
        .createSVGMatrix()
        .translate(x, y)
        .scale(scale, scale)
        .translate(-x, -y)
        .multiply(vtm);
    },
    [state.vtm, props.maxScale, props.minScale]
  );

  let getPointFromEvent = React.useCallback(e => {
    let svgPoint = ref.current.createSVGPoint();
    svgPoint.x = e.clientX;
    svgPoint.y = e.clientY;
    return svgPoint.matrixTransform(ref.current.getScreenCTM().inverse());
  }, []);

  let handleWheel = React.useCallback(
    e => {
      e.preventDefault();
      let point = getPointFromEvent(e);
      let dir = e.deltaY < 0 ? -1 : 1;
      let newScale = 1 + dir * props.scaleFactor;
      let vtm = scaleSVGMatrix(newScale, point.x, point.y);
      dispatch({ type: "MATRIX", payload: vtm });
    },
    [props.scaleFactor, scaleSVGMatrix, getPointFromEvent]
  );

  React.useEffect(() => {
    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => window.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  return (
    <div>
      <svg
        ref={ref}
        width={props.width}
        height={props.height}
        xmlns="http://www.w3.org/2000/svg"
      ></svg>
    </div>
  );
}
