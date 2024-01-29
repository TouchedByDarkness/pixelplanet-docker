/*
 * Entrypoint for main client script
 */

import { persistStore } from 'redux-persist';

import {
  createKeyDownHandler,
  createKeyUpHandler,
} from './controls/keypress';
import {
  initTimer,
  urlChange,
  setMobile,
  windowResize,
} from './store/actions';
import {
  fetchMe,
} from './store/actions/thunks';
import pixelTransferController from './ui/PixelTransferController';
import store from './store/store';
import renderApp from './components/App';
import { getRenderer } from './ui/rendererFactory';
import templateLoader from './ui/templateLoader';
import socketClient from './socket/SocketClient';
import { GC_INTERVAL } from './core/constants';

persistStore(store, {}, () => {
  window.addEventListener('message', store.dispatch);

  store.dispatch({ type: 'HYDRATED' });

  pixelTransferController.initialize(store, socketClient, getRenderer);

  // TODO should be in middleware
  templateLoader.initialize(store);

  window.addEventListener('hashchange', () => {
    store.dispatch(urlChange());
  });

  // check if on mobile
  window.imMobile = function checkMobile() {
    delete window.imMobile;
    store.dispatch(setMobile(true));
  };
  document.addEventListener('touchstart', window.imMobile, { once: true });

  // listen for resize
  function onWindowResize() {
    store.dispatch(windowResize());
  }
  window.addEventListener('resize', onWindowResize);
  onWindowResize();

  store.dispatch(initTimer());

  store.dispatch(fetchMe());

  socketClient.initialize(store, pixelTransferController, getRenderer);
});

(function load() {
  const onLoad = () => {
    window.name = 'main';
    renderApp(document.getElementById('app'), store);

    const onKeyDown = createKeyDownHandler(store);
    const onKeyUp = createKeyUpHandler(store);
    document.addEventListener('keydown', onKeyDown, false);
    document.addEventListener('keyup', onKeyUp, false);

    // garbage collection
    setInterval(() => {
      const renderer = getRenderer();
      renderer.gc();
    }, GC_INTERVAL);

    document.removeEventListener('DOMContentLoaded', onLoad);
  };
  document.addEventListener('DOMContentLoaded', onLoad, false);
}());
