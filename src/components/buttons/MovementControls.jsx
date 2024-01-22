/*
 *
 * Menu for WASD keys for mobile users
 */

import React from 'react';
import { useSelector, shallowEqual } from 'react-redux';

import { getRenderer } from '../../ui/rendererFactory';

const btnStyle = {
  fontSize: 34,
};

function cancelMovement() {
  const renderer = getRenderer();
  renderer.controls.moveU = 0;
  renderer.controls.moveV = 0;
  renderer.controls.moveW = 0;
}

const MovementControls = () => {
  const [pencilEnabled, is3D] = useSelector((state) => [
    state.gui.pencilEnabled,
    state.canvas.is3D,
  ], shallowEqual);

  if (!pencilEnabled && !is3D) {
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
          // left: 46,
          left: 57,
          // bottom: 128,
          bottom: 139,
        }}
        onMouseDown={() => {
          getRenderer().controls.moveV = -1;
        }}
        onMouseUp={() => {
          getRenderer().controls.moveV = 0;
        }}
        onTouchStart={() => {
          getRenderer().controls.moveV = -1;
        }}
        onTouchEnd={() => {
          getRenderer().controls.moveV = 0;
        }}
        onTouchCancel={cancelMovement}
        onMouseLeave={cancelMovement}
      >
        ↑
      </div>
      <div
        className="actionbuttons"
        role="button"
        tabIndex={0}
        style={{
          ...btnStyle,
          // left: 46,
          left: 57,
          bottom: 98,
        }}
        onMouseDown={() => {
          getRenderer().controls.moveV = 1;
        }}
        onMouseUp={() => {
          getRenderer().controls.moveV = 0;
        }}
        onTouchStart={() => {
          getRenderer().controls.moveV = 1;
        }}
        onTouchEnd={() => {
          getRenderer().controls.moveV = 0;
        }}
        onTouchCancel={cancelMovement}
        onMouseLeave={cancelMovement}
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
        onMouseDown={() => {
          getRenderer().controls.moveU = -1;
        }}
        onMouseUp={() => {
          getRenderer().controls.moveU = 0;
        }}
        onTouchStart={() => {
          getRenderer().controls.moveU = -1;
        }}
        onTouchEnd={() => {
          getRenderer().controls.moveU = 0;
        }}
        onTouchCancel={cancelMovement}
        onMouseLeave={cancelMovement}
      >
        ←
      </div>
      <div
        className="actionbuttons"
        role="button"
        tabIndex={0}
        style={{
          ...btnStyle,
          // left: 76,
          left: 98,
          bottom: 98,
        }}
        onMouseDown={() => {
          getRenderer().controls.moveU = 1;
        }}
        onMouseUp={() => {
          getRenderer().controls.moveU = 0;
        }}
        onTouchStart={() => {
          getRenderer().controls.moveU = 1;
        }}
        onTouchEnd={() => {
          getRenderer().controls.moveU = 0;
        }}
        onTouchCancel={cancelMovement}
        onMouseLeave={cancelMovement}
      >
        →
      </div>
      <div
        className="actionbuttons"
        role="button"
        tabIndex={0}
        style={{
          ...btnStyle,
          // left: 76,
          left: 16,
          bottom: 139,
        }}
        onMouseDown={() => {
          getRenderer().controls.moveW = -1;
        }}
        onMouseUp={() => {
          getRenderer().controls.moveW = 0;
        }}
        onTouchStart={() => {
          getRenderer().controls.moveW = -1;
        }}
        onTouchEnd={() => {
          getRenderer().controls.moveW = 0;
        }}
        onTouchCancel={cancelMovement}
        onMouseLeave={cancelMovement}
      >
        ↖
      </div>
      <div
        className="actionbuttons"
        role="button"
        tabIndex={0}
        style={{
          ...btnStyle,
          // left: 76,
          left: 98,
          bottom: 139,
        }}
        onMouseDown={() => {
          getRenderer().controls.moveW = 1;
        }}
        onMouseUp={() => {
          getRenderer().controls.moveW = 0;
        }}
        onTouchStart={() => {
          getRenderer().controls.moveW = 1;
        }}
        onTouchEnd={() => {
          getRenderer().controls.moveW = 0;
        }}
        onTouchCancel={cancelMovement}
        onMouseLeave={cancelMovement}
      >
        ↘
      </div>
    </>
  );
};

export default MovementControls;
