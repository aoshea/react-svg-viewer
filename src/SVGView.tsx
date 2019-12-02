import * as React from "react";

export interface SVGViewProps {
  width: number;
  height: number;
  scaleFactor: number;
  maxScale: number;
  minScale: number;
  children: any;
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

enum ActionTypes {
  DRAG_START = "DRAG_START",
  DRAG_END = "DRAG_END",
  OFFSET = "OFFSET",
  SET_MATRIX = "SET_MATRIX"
}

type Action =
  | { type: ActionTypes.DRAG_START }
  | { type: ActionTypes.DRAG_END }
  | { type: ActionTypes.OFFSET; payload: Point }
  | { type: ActionTypes.SET_MATRIX; payload: SVGMatrix };

const initialState: ViewState = {
  dragging: false,
  offset: { x: 0, y: 0 },
  vtm: null
};

function reducer(state: ViewState, action: Action) {
  switch (action.type) {
    case ActionTypes.DRAG_START:
      return {
        ...state,
        dragging: true
      };
    case ActionTypes.DRAG_END:
      return {
        ...state,
        dragging: false
      };
    case ActionTypes.OFFSET:
      return {
        ...state,
        offset: action.payload
      };
    case ActionTypes.SET_MATRIX:
      return {
        ...state,
        vtm: action.payload
      };
    default:
      throw new Error();
  }
}

function getVTM(vtm: SVGMatrix): string {
  return vtm && `matrix(${vtm.a} ${vtm.b} ${vtm.c} ${vtm.d} ${vtm.e} ${vtm.f})`;
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
      dispatch({ type: ActionTypes.SET_MATRIX, payload: vtm });
    },
    [props.scaleFactor, scaleSVGMatrix, getPointFromEvent]
  );

  React.useEffect(() => {
    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => window.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  let handleStart = (event: Touch | MouseEvent) => {
    let point = getPointFromEvent(event);
    dispatch({
      type: ActionTypes.OFFSET,
      payload: point
    });
    dispatch({ type: ActionTypes.DRAG_START });
  };

  let handleInputStart = (e: React.SyntheticEvent<SVGSVGElement>) => {
    if (window.TouchEvent && e.nativeEvent instanceof TouchEvent) {
      handleStart(e.nativeEvent.touches[0]);
    }
    if (e.nativeEvent instanceof MouseEvent) {
      handleStart(e.nativeEvent);
    }
  };

  let handleMove = (event: Touch | MouseEvent) => {
    if (!state.dragging) return;
    let point = getPointFromEvent(event);
    let vtm = translateSVGMatrix(
      point.x - state.offset.x,
      point.y - state.offset.y
    );
    dispatch({
      type: ActionTypes.SET_MATRIX,
      payload: vtm
    });
    dispatch({ type: ActionTypes.OFFSET, payload: point });
  };

  let handleInputMove = (e: React.SyntheticEvent<SVGSVGElement>) => {
    if (window.TouchEvent && e.nativeEvent instanceof TouchEvent) {
      handleMove(e.nativeEvent.touches[0]);
    }
    if (e.nativeEvent instanceof MouseEvent) {
      handleMove(e.nativeEvent);
    }
  };

  let handleInputEnd = () => {
    dispatch({ type: ActionTypes.DRAG_END });
  };

  return (
    <div>
      <svg
        ref={ref}
        width={props.width}
        height={props.height}
        onMouseDown={handleInputStart}
        onMouseMove={handleInputMove}
        onMouseUp={handleInputEnd}
        onTouchStart={handleInputStart}
        onTouchMove={handleInputMove}
        onTouchEnd={handleInputEnd}
        xmlns="http://www.w3.org/2000/svg"
      >
        <g transform={getVTM(state.vtm)}>{props.children}</g>
      </svg>
    </div>
  );
}
