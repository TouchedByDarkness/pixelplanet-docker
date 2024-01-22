/*
 * Controls for 2D canvases
 *
 * keycodes:
 * https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values
 *
 */

import {
  setHover,
  unsetHover,
  selectColor,
} from '../store/actions';
import pixelTransferController from '../ui/PixelTransferController';
import {
  screenToWorld,
  getChunkOfPixel,
  getOffsetOfPixel,
} from '../core/utils';

class PixelPainterControls {
  store;
  renderer;
  viewport;
  //
  clickTapStartView = [0, 0];
  clickTapStartTime = 0;
  clickTapStartCoords = [0, 0];
  tapStartDist = 50;
  //
  // on mouse: true as long as left mouse button is pressed
  // on touch: set to true when one finger touches the screen
  //           set to false when second finger touches or touch ends
  isClicking = false;
  // on touch: true if more than one finger on screen
  isMultiTab = false;
  // on touch: timeout to detect long-press
  tapTimeout = null;
  /*
   * if we are shift-hold-painting
   * 0: no
   * 1: left shift
   * 2: right shift
   */
  holdPainting = 0;
  // if we are moving
  moveU = 0;
  moveV = 0;
  moveW = 0;
  prevTime = Date.now();
  // if we are waiting before placing pixel via holdPainting again
  coolDownDelta = false;

  constructor(renderer, viewport, store) {
    this.store = store;
    this.renderer = renderer;
    this.viewport = viewport;

    this.onMouseDown = this.onMouseDown.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
    this.onAuxClick = this.onAuxClick.bind(this);
    this.onMouseOut = this.onMouseOut.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onWheel = this.onWheel.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onTouchStart = this.onTouchStart.bind(this);
    this.onTouchEnd = this.onTouchEnd.bind(this);
    this.onTouchMove = this.onTouchMove.bind(this);

    document.addEventListener('keydown', this.onKeyDown, false);
    document.addEventListener('keyup', this.onKeyUp, false);
    viewport.addEventListener('auxclick', this.onAuxClick, false);
    viewport.addEventListener('mousedown', this.onMouseDown, false);
    viewport.addEventListener('mousemove', this.onMouseMove, false);
    viewport.addEventListener('mouseup', this.onMouseUp, false);
    viewport.addEventListener('wheel', this.onWheel, false);
    viewport.addEventListener('touchstart', this.onTouchStart, false);
    viewport.addEventListener('touchend', this.onTouchEnd, false);
    viewport.addEventListener('touchmove', this.onTouchMove, false);
    viewport.addEventListener('mouseout', this.onMouseOut, false);
    viewport.addEventListener('touchcancel', this.onMouseOut, false);
  }

  dispose() {
    document.removeEventListener('keydown', this.onKeyDown, false);
    document.removeEventListener('keyup', this.onKeyUp, false);
  }

  gotCoolDownDelta(delta) {
    this.coolDownDelta = true;
    setTimeout(() => {
      this.coolDownDelta = false;
    }, delta * 1000);
  }

  onMouseDown(event) {
    event.preventDefault();
    document.activeElement.blur();

    if (event.button === 0) {
      this.renderer.cancelStoreViewInState();
      this.isClicking = true;
      const { clientX, clientY } = event;
      this.clickTapStartTime = Date.now();
      this.clickTapStartCoords = [clientX, clientY];
      this.clickTapStartView = this.renderer.view;
      const { viewport } = this;
      setTimeout(() => {
        if (this.isClicking) {
          viewport.style.cursor = 'move';
        }
      }, 300);
    }
  }

  onMouseUp(event) {
    event.preventDefault();

    const { store, renderer } = this;
    if (event.button === 0) {
      this.isClicking = false;
      const { clientX, clientY } = event;
      const { clickTapStartCoords, clickTapStartTime } = this;
      const coordsDiff = [
        clickTapStartCoords[0] - clientX,
        clickTapStartCoords[1] - clientY,
      ];
      // thresholds for single click / holding
      if (clickTapStartTime > Date.now() - 250
        && coordsDiff[0] < 2 && coordsDiff[1] < 2) {
        const cell = screenToWorld(
          renderer.view,
          renderer.viewscale,
          this.viewport,
          [clientX, clientY],
        );
        PixelPainterControls.placePixel(
          store,
          renderer,
          cell,
        );
      }
      this.viewport.style.cursor = 'auto';
    }
    renderer.storeViewInState();
  }

  static getTouchCenter(event) {
    switch (event.touches.length) {
      case 1: {
        const { pageX, pageY } = event.touches[0];
        return [pageX, pageY];
      }
      case 2: {
        const pageX = Math.floor(0.5
            * (event.touches[0].pageX + event.touches[1].pageX));
        const pageY = Math.floor(0.5
            * (event.touches[0].pageY + event.touches[1].pageY));
        return [pageX, pageY];
      }
      default:
        break;
    }
    return null;
  }

  /*
   * place pixel
   * either with given colorIndex or with selected color if none is given
   */
  static placePixel(store, renderer, cell, colorIndex = null) {
    const state = store.getState();
    const { autoZoomIn } = state.gui;
    const { clrIgnore, isHistoricalView } = state.canvas;
    const { viewscale: scale } = renderer;
    const selectedColor = (colorIndex === null)
      ? state.canvas.selectedColor
      : colorIndex;

    if (isHistoricalView) return;

    if (autoZoomIn && scale < 8) {
      renderer.updateView([cell[0], cell[1], 12]);
      return;
    }

    // allow placing of pixel just on low zoomlevels
    if (scale < 3) return;

    const curColor = renderer.getColorIndexOfPixel(...cell);
    if (selectedColor === curColor) {
      return;
    }

    // placing unset pixel
    if (selectedColor < clrIgnore) {
      const { palette } = state.canvas;
      const { rgb } = palette;
      let clrOffset = selectedColor * 3;
      const r = rgb[clrOffset++];
      const g = rgb[clrOffset++];
      const b = rgb[clrOffset];
      if (palette.getIndexOfColor(r, g, b) === curColor) {
        return;
      }
    }

    const { canvasSize } = state.canvas;
    const [x, y] = cell;

    // apu link
    // 5275_-8713
    // 5398_-8614
    if (x > 5275 && y > -8713 && x < 5398 && y < -8614) {
      if (state.canvas.canvasId === '0') {
        window.location.href = 'https://files.catbox.moe/gh2wtr.mp4';
        return;
      }
    }

    const maxCoords = canvasSize / 2;
    if (x < -maxCoords || x >= maxCoords || y < -maxCoords || y >= maxCoords) {
      return;
    }
    const [i, j] = getChunkOfPixel(canvasSize, x, y);
    const offset = getOffsetOfPixel(canvasSize, x, y);
    pixelTransferController.tryPlacePixel(
      i, j, offset,
      selectedColor,
      curColor,
    );
  }

  static getMultiTouchDistance(event) {
    if (event.touches.length < 2) {
      return 1;
    }
    const a = event.touches[0];
    const b = event.touches[1];
    return Math.sqrt(
      (b.pageX - a.pageX) ** 2 + (b.pageY - a.pageY) ** 2,
    );
  }

  onTouchStart(event) {
    event.preventDefault();
    event.stopPropagation();
    document.activeElement.blur();

    this.renderer.cancelStoreViewInState();
    this.clickTapStartTime = Date.now();
    this.clickTapStartCoords = PixelPainterControls.getTouchCenter(event);
    this.clickTapStartView = this.renderer.view;

    if (event.touches.length > 1) {
      this.tapStartDist = PixelPainterControls.getMultiTouchDistance(event);
      this.isMultiTab = true;
      this.clearTabTimeout();
    } else {
      this.isClicking = true;
      this.isMultiTab = false;
      this.tapTimeout = setTimeout(() => {
        // check for longer tap to select taped color
        PixelPainterControls.selectColor(
          this.store,
          this.viewport,
          this.renderer,
          this.clickTapStartCoords,
        );
      }, 600);
    }
  }

  onTouchEnd(event) {
    event.preventDefault();
    event.stopPropagation();

    const { store, renderer } = this;
    if (event.touches.length === 0 && this.isClicking) {
      const { pageX, pageY } = event.changedTouches[0];
      const { clickTapStartCoords, clickTapStartTime } = this;
      const coordsDiff = [
        clickTapStartCoords[0] - pageX,
        clickTapStartCoords[1] - pageY,
      ];
      // thresholds for single click / holding
      if (clickTapStartTime > Date.now() - 580
        && coordsDiff[0] < 2 && coordsDiff[1] < 2) {
        const cell = screenToWorld(
          renderer.view,
          renderer.viewscale,
          this.viewport,
          [pageX, pageY],
        );
        PixelPainterControls.placePixel(
          store,
          this.renderer,
          cell,
        );
        setTimeout(() => {
          store.dispatch(unsetHover());
        }, 500);
      }
    }
    renderer.storeViewInState();
    this.clearTabTimeout();
  }

  onTouchMove(event) {
    event.preventDefault();
    event.stopPropagation();

    const multiTouch = (event.touches.length > 1);

    const [clientX, clientY] = PixelPainterControls.getTouchCenter(event);
    if (this.isMultiTab !== multiTouch) {
      // if one finger got lifted or added, reset clickTabStart
      this.isMultiTab = multiTouch;
      this.clickTapStartCoords = [clientX, clientY];
      this.clickTapStartView = this.renderer.view;
      this.tapStartDist = PixelPainterControls.getMultiTouchDistance(event);
    } else {
      // pan
      const { clickTapStartView, clickTapStartCoords } = this;
      const [lastPosX, lastPosY] = clickTapStartView;

      const deltaX = clientX - clickTapStartCoords[0];
      const deltaY = clientY - clickTapStartCoords[1];
      if (deltaX > 2 || deltaY > 2) {
        this.clearTabTimeout();
      }
      const { viewscale: scale } = this.renderer;
      this.renderer.updateView([
        lastPosX - (deltaX / scale),
        lastPosY - (deltaY / scale),
      ]);

      // pinch
      if (multiTouch) {
        this.clearTabTimeout();

        const a = event.touches[0];
        const b = event.touches[1];
        const { tapStartDist } = this;
        const dist = Math.sqrt(
          (b.pageX - a.pageX) ** 2 + (b.pageY - a.pageY) ** 2,
        );
        const pinchScale = dist / tapStartDist;
        const [x, y] = this.renderer.view;
        this.renderer.updateView([x, y, clickTapStartView[2] * pinchScale]);
      }
    }
  }

  clearTabTimeout() {
    this.isClicking = false;
    if (this.tapTimeout) {
      clearTimeout(this.tapTimeout);
      this.tapTimeout = null;
    }
  }

  zoom(direction, origin) {
    const [x, y, scale] = this.renderer.view;
    const deltaScale = scale >= 1.0 ? 1.1 : 1.04;
    const newScale = (direction > 0) ? scale * deltaScale : scale / deltaScale;
    this.renderer.updateView([x, y, newScale], origin);
    this.renderer.storeViewInState();
  }

  step(direction) {
    const [x, y, scale] = this.renderer.view;
    const [dx, dy] = direction.map((z) => z * 100.0 / scale);
    this.renderer.updateView([x + dx, y + dy]);
    this.renderer.storeViewInState();
  }

  onWheel(event) {
    event.preventDefault();
    document.activeElement.blur();

    const { deltaY } = event;
    const { store } = this;
    const { hover } = store.getState().canvas;
    const origin = hover || null;
    if (deltaY < 0) {
      this.zoom(1, origin);
    }
    if (deltaY > 0) {
      this.zoom(-1, origin);
    }
  }

  onMouseMove(event) {
    event.preventDefault();

    const { clientX, clientY } = event;
    const { renderer, isClicking } = this;
    const { viewscale } = renderer;
    if (isClicking) {
      if (Date.now() < this.clickTapStartTime + 100) {
        // 100ms threshold till starting to pan
        return;
      }
      const { clickTapStartView, clickTapStartCoords } = this;
      const [lastPosX, lastPosY] = clickTapStartView;
      const deltaX = clientX - clickTapStartCoords[0];
      const deltaY = clientY - clickTapStartCoords[1];

      this.renderer.updateView([
        lastPosX - (deltaX / viewscale),
        lastPosY - (deltaY / viewscale),
      ]);
    } else {
      const { store } = this;
      const state = store.getState();
      const { hover } = state.canvas;
      const { view } = renderer;
      const screenCoor = screenToWorld(
        view,
        viewscale,
        this.viewport,
        [clientX, clientY],
      );
      const [x, y] = screenCoor;

      /* out of bounds check */
      const { canvasSize } = state.canvas;
      const maxCoords = canvasSize / 2;
      if (x < -maxCoords || x >= maxCoords
        || y < -maxCoords || y >= maxCoords
      ) {
        if (hover) {
          store.dispatch(unsetHover());
        }
        return;
      }

      if (!hover || hover[0] !== x || hover[1] !== y) {
        store.dispatch(setHover(screenCoor));
        /* shift placing */
        if (!this.coolDownDelta) {
          switch (this.holdPainting) {
            case 1: {
              /* left shift: from selected color */
              PixelPainterControls.placePixel(
                store,
                this.renderer,
                screenCoor,
              );
              break;
            }
            case 2: {
              /* right shift: from historical view */
              const colorIndex = this.renderer
                .getColorIndexOfPixel(x, y, true);
              if (colorIndex !== null) {
                PixelPainterControls.placePixel(
                  store,
                  this.renderer,
                  screenCoor,
                  colorIndex,
                );
              }
              break;
            }
            default:
          }
        }
      }
    }
  }

  onMouseOut() {
    const { store, viewport } = this;
    viewport.style.cursor = 'auto';
    store.dispatch(unsetHover());
    this.holdPainting = 0;
    this.clearTabTimeout();
  }

  static selectColor(store, viewport, renderer, center) {
    if (renderer.viewscale < 3) {
      return;
    }
    const coords = screenToWorld(
      renderer.view,
      renderer.viewscale,
      viewport,
      center,
    );
    const clrIndex = renderer.getColorIndexOfPixel(...coords);
    if (clrIndex !== null) {
      store.dispatch(selectColor(clrIndex));
    }
  }

  onAuxClick(event) {
    const { which, clientX, clientY } = event;
    // middle mouse button
    if (which !== 2) {
      return;
    }
    event.preventDefault();

    PixelPainterControls.selectColor(
      this.store,
      this.viewport,
      this.renderer,
      [clientX, clientY],
    );
  }

  onKeyUp(event) {
    /*
     * key locations
     */
    switch (event.code) {
      case 'ArrowUp':
      case 'KeyW':
        this.moveV = 0;
        return;
      case 'ArrowLeft':
      case 'KeyA':
        this.moveU = 0;
        return;
      case 'ArrowDown':
      case 'KeyS':
        this.moveV = 0;
        return;
      case 'ArrowRight':
      case 'KeyD':
        this.moveU = 0;
        return;
      case 'KeyE':
        this.moveW = 0;
        return;
      case 'KeyQ':
        this.moveW = 0;
        return;
      default:
    }

    /*
     * key char
     */
    switch (event.key) {
      case 'Shift':
      case 'CapsLock':
        this.holdPainting = 0;
        break;
      default:
    }
  }

  onKeyDown(event) {
    // ignore key presses if modal is open or chat is used
    if (event.target.nodeName === 'INPUT'
      || event.target.nodeName === 'TEXTAREA'
    ) {
      return;
    }

    /*
     * key location
     */
    switch (event.code) {
      case 'ArrowUp':
      case 'KeyW':
        this.moveV = -1;
        return;
      case 'ArrowLeft':
      case 'KeyA':
        this.moveU = -1;
        return;
      case 'ArrowDown':
      case 'KeyS':
        this.moveV = 1;
        return;
      case 'ArrowRight':
      case 'KeyD':
        this.moveU = 1;
        return;
      case 'KeyE':
        this.moveW = 1;
        return;
      case 'KeyQ':
        this.moveW = -1;
        return;
      default:
    }

    /*
     * key char
     */
    switch (event.key) {
      case '+':
        this.zoom(1);
        return;
      case '-':
        this.zoom(-1);
        return;
      case 'Control':
      case 'Shift': {
        const { store } = this;
        const state = store.getState();
        const { hover } = state.canvas;
        if (hover) {
          if (event.key === 'Control') {
            // ctrl
            const clrIndex = this.renderer.getColorIndexOfPixel(...hover);
            store.dispatch(selectColor(clrIndex));
            return;
          }
          if (event.location === KeyboardEvent.DOM_KEY_LOCATION_LEFT) {
            // left shift
            this.holdPainting = 1;
            PixelPainterControls.placePixel(store, this.renderer, hover);
            return;
          }
          if (event.location === KeyboardEvent.DOM_KEY_LOCATION_RIGHT) {
            // right shift
            this.holdPainting = 2;
            const colorIndex = this.renderer
              .getColorIndexOfPixel(...hover, true);
            if (colorIndex !== null) {
              PixelPainterControls.placePixel(
                store,
                this.renderer,
                hover,
                colorIndex,
              );
            }
          }
        }
        break;
      }
      default:
    }
  }

  update() {
    let time = Date.now();
    const { moveU, moveV, moveW } = this;

    if (!(moveU || moveV || moveW)) {
      this.prevTime = time;
      return false;
    }
    // set to time since last tick
    time -= this.prevTime;
    this.prevTime += time;

    const [x, y, scale] = this.renderer.view;

    const directionalStep = time * 0.4 / scale;
    let scaleFactor = scale >= 1.0 ? 1.0005 : 1.0003;
    scaleFactor **= moveW;

    this.renderer.updateView([
      x + directionalStep * moveU,
      y + directionalStep * moveV,
      scale * scaleFactor ** time,
    ]);

    return true;
  }
}

export default PixelPainterControls;
