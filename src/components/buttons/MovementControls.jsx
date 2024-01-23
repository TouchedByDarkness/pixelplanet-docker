/*
 *
 * Menu for WASD keys for mobile users
 */

import React, {
  useCallback,
} from 'react';
import {
  useSelector,
  useDispatch,
} from 'react-redux';
import {
  PiMagnifyingGlassMinus,
  PiMagnifyingGlassPlus,
  PiArrowFatLeft,
  PiArrowFatRight,
  PiArrowFatUp,
  PiArrowFatDown,
  PiCaretDoubleUp,
  PiCaretDoubleDown,
} from 'react-icons/pi';

import {
  setMoveU,
  setMoveV,
  setMoveW,
  cancelMove,
} from '../../store/actions';

const btnStyle = {
  // fontSize: 34,
};

const MovementControls = () => {
  const is3D = useSelector((state) => state.canvas.is3D);
  const dispatch = useDispatch();

  const onPressStart = useCallback((event) => {
    event.preventDefault();
    switch (event.currentTarget.id) {
      case 'forwardbtn':
        dispatch(setMoveV(-1));
        break;
      case 'backwardbtn':
        dispatch(setMoveV(1));
        break;
      case 'leftbtn':
        dispatch(setMoveU(-1));
        break;
      case 'rightbtn':
        dispatch(setMoveU(1));
        break;
      case 'upbtn':
        dispatch(setMoveW(-1));
        break;
      case 'downbtn':
        dispatch(setMoveW(1));
        break;
      default:
    }
  }, []);

  const onPressStop = useCallback((event) => {
    event.preventDefault();
    switch (event.currentTarget.id) {
      case 'forwardbtn':
        dispatch(setMoveV(0));
        break;
      case 'backwardbtn':
        dispatch(setMoveV(0));
        break;
      case 'leftbtn':
        dispatch(setMoveU(0));
        break;
      case 'rightbtn':
        dispatch(setMoveU(0));
        break;
      case 'upbtn':
        dispatch(setMoveW(0));
        break;
      case 'downbtn':
        dispatch(setMoveW(0));
        break;
      default:
    }
  }, []);

  const onCancel = useCallback((event) => {
    event.preventDefault();
    dispatch(cancelMove());
  }, []);

  const refCallBack = useCallback((node) => {
    if (!node) {
      return;
    }
    node.addEventListener('touchstart', onPressStart, { passive: false });
    node.addEventListener('mousedown', onPressStart, { passive: false });
    node.addEventListener('touchend', onPressStop, { passive: false });
    node.addEventListener('mouseup', onPressStop, { passive: false });
    node.addEventListener('mouseleave', onCancel, { passive: false });
    node.addEventListener('touchcancel', onCancel, { passive: false });
  }, [onPressStart, onPressStop, onCancel]);

  return (
    <>
      <div
        className="actionbuttons"
        id="forwardbtn"
        role="button"
        tabIndex={0}
        style={{
          ...btnStyle,
          left: 57,
          bottom: 139,
        }}
        ref={refCallBack}
      >
        <PiArrowFatUp />
      </div>
      <div
        className="actionbuttons"
        id="backwardbtn"
        role="button"
        tabIndex={0}
        style={{
          ...btnStyle,
          left: 57,
          bottom: 98,
        }}
        ref={refCallBack}
      >
        <PiArrowFatDown />
      </div>
      <div
        className="actionbuttons"
        id="leftbtn"
        role="button"
        tabIndex={0}
        style={{
          ...btnStyle,
          left: 16,
          bottom: 98,
        }}
        ref={refCallBack}
      >
        <PiArrowFatLeft />
      </div>
      <div
        className="actionbuttons"
        id="rightbtn"
        role="button"
        tabIndex={0}
        style={{
          ...btnStyle,
          left: 98,
          bottom: 98,
        }}
        ref={refCallBack}
      >
        <PiArrowFatRight />
      </div>
      <div
        className="actionbuttons"
        id="upbtn"
        role="button"
        tabIndex={0}
        style={{
          left: 16,
          bottom: 139,
        }}
        ref={refCallBack}
      >
        {(is3D) ? <PiCaretDoubleUp /> : <PiMagnifyingGlassMinus />}
      </div>
      <div
        className="actionbuttons"
        id="downbtn"
        role="button"
        tabIndex={0}
        style={{
          left: 98,
          bottom: 139,
        }}
        ref={refCallBack}
      >
        {(is3D) ? <PiCaretDoubleDown /> : <PiMagnifyingGlassPlus />}
      </div>
    </>
  );
};

export default MovementControls;
