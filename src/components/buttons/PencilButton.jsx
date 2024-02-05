/**
 *
 */

import React, { useCallback } from 'react';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import { TbPencil, TbPencilMinus } from 'react-icons/tb';
import { t } from 'ttag';

import useLongPress from '../hooks/useLongPress';
import { HOLD_PAINT } from '../../core/constants';
import { selectHoldPaint } from '../../store/actions';
import { notify } from '../../store/actions/thunks';

const PencilButton = () => {
  const [
    holdPaint,
    showMvmCtrls,
  ] = useSelector((state) => [
    state.gui.holdPaint,
    state.gui.showMvmCtrls,
  ], shallowEqual);
  const dispatch = useDispatch();

  const onLongPress = useCallback(() => {
    let nextMode;
    switch (holdPaint) {
      case HOLD_PAINT.OFF:
      case HOLD_PAINT.PENCIL:
        if (window.ssv?.backupurl) {
          nextMode = HOLD_PAINT.HISTORY;
          dispatch(notify(t`History Pencil ON`));
          break;
        }
      // eslint-disable-next-line no-fallthrough
      case HOLD_PAINT.HISTORY: {
        nextMode = HOLD_PAINT.OVERLAY;
        dispatch(notify(t`Overlay Pencil ON`));
        break;
      }
      // eslint-disable-next-line no-fallthrough
      default:
        if (holdPaint) {
          nextMode = HOLD_PAINT.OFF;
        } else {
          nextMode = HOLD_PAINT.PENCIL;
        }
    }
    dispatch(selectHoldPaint(nextMode));
  }, [holdPaint, dispatch]);

  const onShortPress = useCallback(() => {
    let nextMode;
    if (holdPaint) {
      nextMode = HOLD_PAINT.OFF;
    } else {
      nextMode = HOLD_PAINT.PENCIL;
    }
    dispatch(selectHoldPaint(nextMode));
  }, [holdPaint, dispatch]);

  const refCallback = useLongPress(onShortPress, onLongPress);

  let className = 'actionbuttons';
  let title = t`Enable Pencil`;
  switch (holdPaint) {
    case HOLD_PAINT.PENCIL:
      className += ' ppencil pressed';
      title = t`Disable Pencil`;
      break;
    case HOLD_PAINT.HISTORY:
      className += ' phistory pressed';
      title = t`Disable History Pencil`;
      break;
    case HOLD_PAINT.OVERLAY:
      className += ' poverlay pressed';
      title = t`Disable Overlay Pencil`;
      break;
    default:
  }

  return (
    <div
      id="pencilbutton"
      className={className}
      style={{
        bottom: (holdPaint || showMvmCtrls) ? 180 : 98,
      }}
      role="button"
      title={title}
      tabIndex={-1}
      ref={refCallback}
    >
      {(holdPaint) ? <TbPencilMinus /> : <TbPencil />}
    </div>
  );
};

export default React.memo(PencilButton);
