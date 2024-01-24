/**
 *
 */

import React, { useCallback } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { t } from 'ttag';

import CanvasItem from '../CanvasItem';
import { selectCanvas } from '../../store/actions';
import useLink from '../hooks/link';


const CanvasSelect = () => {
  const [canvases, showHiddenCanvases, online] = useSelector((state) => [
    state.canvas.canvases,
    state.gui.easterEgg,
    state.ranks.online,
  ], shallowEqual);
  const dispatch = useDispatch();
  const selCanvas = useCallback((canvasId) => dispatch(selectCanvas(canvasId)),
    [dispatch]);

  const link = useLink();

  return (
    <div className="content">
      <p>
        {t`Select the canvas you want to use.
Every canvas is unique and has different palettes, cooldown and requirements.
Archive of removed canvases can be accessed here:`}&nbsp;
        <span
          role="button"
          tabIndex={0}
          className="modallink"
          onClick={() => link('ARCHIVE')}
        >{t`Archive`}</span>
      </p>
      {
        Object.keys(canvases).map((canvasId) => (
          (!canvases[canvasId].hid || showHiddenCanvases)
            && !canvases[canvasId].ed
            && (
              <CanvasItem
                key={canvasId}
                online={online[canvasId]}
                canvasId={canvasId}
                canvas={canvases[canvasId]}
                selCanvas={selCanvas}
              />
            )
        ))
      }
      {
        (window.ssv?.backupurl
          && Object.keys(canvases).some((i) => canvases[i].ed))
          && (
          <>
            <h3>{t`Retired Canvases (history only)`}</h3>
            {
            Object.keys(canvases).map((canvasId) => (
              canvases[canvasId].ed
              && (
                <CanvasItem
                  key={canvasId}
                  online={online[canvasId]}
                  canvasId={canvasId}
                  canvas={canvases[canvasId]}
                  selCanvas={selCanvas}
                />
              )
            ))
          }
          </>
          )
      }
    </div>
  );
};

export default React.memo(CanvasSelect);
