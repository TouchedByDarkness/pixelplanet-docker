/*
 * keypress actions
 */
import { t } from 'ttag';
import copy from '../utils/clipboard';
import {
  toggleGrid,
  toggleHistoricalView,
  toggleEasterEgg,
  togglePixelNotify,
  toggleMvmCtrls,
  toggleMute,
  selectCanvas,
  selectHoverColor,
  selectHoldPaint,
  setMoveU,
  setMoveV,
  setMoveW,
} from '../store/actions';
import {
  toggleOVEnabled,
} from '../store/actions/templates';
import { HOLD_PAINT } from '../core/constants';
import { notify } from '../store/actions/thunks';

const charKeys = ['g', 'h', 'x', 'm', 't', 'r', 'z', '+', '-'];

export function createKeyUpHandler(store) {
  return (event) => {
    /*
     * key locations
     */
    switch (event.code) {
      case 'ArrowUp':
      case 'KeyW':
        store.dispatch(setMoveV(0));
        return;
      case 'ArrowLeft':
      case 'KeyA':
        store.dispatch(setMoveU(0));
        return;
      case 'ArrowDown':
      case 'KeyS':
        store.dispatch(setMoveV(0));
        return;
      case 'ArrowRight':
      case 'KeyD':
        store.dispatch(setMoveU(0));
        return;
      case 'KeyE':
        store.dispatch(setMoveW(0));
        return;
      case 'KeyQ':
        store.dispatch(setMoveW(0));
        return;
      default:
    }

    /*
     * key char
     */
    switch (event.key) {
      case '+':
        store.dispatch(setMoveW(0));
        return;
      case '-':
        store.dispatch(setMoveW(0));
        return;
      case 'Shift':
      case 'CapsLock':
        store.dispatch(selectHoldPaint(HOLD_PAINT.OFF));
        break;
      default:
    }
  };
}

export function createKeyDownHandler(store) {
  return (event) => {
    // ignore key presses if modal is open or chat is used
    if (event.target.nodeName === 'INPUT'
      || event.target.nodeName === 'TEXTAREA'
    ) {
      return;
    }

    let { key } = event;

    const num = Number(key);
    if (!Number.isNaN(num) && num > 0) {
      // switch to canvas on num keys
      const { canvases, canvasId: curCanvasId } = store.getState().canvas;
      const canvasIds = Object.keys(canvases).filter((id) => !canvases[id].hid);
      if (num <= canvasIds.length) {
        const canvasId = canvasIds[num - 1];
        if (canvasId !== curCanvasId) {
          store.dispatch(selectCanvas(canvasId));
          const canvasName = canvases[canvasId].title;
          store.dispatch(notify(t`Switched to ${canvasName}`));
        }
      }
      return;
    }

    /*
     * key locations
     */
    switch (event.code) {
      case 'ArrowUp':
      case 'KeyW':
        store.dispatch(setMoveV(-1));
        return;
      case 'ArrowLeft':
      case 'KeyA':
        store.dispatch(setMoveU(-1));
        return;
      case 'ArrowDown':
      case 'KeyS':
        store.dispatch(setMoveV(1));
        return;
      case 'ArrowRight':
      case 'KeyD':
        store.dispatch(setMoveU(1));
        return;
      case 'KeyE':
        store.dispatch(setMoveW(1));
        return;
      case 'KeyQ':
        store.dispatch(setMoveW(-1));
        return;
      default:
    }

    /*
     * key char
     */
    switch (event.key) {
      case '+':
        store.dispatch(setMoveW(1));
        return;
      case '-':
        store.dispatch(setMoveW(-1));
        return;
      case 'Control':
        store.dispatch(selectHoverColor(-1));
        return;
      case 'Shift': {
        if (event.location === KeyboardEvent.DOM_KEY_LOCATION_LEFT) {
          // left shift
          store.dispatch(selectHoldPaint(HOLD_PAINT.PENCIL, true));
          return;
        }
        if (event.location === KeyboardEvent.DOM_KEY_LOCATION_RIGHT) {
          // right shift
          store.dispatch(selectHoldPaint(
            (store.getState().gui.easterEgg)
              ? HOLD_PAINT.OVERLAY : HOLD_PAINT.HISTORY,
            true,
          ));
          return;
        }
        return;
      }
      default:
    }

    /*
     * if char of key isn't used by a keybind,
     * we check if the key location is where a
     * key that is used would be on QWERTY
     */
    if (!charKeys.includes(key)) {
      key = event.code;
      if (!key.startsWith('Key')) {
        return;
      }
      key = key.slice(-1).toLowerCase();
    }

    switch (key) {
      case 'g':
        store.dispatch(toggleGrid());
        store.dispatch(notify((store.getState().gui.showGrid)
          ? t`Grid ON`
          : t`Grid OFF`));
        return;
      case 'h':
        if (window?.ssv.backupurl) {
          store.dispatch(toggleHistoricalView());
        }
        return;
      case 'x':
        store.dispatch(togglePixelNotify());
        store.dispatch(notify((store.getState().gui.showPixelNotify)
          ? t`Pixel Notify ON`
          : t`Pixel Notify OFF`));
        return;
      case 'm':
        store.dispatch(toggleMute());
        store.dispatch(notify((store.getState().gui.mute)
          ? t`Muted Sound`
          : t`Unmuted Sound`));
        return;
      case 'n':
        store.dispatch(toggleMvmCtrls());
        return;
      case 'r': {
        const { hover } = store.getState().canvas;
        const text = hover.join('_');
        copy(text);
        store.dispatch(notify(t`Copied!`));
        return;
      }
      case 't': {
        store.dispatch(toggleOVEnabled());
        store.dispatch(notify((store.getState().templates.ovEnabled)
          ? t`Overlay ON`
          : t`Overlay OFF`));
        return;
      }
      case 'z':
        store.dispatch(toggleEasterEgg());
        store.dispatch(notify((store.getState().gui.easterEgg)
          ? t`Easter Egg ON`
          : t`Easter Egg OFF`));
        break;
      default:
    }
  };
}
