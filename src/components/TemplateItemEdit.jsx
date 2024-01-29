/**
 * Item for list of Tamplates
 */

import React, {
  useRef, useState, useEffect, useMemo,
} from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { t } from 'ttag';

import templateLoader from '../ui/templateLoader';
import { changeTemplate } from '../store/actions/templates';
import { selectCanvas, setViewCoordinates } from '../store/actions';
import { coordsFromUrl } from '../core/utils';

const TemplateItem = ({
  title: initTitle,
  canvasId: initCanvasId,
  x: initX, y: initY,
  width: initWidth, height: initHeight,
  imageId: initImageId,
  stopEditing,
}) => {
  const [initCoords, initDimensions] = useMemo(() => [
    (Number.isNaN(parseInt(initX, 10))
      || Number.isNaN(parseInt(initY, 10))) ? null : [initX, initY],
    (Number.isNaN(parseInt(initWidth, 10))
      || Number.isNaN(parseInt(initHeight, 10))) ? null : [initWidth, initHeight],
  ], [initX, initY, initWidth, initHeight]);

  const [coords, setCoords] = useState(initCoords);
  const [dimensions, setDimensions] = useState(initDimensions);
  const [title, setTitle] = useState(initTitle);
  const [file, setFile] = useState(null);
  const [imageId, setImageId] = useState(initImageId);
  const imgRef = useRef();
  const [
    storeCanvasId,
    canvases,
  ] = useSelector((state) => [
    state.canvas.canvasId,
    state.canvas.canvases,
  ], shallowEqual);
  const [selectedCanvas, selectCanvas] = useState(initCanvasId ?? storeCanvasId);
  const dispatch = useDispatch();

  useEffect(() => {
    (async () => {
      if (!imageId || !imgRef.current) {
        return;
      }
      const previewImg = await templateLoader.getTemplate(imageId);
      if (!previewImg) {
        return;
      }
      const canvas = imgRef.current;
      canvas.width = previewImg.width;
      canvas.height = previewImg.height;
      canvas.getContext('2d').drawImage(previewImg, 0, 0);
    })();
  }, [imageId]);

  const canSubmit = (imgRef.current && file && coords && title && dimensions);

  return (
    <div className="tmpitm">
      <div className="tmpitm-preview">
        <canvas
          className="tmpitm-img"
          ref={imgRef}
          style={{ opacity: 0.4 }}
        />
        <div className="centered-on-img modallink">{t`Select File`}</div>
      </div>
      <div className="tmpitm-desc">
        <h4><input
          value={title}
          style={{ width: '10em' }}
          type="text"
          onChange={(evt) => setTitle(evt.target.value)}
          placeholder={t`Template Name`}
        /></h4>
        <p>{t`Canvas`}:&nbsp;
          <span><select
            value={selectedCanvas}
            onChange={(e) => {
              const sel = e.target;
              selectCanvas(sel.options[sel.selectedIndex].value);
            }}
          >
            {Object.keys(canvases).filter((c) => !canvases[c].v).map((canvas) => (
              <option key={canvas} value={canvas}>
                {canvases[canvas].title}
              </option>
            ))}
          </select></span>
        </p>
        <p>
          {t`Coordinates`}:&nbsp;
          <span><input
            type="text"
            defaultValue={coords && coords.join('_')}
            style={{
              display: 'inline-block',
              maxWidth: '8em',
            }}
            placeholder="X_Y or URL"
            onChange={(evt) => {
              let co = evt.target.value.trim();
              co = coordsFromUrl(co) || co;
              evt.target.value = co;
              const newCoords = co.split('_').map((z) => parseInt(z, 10));
              setCoords((!newCoords.some(Number.isNaN) && newCoords.length === 2)
                ? newCoords : null,
              );
            }}
          /></span>
        </p>
        <p>
          {t`Dimensions`}:&nbsp;<span>{(dimensions) ? dimensions.join(' x ') : 'N/A'}</span>
        </p>
      </div>
      <div className="tmpitm-actions">
        <button>
          {t`Delete`}
        </button>
        <button
          onClick={(evt) => {
            evt.stopPropagation();
            stopEditing(title);
          }}
        >
          {t`Cancel`}
        </button>
        <button
          disabled={!canSubmit}
        >
          {t`Save`}
        </button>
      </div>
    </div>
  );
};

export default React.memo(TemplateItem);
