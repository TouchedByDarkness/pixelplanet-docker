import Palette from '../../core/Palette';
import {
  getIdFromObject,
  getHistoricalCanvasSize,
  getMaxTiledZoom,
  dateToString,
} from '../../core/utils';


import {
  DEFAULT_SCALE,
  DEFAULT_CANVAS_ID,
} from '../../core/constants';

/*
 * checks if toggling historical view is neccessary
 * in given state or if properties have to change.
 * Changes the state inplace.
 * @param state
 * @return same state with fixed historical view
 */
function fixHistoryIfNeccessary(state) {
  const {
    canvasEndDate,
    isHistoricalView,
    is3D,
  } = state;

  if (is3D && isHistoricalView) {
    state.isHistoricalView = false;
  } else if (canvasEndDate && !isHistoricalView) {
    state.isHistoricalView = true;
    if (!state.historicalDate) {
      state.historicalDate = dateToString(canvasEndDate);
      state.historicalTime = '0000';
    }
  }
  if (state.isHistoricalView) {
    const {
      historicalDate,
      canvasId,
      canvasSize,
      canvases,
    } = state;
    state.historicalCanvasSize = getHistoricalCanvasSize(
      historicalDate,
      canvasSize,
      canvases[canvasId]?.historicalSizes,
    );
  }
  return state;
}

/*
 * parse canvas data
 * @param canvas object from api/me
 * @param prevCoords from state
 * @return partial canvas specific state
 */
function getCanvasArgs(canvas, prevCoords) {
  const clrIgnore = canvas.cli || 0;
  const {
    size: canvasSize,
    sd: canvasStartDate = null,
    ed: canvasEndDate = null,
    ident: canvasIdent,
    colors,
  } = canvas;
  const is3D = !!canvas.v;
  // get previous view if possible
  let view = [0, 0, DEFAULT_SCALE];
  let selectedColor = clrIgnore;
  if (prevCoords) {
    view = prevCoords.view;
    selectedColor = prevCoords.selectedColor;
  }
  const palette = new Palette(colors, 0);
  return {
    clrIgnore,
    canvasSize,
    canvasStartDate,
    canvasEndDate,
    canvasIdent,
    is3D,
    view,
    selectedColor,
    palette,
  };
}

/*
 * parse url hash and sets view to coordinates
 * @param canvases Object with all canvas information
 * @return incomplete state based on URL, null if failed
 */
function getViewFromURL(canvases) {
  const { hash } = window.location;
  const almost = decodeURIComponent(hash).substring(1)
    .split(',');

  let canvasIdent = almost[0];
  let canvasId = getIdFromObject(canvases, canvasIdent);
  if (!canvasId && window.ssv.dc) {
    canvasId = window.ssv.dc;
  }
  if (!canvasId || (!window.ssv?.backupurl && canvases[canvasId].ed)) {
    canvasId = DEFAULT_CANVAS_ID;
    const canvas = canvases[DEFAULT_CANVAS_ID];
    if (!canvas) {
      return null;
    }
    canvasIdent = canvas.ident;
  }
  const is3D = !!canvases[canvasId].v;

  const x = parseInt(almost[1], 10) || 0;
  const y = parseInt(almost[2], 10) || 0;
  let z = parseInt(almost[3], 10);
  /*
    * third number in 3D is z coordinate
    * in 2D it is logarithmic scale
    */
  if (Number.isNaN(z)) {
    z = (is3D) ? 0 : DEFAULT_SCALE;
  } else if (!is3D) {
    z = 2 ** (z / 10);
  }

  return {
    canvasId,
    canvasIdent,
    view: [x, y, z],
  };
}

const initialState = {
  canvasId: null,
  canvasIdent: 'xx',
  canvases: {},
  canvasSize: 65536,
  historicalCanvasSize: 65536,
  is3D: null,
  canvasStartDate: null,
  canvasEndDate: null,
  canvasMaxTiledZoom: getMaxTiledZoom(65536),
  palette: new Palette([[0, 0, 0]]),
  clrIgnore: 0,
  selectedColor: 0,
  // view is not up-to-date, changes are delayed compared to renderer.view
  view: [0, 0, DEFAULT_SCALE],
  isHistoricalView: false,
  historicalDate: null,
  historicalTime: null,
  hover: null,
  // last canvas view and selectedColor
  // just used to get back to the previous state when switching canvases
  // { [canvasId]: { view: [x, y, z], selectedColor: c }, ... }
  prevCanvasState: {},
};

export default function canvasReducer(
  state = initialState,
  action,
) {
  switch (action.type) {
    case 'SET_HISTORICAL_TIME': {
      const {
        date,
        time,
      } = action;
      return fixHistoryIfNeccessary({
        ...state,
        historicalDate: date,
        historicalTime: time,
      });
    }

    case 's/TGL_HISTORICAL_VIEW': {
      if (state.is3D || state.canvasEndDate) {
        return state;
      }
      return fixHistoryIfNeccessary({
        ...state,
        isHistoricalView: !state.isHistoricalView,
      });
    }

    case 'UPDATE_VIEW': {
      const { view } = action;
      return {
        ...state,
        view: [...view],
      };
    }

    case 'RELOAD_URL': {
      const { canvases } = state;
      const urlState = getViewFromURL(canvases);
      if (!urlState) {
        return state;
      }
      if (urlState.canvasId !== state.canvasId) {
        const { canvasId } = urlState;
        const canvas = canvases[canvasId];
        const canvasState = getCanvasArgs(
          canvas,
          state.prevCanvasState[canvasId],
        );
        return {
          ...state,
          ...canvasState,
          ...urlState,
        };
      }
      return {
        ...state,
        ...urlState,
      };
    }

    case 'SELECT_COLOR': {
      return {
        ...state,
        selectedColor: action.color,
      };
    }

    case 'SET_HOVER': {
      const { hover } = action;
      return {
        ...state,
        hover,
      };
    }

    case 'UNSET_HOVER': {
      return {
        ...state,
        hover: null,
      };
    }

    case 's/SELECT_CANVAS': {
      let { canvasId } = action;
      const {
        canvases,
        prevCanvasState,
        canvasId: prevCanvasId,
      } = state;
      let canvas = canvases[canvasId];
      if (!canvas) {
        canvasId = DEFAULT_CANVAS_ID;
        canvas = canvases[DEFAULT_CANVAS_ID];
      }
      const canvasState = getCanvasArgs(canvas, prevCanvasState[canvasId]);

      return fixHistoryIfNeccessary({
        ...state,
        ...canvasState,
        canvasId,
        // reset if last canvas was retired
        isHistoricalView: (!state.canvasEndDate && state.isHistoricalView),
        // remember view and color
        prevCanvasState: {
          ...state.prevCanvasState,
          [prevCanvasId]: {
            view: state.view,
            selectedColor: state.selectedColor,
          },
        },
      });
    }

    case 's/REC_ME': {
      const { canvases } = action;
      let {
        canvasId,
        view,
      } = state;

      if (canvasId === null) {
        ({ canvasId, view } = getViewFromURL(canvases));
      }
      const canvas = canvases[canvasId];
      const canvasState = getCanvasArgs(
        canvas,
        state.prevCanvasState[canvasId],
      );

      return fixHistoryIfNeccessary({
        ...state,
        ...canvasState,
        canvasId,
        canvases,
        view,
      });
    }

    default:
      return state;
  }
}
