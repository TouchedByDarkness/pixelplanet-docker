/*
 * Hooks for renderer
 *
 */

/*
 * hooks for rendering
 */
import {
  getRenderer,
  initRenderer,
} from '../../ui/rendererFactory';
import {
  selectColor,
} from '../actions';

export default (store) => (next) => (action) => {
  const { type } = action;

  switch (type) {
    case 'SET_HISTORICAL_TIME': {
      const state = store.getState();
      const renderer = getRenderer();
      const {
        historicalDate: oldDate,
        historicalTime: oldTime,
      } = state.canvas;
      renderer.updateOldHistoricalTime(
        oldDate,
        oldTime,
      );
      break;
    }
    case 'SELECT_HOVER_COLOR': {
      const renderer = getRenderer();
      const clr = renderer.getPointedColor();
      if (clr !== null) {
        store.dispatch(selectColor(clr));
      }
      break;
    }
    default:
      // nothing
  }

  // executed after reducers
  const ret = next(action);

  const state = store.getState();

  switch (type) {
    case 'RELOAD_URL':
    case 's/SELECT_CANVAS':
    case 's/REC_ME': {
      const renderer = getRenderer();
      const { is3D } = state.canvas;

      if (is3D === renderer.is3D) {
        renderer.updateCanvasData(state);
        if (type === 'RELOAD_URL') {
          renderer.updateView(state.canvas.view);
        }
      } else {
        initRenderer(store, is3D);
      }

      // TODO this looks shade, i.e. when a nwe Renderer appears
      if (state.canvas.isHistoricalView) {
        const {
          historicalDate,
          historicalTime,
          historicalCanvasSize,
        } = state.canvas;
        renderer.updateHistoricalTime(
          historicalDate,
          historicalTime,
          historicalCanvasSize,
        );
      }

      break;
    }

    case 's/TGL_EASTER_EGG': {
      const renderer = getRenderer();
      const { is3D } = state.canvas;
      if (is3D) {
        initRenderer(store, !renderer.is3D);
      }
      break;
    }

    case 'SET_HISTORICAL_TIME': {
      const {
        historicalDate,
        historicalTime,
        historicalCanvasSize,
      } = state.canvas;
      const renderer = getRenderer();
      renderer.updateHistoricalTime(
        historicalDate,
        historicalTime,
        historicalCanvasSize,
      );
      break;
    }

    case 's/CHG_TEMPLATE':
    case 's/TGL_OVENABLED':
    case 's/TGL_SMALLPXLS':
    case 's/REM_TEMPLATE':
    case 's/UPD_TEMPLATE_IMG':
    case 's/SET_O_OPACITY':
    case 'REQ_BIG_CHUNK':
    case 'PRE_LOADED_BIG_CHUNK':
    case 'REC_BIG_CHUNK':
    case 'REC_BIG_CHUNK_FAILURE': {
      const renderer = getRenderer();
      renderer.forceNextRender = true;
      break;
    }

    case 's/TGL_GRID':
    case 'ALLOW_SETTING_PXL': {
      const renderer = getRenderer();
      renderer.forceNextSubrender = true;
      break;
    }

    case 's/TGL_HISTORICAL_VIEW': {
      const renderer = getRenderer();
      // update view to clamp scale
      renderer.updateView(renderer.view, renderer.view);
      renderer.forceNextRender = true;
      break;
    }

    case 's/SELECT_HOLD_PAINT': {
      if (action.value) {
        const renderer = getRenderer();
        renderer.controls.holdPaintStarted?.(action.immediate);
      }
      break;
    }

    case 's/SET_MOVE_U':
    case 's/SET_MOVE_V':
    case 's/SET_MOVE_W':
    case 's/CANCEL_MOVE': {
      if (!action.value) {
        const renderer = getRenderer();
        renderer.storeViewInState();
      }
      break;
    }

    case 'SET_VIEW_COORDINATES': {
      const renderer = getRenderer();
      renderer.updateView(action.view);
      renderer.storeViewInState();
      break;
    }

    case 'SET_SCALE': {
      const renderer = getRenderer();
      const [x, y] = renderer.view;
      renderer.updateView([x, y, action.scale], action.zoompoint);
      renderer.storeViewInState();
      break;
    }

    case 'REC_SET_PXLS': {
      const renderer = getRenderer();
      renderer.forceNextSubrender = true;
      const { coolDownSeconds } = action;
      if (coolDownSeconds < 0
        && renderer && renderer.controls
        && renderer.controls.gotCoolDownDelta
      ) {
        renderer.controls.gotCoolDownDelta(coolDownSeconds * -1);
      }
      break;
    }

    default:
      // nothing
  }

  return ret;
};
