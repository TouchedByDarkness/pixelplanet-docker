/**
 *
 */

import React from 'react';
import { useSelector, shallowEqual, useDispatch } from 'react-redux';
import { t } from 'ttag';

import copy from '../utils/clipboard';
import { notify } from '../store/actions/thunks';


function renderCoordinates(cell) {
  return `(${cell.join(', ')})`;
}


const CoordinatesBox = () => {
  const [view, hover, is3D] = useSelector((state) => [
    state.canvas.view,
    state.canvas.hover,
    state.canvas.is3D,
  ], shallowEqual);
  const dispatch = useDispatch();

  let coords;
  if (hover) {
    coords = hover;
  } else {
    const [x, y, z] = view;
    coords = (is3D ? [x, y, z] : [x, y]).map(Math.round);
  }

  return (
    <div
      className="coorbox"
      onClick={() => {
        copy(window.location.hash);
        dispatch(notify(t`Copied`));
      }}
      role="button"
      title={t`Copy to Clipboard`}
      tabIndex="0"
    >{
      renderCoordinates(coords)
    }</div>
  );
};

export default React.memo(CoordinatesBox);
