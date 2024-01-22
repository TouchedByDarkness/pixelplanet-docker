/**
 *
 */

import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { TbPencil, TbPencilMinus } from 'react-icons/tb';
import { t } from 'ttag';

import { togglePencil } from '../../store/actions';

const PencilButton = () => {
  const pencilEnabled = useSelector((state) => state.gui.pencilEnabled);
  const dispatch = useDispatch();

  return (
    <div
      id="pencilbutton"
      className={`actionbuttons${pencilEnabled ? ' pressed' : ''}`}
      role="button"
      title={(pencilEnabled) ? t`Disable Pencil` : t`Enable Pencil`}
      tabIndex={-1}
      onClick={() => dispatch(togglePencil())}
    >
      {pencilEnabled ? <TbPencilMinus /> : <TbPencil />}
    </div>
  );
};

export default React.memo(PencilButton);
