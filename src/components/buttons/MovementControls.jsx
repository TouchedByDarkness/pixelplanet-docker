/*
 *
 * Menu for WASD keys for mobile users
 */

import React, {
  useCallback,
} from 'react';
import {
  useSelector,
  shallowEqual,
  useDispatch,
} from 'react-redux';

import {
  setMoveU,
  setMoveV,
  setMoveW,
} from '../../store/actions';

const btnStyle = {
  fontSize: 34,
};

const MovementControls = () => {
  const [holdPaint, is3D] = useSelector((state) => [
    state.gui.holdPaint,
    state.canvas.is3D,
  ], shallowEqual);
  const dispatch = useDispatch();

  if (!holdPaint && !is3D) {
    return null;
  }

  return (
    <>
      <div
        className="actionbuttons"
        role="button"
        tabIndex={0}
        style={{
          ...btnStyle,
          left: 57,
          bottom: 139,
        }}
        onMouseDown={() => dispatch(setMoveV(-1))}
        onMouseUp={() => dispatch(setMoveV(0))}
        onTouchStart={() => dispatch(setMoveV(-1))}
        onTouchEnd={() => dispatch(setMoveV(0))}
      >
        ↑
      </div>
      <div
        className="actionbuttons"
        role="button"
        tabIndex={0}
        style={{
          ...btnStyle,
          left: 57,
          bottom: 98,
        }}
        onMouseDown={() => dispatch(setMoveV(1))}
        onMouseUp={() => dispatch(setMoveV(0))}
        onTouchStart={(event) => dispatch(setMoveV(1))}
        onTouchEnd={(event) => dispatch(setMoveV(0))}
      >
        ↓
      </div>
      <div
        className="actionbuttons"
        role="button"
        tabIndex={0}
        style={{
          ...btnStyle,
          left: 16,
          bottom: 98,
        }}
        onMouseDown={() => dispatch(setMoveU(-1))}
        onMouseUp={() => dispatch(setMoveU(0))}
        onTouchStart={() => dispatch(setMoveU(-1))}
        onTouchEnd={() => dispatch(setMoveU(0))}
      >
        ←
      </div>
      <div
        className="actionbuttons"
        role="button"
        tabIndex={0}
        style={{
          ...btnStyle,
          left: 98,
          bottom: 98,
        }}
        onMouseDown={() => dispatch(setMoveU(1))}
        onMouseUp={() => dispatch(setMoveU(0))}
        onTouchStart={() => dispatch(setMoveU(1))}
        onTouchEnd={() => dispatch(setMoveU(0))}
      >
        →
      </div>
      <div
        className="actionbuttons"
        role="button"
        tabIndex={0}
        style={{
          ...btnStyle,
          left: 16,
          bottom: 139,
        }}
        onMouseDown={() => dispatch(setMoveW(-1))}
        onMouseUp={() => dispatch(setMoveW(0))}
        onTouchStart={() => dispatch(setMoveW(-1))}
        onTouchEnd={() => dispatch(setMoveW(0))}
      >
        ↖
      </div>
      <div
        className="actionbuttons"
        role="button"
        tabIndex={0}
        style={{
          ...btnStyle,
          left: 98,
          bottom: 139,
        }}
        onMouseDown={() => dispatch(setMoveW(1))}
        onMouseUp={() => dispatch(setMoveW(0))}
        onTouchStart={() => dispatch(setMoveW(1))}
        onTouchEnd={() => dispatch(setMoveW(0))}
      >
        ↘
      </div>
    </>
  );
};

export default MovementControls;
