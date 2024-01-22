/**
 *
 */

import React from 'react';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import { TbPencil, TbPencilMinus } from 'react-icons/tb';
import { t } from 'ttag';

import { HOLD_PAINT } from '../../core/constants';
import { selectHoldPaint } from '../../store/actions';

const PencilButton = () => {
  const [
    holdPaint,
    showMvmCtrls,
  ] = useSelector((state) => [
    state.gui.holdPaint,
    state.gui.showMvmCtrls,
  ], shallowEqual);
  const dispatch = useDispatch();

  return (
    <div
      id="pencilbutton"
      className={
        `actionbuttons${(holdPaint === HOLD_PAINT.PENCIL) ? ' pressed' : ''}`
      }
      style={{
        bottom: (holdPaint === HOLD_PAINT.PENCIL || showMvmCtrls) ? 180 : 98,
      }}
      role="button"
      title={(holdPaint === HOLD_PAINT.PENCIL)
        ? t`Disable Pencil`
        : t`Enable Pencil`}
      tabIndex={-1}
      onClick={() => dispatch(selectHoldPaint(
        (holdPaint === HOLD_PAINT.PENCIL) ? HOLD_PAINT.OFF : HOLD_PAINT.PENCIL,
      ))}
    >
      {(holdPaint === HOLD_PAINT.PENCIL) ? <TbPencilMinus /> : <TbPencil />}
    </div>
  );
};

export default React.memo(PencilButton);
