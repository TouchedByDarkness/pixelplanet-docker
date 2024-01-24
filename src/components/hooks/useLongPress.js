/*
 * check for long presses of element
 * return a function that can be attacked as ref to an element
 */

import { useState, useRef, useCallback } from 'react';

function useLongPress(shortPressCallback, longPressCallback, timeout = 600) {
  const [pressTimeout, setPressTimeout] = useState(null);
  const btnRef = useRef();

  const press = useCallback((event) => {
    event.preventDefault();
    setPressTimeout(setTimeout(() => {
      longPressCallback(event);
      setPressTimeout(null);
    }, timeout));
  }, [longPressCallback, timeout]);

  const release = useCallback((event) => {
    event.preventDefault();
    if (!pressTimeout) {
      // long press already occured
      return;
    }
    clearTimeout(pressTimeout);
    if (shortPressCallback) {
      shortPressCallback(event);
    }
    setPressTimeout(null);
  }, [pressTimeout, shortPressCallback]);

  const cancel = useCallback((event) => {
    event.preventDefault();
    clearTimeout(pressTimeout);
    setPressTimeout(null);
  }, [pressTimeout]);

  const refCallback = useCallback((node) => {
    if (!node) {
      if (btnRef.current) {
        const oldNode = btnRef.current;
        // remove event listeners, happens on detach
        oldNode.removeEventListener('mousedown', press, { passive: false });
        oldNode.removeEventListener('mouseup', release, { passive: false });
        oldNode.removeEventListener('touchstart', press, { passive: false });
        oldNode.removeEventListener('touchend', release, { passive: false });
        oldNode.removeEventListener('mouseleave', cancel, { passive: false });
        oldNode.removeEventListener('touchcancel', cancel, { passive: false });
      }
    } else {
      btnRef.current = node;
      // add event listeners
      node.addEventListener('mousedown', press, { passive: false });
      node.addEventListener('mouseup', release, { passive: false });
      node.addEventListener('touchstart', press, { passive: false });
      node.addEventListener('touchend', release, { passive: false });
      node.addEventListener('mouseleave', cancel, { passive: false });
      node.addEventListener('touchcancel', cancel, { passive: false });
    }
  }, [cancel, press, release]);

  return refCallback;
}

export default useLongPress;
