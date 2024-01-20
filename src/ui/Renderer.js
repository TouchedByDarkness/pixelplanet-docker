/*
 * parent class for Renderer
 */
import {
  VIEW_UPDATE_DELAY,
} from '../core/constants';
import { updateView } from '../store/actions';

/* eslint-disable class-methods-use-this */

class Renderer {
  store;
  // object for user controls
  controls = {
    update() {},
  };

  // chunk loader
  chunkLoader = null;
  // needs to be known for lazy loading THREE
  is3D = null;
  // force renderer to rebuild whole view or
  // to "subrender" known view next tick
  forceNextRender = true;
  forceNextSubrender = true;
  // current position (subclass decies what it means),
  // will be changed by controls
  // TODO might be better as private and with a getter but no setter to avoid
  //      misconseption of it being writeable. Might have performance impact.
  view = [0, 0, 0];
  //
  #storeViewTimeout = null;

  constructor(store) {
    this.store = store;
    this.loadViewFromState();
  }

  get chunks() {
    return this.chunkLoader.chunks;
  }

  get recChunkIds() {
    if (!this.chunkLoader) return [];
    return this.chunkLoader.recChunkIds;
  }

  destructor() {
    this.chunkLoader?.destructor();
    this.cancelStoreViewInState();
  }

  updateView(view) {
    for (let i = 0; i < view.length; i += 1) {
      this.view[i] = view[i];
    }
  }

  /*
   * view is in both storea and renderer,
   * the one in store is for UI elements and not
   * updated in real time for performance reasons
   */
  loadViewFromState() {
    if (!this.store) return;
    this.updateView(this.store.getState().canvas.view);
  }

  cancelStoreViewInState() {
    if (this.#storeViewTimeout) {
      clearTimeout(this.#storeViewTimeout);
      this.#storeViewTimeout = null;
    }
  }

  storeViewInState() {
    if (!this.store) return;
    this.cancelStoreViewInState();
    this.#storeViewTimeout = setTimeout(() => {
      this.#storeViewTimeout = null;
      this.store.dispatch(updateView(this.view));
    }, VIEW_UPDATE_DELAY);
  }

  render() {
    return this.controls.update();
  }

  renderPixel() {}

  updateCanvasData() {}

  isChunkInView() {
    return true;
  }

  gc() {
    this.chunkLoader?.gc(this);
  }
}

export default Renderer;
