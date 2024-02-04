/**
 * Item for list of Tamplates
 */

import React, { useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { t } from 'ttag';

import templateLoader from '../ui/templateLoader';
import { changeTemplate } from '../store/actions/templates';
import { selectCanvas, setViewCoordinates } from '../store/actions';

const TemplateItem = ({
  enabled, title, canvasId, x, y, width, height, imageId, startEditing,
}) => {
  const imgRef = useRef();
  const canvases = useSelector((state) => state.canvas.canvases);
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
      const bitmap = await createImageBitmap(previewImg);
      imgRef.current.getContext('bitmaprenderer')
        .transferFromImageBitmap(bitmap);
      bitmap.close();
    })();
  }, [imageId]);

  return (
    <div
      className={(enabled) ? 'tmpitm' : 'tmpitm disabled'}
      style={{ cursor: 'pointer' }}
      onClick={() => dispatch(changeTemplate(title, { enabled: !enabled }))}
    >
      <div className="tmpitm-preview">
        <canvas
          className="tmpitm-img"
          ref={imgRef}
          key="showimg"
          width={width}
          height={height}
        />
      </div>
      <div className="tmpitm-desc">
        <h4>{title}</h4>
        <p>
          {t`Canvas`}:&nbsp;<span>{canvases[canvasId]?.title}</span>
        </p>
        <p>
          {t`Coordinates`}:&nbsp;<span>{`${x},${y}`}</span>
        </p>
        <p>
          {t`Dimensions`}:&nbsp;<span>{`${width} x ${height}`}</span>
        </p>
      </div>
      <div className="tmpitm-actions">
        <button
          onClick={(evt) => {
            evt.stopPropagation();
            startEditing(title);
          }}
          type="button"
        >
          {t`Edit`}
        </button>
        <button
          onClick={(evt) => {
            evt.stopPropagation();
            dispatch(selectCanvas(canvasId));
            dispatch(setViewCoordinates([x + width / 2, y + height / 2]));
          }}
          type="button"
        >
          {t`Go to`}
        </button>
      </div>
    </div>
  );
};

export default React.memo(TemplateItem);
