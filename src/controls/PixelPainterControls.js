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
import {
  HOLD_PAINT,
} from '../core/constants';

class PixelPainterControls {
  store;
  renderer;
  viewport;
  //
  clickTapStartView = [0, 0];
  clickTapStartTime = 0;
  clickTapStartCoords = [0, 0];
  tapStartDist = 50;
  // stored speed for acceleration
  speedScalar = 0;
  // on mouse: true as long as left mouse button is pressed
  isClicking = false;
  // on touch: true if more than one finger on screen
  isMultiTap = false;
  // on touch: true if current tab was ever more than one figher at any time
  wasEverMultiTap = false;
  // on touch: when painting with holdPaint is active
  isTapPainting = false;
  // on touch: timeout to detect long-press
  tapTimeout = null;
  // time of last tick
  prevTime = Date.now();
  // if we are waiting before placing pixel via holdPaint again
  coolDownDelta = false;

  constructor(renderer, viewport, store) {
    this.store = store;
    this.renderer = renderer;
    this.viewport = viewport;

    this.onMouseDown = this.onMouseDown.bind(this);
    this.onAuxClick = this.onAuxClick.bind(this);
    this.onMouseOut = this.onMouseOut.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onWheel = this.onWheel.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onTouchStart = this.onTouchStart.bind(this);
    this.onTouchEnd = this.onTouchEnd.bind(this);
    this.onTouchMove = this.onTouchMove.bind(this);

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

  // eslint-disable-next-line class-methods-use-this
  dispose() {}

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
        PixelPainterControls.placePixel(
          store,
          renderer,
          this.screenToWorld([clientX, clientY]),
        );
      }
      this.viewport.style.cursor = 'auto';
    }
    renderer.storeViewInState();
  }

  static getTouchCenter(event) {
    let x = 0;
    let y = 0;
    for (const { pageX, pageY } of event.touches) {
      x += pageX;
      y += pageY;
    }
    const { length } = event.touches;
    return [x / length, y / length];
  }

  /*
   * place pixel
   * either with given colorIndex or with selected color if none is given
   */
  static placePixel(store, renderer, cell, colorIndex = null) {
    const state = store.getState();
    if (state.canvas.isHistoricalView) {
      return;
    }
    const selectedColor = colorIndex
      ?? PixelPainterControls.getWantedColor(state, renderer, cell);
    if (selectedColor === null) {
      return;
    }
    const { viewscale: scale } = renderer;

    if (state.gui.autoZoomIn && scale < 8) {
      renderer.updateView([cell[0], cell[1], 12]);
      return;
    }

    // allow placing of pixel just on low zoomlevels
    if (scale < 3) {
      return;
    }

    const curColor = renderer.getColorIndexOfPixel(...cell);
    if (selectedColor === curColor) {
      return;
    }

    // placing unset pixel
    if (selectedColor < state.canvas.clrIgnore) {
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
    document.activeElement.blur();

    this.renderer.cancelStoreViewInState();
    this.clearTabTimeout();
    this.isTapPainting = false;
    this.clickTapStartTime = Date.now();
    this.clickTapStartCoords = PixelPainterControls.getTouchCenter(event);
    this.clickTapStartView = this.renderer.view;

    if (event.touches.length > 1) {
      this.tapStartDist = PixelPainterControls.getMultiTouchDistance(event);
      this.isMultiTap = true;
      this.wasEverMultiTap = true;
    } else {
      this.isMultiTap = false;
      this.wasEverMultiTap = false;
      const state = this.store.getState();
      if (state.gui.holdPaint) {
        this.tapTimeout = setTimeout(() => {
          this.isTapPainting = true;
          PixelPainterControls.placePixel(
            this.store,
            this.renderer,
            this.screenToWorld(this.clickTapStartCoords),
          );
        }, 200);
      } else {
        this.tapTimeout = setTimeout(() => {
          // check for longer tap to select taped color
          this.selectColorFromScreen(this.clickTapStartCoords);
        }, 600);
      }
    }
  }

  onTouchEnd(event) {
    event.preventDefault();
    if (event.touches.length) {
      // still other touches left
      return;
    }

    const { store, renderer } = this;
    if (!this.wasEverMultiTap) {
      const { pageX, pageY } = event.changedTouches[0];
      const { clickTapStartCoords, clickTapStartTime } = this;
      const coordsDiff = [
        clickTapStartCoords[0] - pageX,
        clickTapStartCoords[1] - pageY,
      ];
      // thresholds for single click / holding
      if (clickTapStartTime > Date.now() - 580
        && coordsDiff[0] < 2 && coordsDiff[1] < 2
      ) {
        PixelPainterControls.placePixel(
          store,
          this.renderer,
          this.screenToWorld([pageX, pageY]),
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
    const state = this.store.getState();

    const [clientX, clientY] = PixelPainterControls.getTouchCenter(event);
    if (this.isMultiTap !== multiTouch) {
      this.wasEverMultiTap = true;
      // if one finger got lifted or added, reset clickTabStart
      this.isMultiTap = multiTouch;
      this.clickTapStartCoords = [clientX, clientY];
      this.clickTapStartView = this.renderer.view;
      this.tapStartDist = PixelPainterControls.getMultiTouchDistance(event);
      return;
    }
    const { clickTapStartView, clickTapStartCoords } = this;
    // pinch
    if (multiTouch) {
      this.clearTabTimeout();
      const a = event.touches[0];
      const b = event.touches[1];
      const dist = Math.sqrt(
        (b.pageX - a.pageX) ** 2 + (b.pageY - a.pageY) ** 2,
      );
      const pinchScale = dist / this.tapStartDist;
      const [x, y] = this.renderer.view;
      this.renderer.updateView([x, y, clickTapStartView[2] * pinchScale]);
    }
    // pan
    if (!state.gui.holdPaint || multiTouch) {
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
    } else if (!this.wasEverMultiTap && !this.coolDownDelta) {
      // hold paint
      if (this.isTapPainting) {
        PixelPainterControls.placePixel(
          this.store,
          this.renderer,
          this.screenToWorld([clientX, clientY]),
        );
      } else {
        // while we are waiting for isTapPainting to trigger track coordinates
        this.clickTapStartCoords = [clientX, clientY];
        this.clickTapStartView = this.renderer.view;
        this.tapStartDist = PixelPainterControls.getMultiTouchDistance(event);
      }
    }
  }

  clearTabTimeout() {
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

  holdPaintStarted(immediate) {
    // if hold painting is started by keyboard,
    // we immeidately have to place, and not just when mousemove starts
    if (!immediate) {
      return;
    }
    const { hover } = this.store.getState().canvas;
    if (hover) {
      PixelPainterControls.placePixel(
        this.store,
        this.renderer,
        hover,
      );
    }
  }

  onWheel(event) {
    event.preventDefault();
    event.stopPropagation();
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

  static getWantedColor(state, renderer, cell) {
    if (state.gui.holdPaint === HOLD_PAINT.HISTORY) {
      return renderer.getColorIndexOfPixel(...cell, true);
    }
    return state.canvas.selectedColor;
  }

  screenToWorld(screenCoor) {
    return screenToWorld(
      this.renderer.view,
      this.renderer.viewscale,
      this.viewport,
      screenCoor,
    );
  }

  /*
   * set hover from screen coordinates
   * @param [x, y] screen coordinates
   * @return null if hover didn't changed,
   *         hover if it changed
   */
  setHoverFromScrrenCoor(screenCoor) {
    const { store } = this;
    const state = store.getState();
    const { hover: prevHover } = state.canvas;
    const hover = this.screenToWorld(screenCoor);
    const [x, y] = hover;

    /* out of bounds check */
    const { canvasSize } = state.canvas;
    const maxCoords = canvasSize / 2;
    if (x < -maxCoords || x >= maxCoords
      || y < -maxCoords || y >= maxCoords
    ) {
      if (prevHover) {
        store.dispatch(unsetHover());
      }
      return null;
    }

    if (!prevHover || prevHover[0] !== x || prevHover[1] !== y) {
      store.dispatch(setHover(hover));
      return hover;
    }
    return null;
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
      const hover = this.setHoverFromScrrenCoor([clientX, clientY]);
      if (!hover) {
        return;
      }
      const state = this.store.getState();
      if (!this.coolDownDelta && state.gui.holdPaint) {
        /* hold paint */
        PixelPainterControls.placePixel(
          this.store,
          this.renderer,
          hover,
        );
      }
    }
  }

  onMouseOut() {
    const { store, viewport } = this;
    viewport.style.cursor = 'auto';
    store.dispatch(unsetHover());
    this.clearTabTimeout();
  }

  selectColorFromScreen(center) {
    const { renderer, store } = this;
    if (this.renderer.viewscale < 3) {
      return;
    }
    const coords = this.screenToWorld(center);
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
    this.selectColorFromScreen([clientX, clientY]);
  }

  update() {
    let time = Date.now();
    const { moveU, moveV, moveW } = this.store.getState().gui;
    const isAccelerating = (moveU || moveV || moveW);

    if (!isAccelerating) {
      this.prevTime = time;
      this.speedScalar = 0;
      return false;
    }
    // set to time since last tick
    time -= this.prevTime;
    this.prevTime += time;

    this.speedScalar = Math.min(1, this.speedScalar + 0.025);

    const [x, y, scale] = this.renderer.view;

    const directionalStep = time * 0.4 / scale * this.speedScalar;
    let scaleFactor = scale >= 1.0 ? 1.0005 : 1.0003;
    scaleFactor **= moveW * this.speedScalar;

    this.renderer.updateView([
      x + directionalStep * moveU,
      y + directionalStep * moveV,
      scale * scaleFactor ** time,
    ]);

    return true;
  }
}

export default PixelPainterControls;
