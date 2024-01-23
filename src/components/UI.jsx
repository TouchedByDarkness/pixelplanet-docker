/**
 *
 */

import React from 'react';
import { useSelector, shallowEqual } from 'react-redux';

import CoolDownBox from './CoolDownBox';
import NotifyBox from './NotifyBox';
import GlobeButton from './buttons/GlobeButton';
import PalselButton from './buttons/PalselButton';
import PencilButton from './buttons/PencilButton';
import MovementControls from './buttons/MovementControls';
import Palette from './Palette';
import Alert from './Alert';
import HistorySelect from './HistorySelect';

const UI = () => {
  const [
    isHistoricalView,
    is3D,
    isOnMobile,
    showMvmCtrls,
    holdPaint,
  ] = useSelector((state) => [
    state.canvas.isHistoricalView,
    state.canvas.is3D,
    state.user.isOnMobile,
    state.gui.showMvmCtrls,
    state.gui.holdPaint,
  ], shallowEqual);

  return (
    <>
      <Alert />
      {(showMvmCtrls
        || (isOnMobile && (is3D || (holdPaint > 0) && !isHistoricalView))
      ) && <MovementControls />}
      {(isHistoricalView) ? (
        <HistorySelect />
      ) : (
        <>
          <PalselButton />
          <Palette />
          {(!is3D) && <GlobeButton />}
          {(!is3D && isOnMobile) && <PencilButton />}
          <CoolDownBox />
        </>
      )}
      <NotifyBox />
    </>
  );
};

export default React.memo(UI);
