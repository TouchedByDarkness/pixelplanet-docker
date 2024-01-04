/* eslint-disable max-len */

import React, { useCallback } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { t } from 'ttag';

import CanvasItem from '../CanvasItem';
import { selectCanvas } from '../../store/actions';

const imageStyle = {
  maxWidth: '20%',
  padding: 2,
  display: 'inline-block',
  verticalAlign: 'middle',
};

const Archive = () => {
  const [canvases, online] = useSelector((state) => [
    state.canvas.canvases,
    state.ranks.online,
  ], shallowEqual);
  const dispatch = useDispatch();
  const selCanvas = useCallback((canvasId) => dispatch(selectCanvas(canvasId)),
    [dispatch]);

  return (
    <div className="content">
      <p>
        {t`While we tend to not delete canvases, some canvases are started for fun or as a request by users who currently like a meme. Those canvases can get boring after a while and after weeks of no major change and if they really aren't worth being kept active. And Some other canvases might outlive their welcome and become useless.`}<br />
        {t`Here we collect removed canvases to archive them in a proper way.`}
      </p>
      {
        (window.ssv?.backupurl) && (
          <>
            <h3>{t`Removed Canvases with history available`}</h3>
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
      <h3>{t`Political Compass Canvas`}</h3>
      <img
        style={imageStyle}
        alt="political-compass"
        src="https://storage.pixelplanet.fun/compass-preview.png"
      />
      <p>
        {t`This canvas got requested during a time of political conflicts on the main Earth canvas. It was a 1024x1024 representation of the political compass with a 5s cooldown and 60s stacking. It got launched on May 11th and remained active for months till it got shut down on November 30th.`}<br />
        {t`We decided to archive it as a timelapse with lossless encoded webm. Taking a screenshot from the timelapse results in a perfect 1:1 representation of how the canvas was at that time.`}
      </p>
      <p className="modalinfo">
        Timelapse:
        <a href="https://storage.pixelplanet.fun/compass-timelapse.webm">
          Download
        </a>
      </p>
      <img
        style={{ padding: 2, maxWidth: '80%', verticalAlign: 'middle' }}
        alt="political-compass"
        src="https://storage.pixelplanet.fun/compass-final.png"
      />
    </div>
  );
};

export default Archive;
