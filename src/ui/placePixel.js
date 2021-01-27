/*
 * Place pixel via Websocket
 * Always just one pixelrequest, queue additional requests to send later
 * Pixels get predicted on the client and reset if server refused
 *
 * @flow
 * */
import {
  notify,
  setPlaceAllowed,
  sweetAlert,
  gotCoolDownDelta,
  pixelFailure,
  setWait,
  placedPixel,
  pixelWait,
  updatePixel,
} from '../actions';
import ProtocolClient from '../socket/ProtocolClient';

let pixelTimeout = null;
/*
 * cache of pixels that still are to set
 * [{i: i, j: j, pixels: [[offset, color],...]}, ...]
 */
let pixelQueue = [];
/*
 * requests that got predicted on client and yet have to be
 * received from the server
 * [[i, j, offset, color], ...]
 */
let clientPredictions = [];
/*
 * values of last request
 * {i: i, j: j, pixels: [[offset, color], ...}
 */
let lastRequestValues = {};


function requestFromQueue(store) {
  if (!pixelQueue.length) {
    pixelTimeout = null;
    return;
  }

  /* timeout to warn user when Websocket is dysfunctional */
  pixelTimeout = setTimeout(() => {
    pixelQueue = [];
    pixelTimeout = null;
    store.dispatch(setPlaceAllowed(true));
    store.dispatch(sweetAlert(
      'Error :(',
      'Didn\'t get an answer from pixelplanet. Maybe try to refresh?',
      'error',
      'OK',
    ));
  }, 5000);

  lastRequestValues = pixelQueue.shift();
  const { i, j, pixels } = lastRequestValues;
  ProtocolClient.requestPlacePixels(i, j, pixels);
  store.dispatch(setPlaceAllowed(false));

  // TODO:
  // this is for resending after captcha returned
  // window is ugly, put it into redux or something
  window.pixel = {
    i,
    j,
    pixels,
  };
}

export function receivePixelUpdate(
  store,
  i: number,
  j: number,
  offset: number,
  color: ColorIndex,
) {
  for (let p = 0; p < clientPredictions.length; p += 1) {
    const predPxl = clientPredictions[p];
    if (predPxl[0] === i
      && predPxl[1] === j
      && predPxl[2] === offset
    ) {
      clientPredictions.splice(i, 1);
      return;
    }
  }
  store.dispatch(updatePixel(i, j, offset, color));
}

/*
 * Revert predictions starting at given pixel
 * @param i, j, offset data of the first pixel that got rejected
 */
function revertPredictionsAt(
  store,
  sI: number,
  sJ: number,
  sOffset: number,
) {
  let p = 0;
  while (p < clientPredictions.length) {
    const predPxl = clientPredictions[p];
    if (predPxl[0] === sI
      && predPxl[1] === sJ
      && predPxl[2] === sOffset
    ) {
      break;
    }
    p += 1;
  }

  if (p >= clientPredictions.length) {
    clientPredictions = [];
    return;
  }

  while (p < clientPredictions.length) {
    const [i, j, offset, color] = clientPredictions[p];
    store.dispatch(updatePixel(i, j, offset, color));
    p += 1;
  }

  clientPredictions = [];
}

export function tryPlacePixel(
  store,
  i: number,
  j: number,
  offset: number,
  color: ColorIndex,
  curColor: ColorIndex,
) {
  store.dispatch(updatePixel(i, j, offset, color));
  clientPredictions.push([i, j, offset, curColor]);

  if (pixelQueue.length) {
    const lastReq = pixelQueue[pixelQueue.length - 1];
    const { i: lastI, j: lastJ } = lastReq;
    if (i === lastI && j === lastJ) {
      /* append to last request in queue if same chunk */
      lastReq.pixels.push([offset, color]);
    }
    return;
  }

  pixelQueue.push({
    i,
    j,
    pixels: [[offset, color]],
  });

  if (!pixelTimeout) {
    requestFromQueue(store);
  }
}

export function receivePixelReturn(
  store,
  retCode: number,
  wait: number,
  coolDownSeconds: number,
  pxlCnt,
) {
  clearTimeout(pixelTimeout);

  try {
    /*
     * the terms coolDown is used in a different meaning here
     * coolDown is the delta seconds  of the placed pixel
     */
    if (wait) {
      store.dispatch(setWait(wait));
    }
    if (coolDownSeconds) {
      store.dispatch(notify(coolDownSeconds));
      if (coolDownSeconds < 0) {
        store.dispatch(gotCoolDownDelta(coolDownSeconds));
      }
    }

    if (retCode) {
      /*
       * one or more pixels didn't get set,
       * revert predictions and clean queue
       */
      const { i, j, pixels } = lastRequestValues;
      const [offset] = pixels[pxlCnt];
      revertPredictionsAt(store, i, j, offset);
      pixelQueue = [];
    }

    let errorTitle = null;
    let msg = null;
    switch (retCode) {
      case 0:
        store.dispatch(placedPixel());
        break;
      case 1:
        errorTitle = 'Invalid Canvas';
        msg = 'This canvas doesn\'t exist';
        break;
      case 2:
        errorTitle = 'Invalid Coordinates';
        msg = 'x out of bounds';
        break;
      case 3:
        errorTitle = 'Invalid Coordinates';
        msg = 'y out of bounds';
        break;
      case 4:
        errorTitle = 'Invalid Coordinates';
        msg = 'z out of bounds';
        break;
      case 5:
        errorTitle = 'Wrong Color';
        msg = 'Invalid color selected';
        break;
      case 6:
        errorTitle = 'Just for registered Users';
        msg = 'You have to be logged in to place on this canvas';
        break;
      case 7:
        errorTitle = 'Place more :)';
        // eslint-disable-next-line max-len
        msg = 'You can not access this canvas yet. You need to place more pixels';
        break;
      case 8:
        store.dispatch(notify('Pixel protected!'));
        break;
      case 9:
        // pixestack used up
        store.dispatch(pixelWait());
        break;
      case 10:
        // captcha, reCaptcha or hCaptcha
        if (typeof window.hcaptcha !== 'undefined') {
          window.hcaptcha.execute();
        } else {
          window.grecaptcha.execute();
        }
        return;
      case 11:

        errorTitle = 'No Proxies Allowed :(';
        msg = 'You are using a Proxy.';
        break;
      default:
        errorTitle = 'Weird';
        msg = 'Couldn\'t set Pixel';
    }
    if (msg) {
      store.dispatch(pixelFailure());
      store.dispatch(sweetAlert(
        (errorTitle || `Error ${retCode}`),
        msg,
        'error',
        'OK',
      ));
    }
  } finally {
    store.dispatch(setPlaceAllowed(true));
    /* start next request if queue isn't empty */
    requestFromQueue(store);
  }
}
