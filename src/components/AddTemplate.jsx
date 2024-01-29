/*
 * Settings of minimap / overlay
 */

import React, { useState, useEffect, useRef } from 'react';
import { useSelector, shallowEqual } from 'react-redux';
import { t } from 'ttag';

import { coordsFromUrl } from '../core/utils';
import templateLoader from '../ui/templateLoader';

const AddTemplate = ({ close, triggerClose: refClose }) => {
  const [render, setRender] = useState(false);
  const [coords, setCoords] = useState(null);
  const [dimensions, setDimensions] = useState(null);
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);
  const imgRef = useRef();
  const [
    canvasId,
    canvases,
  ] = useSelector((state) => [
    state.canvas.canvasId,
    state.canvas.canvases,
  ], shallowEqual);
  const [selectedCanvas, selectCanvas] = useState(canvasId);

  useEffect(() => {
    window.setTimeout(() => setRender(true), 10);
    refClose.current = () => setRender(false);
  }, [refClose]);

  useEffect(() => {
    if (!file || !imgRef.current) {
      return;
    }
    const fr = new FileReader();
    fr.onload = () => { imgRef.current.src = fr.result; };
    fr.readAsDataURL(file);
  }, [file]);

  const canSubmit = (imgRef.current && file && coords && title && dimensions);

  return (
    <div
      className="inarea"
      style={{
        opacity: render ? 1 : 0,
        transition: 'opacity 200ms',
      }}
      onTransitionEnd={() => !render && close()}
    >
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          if (canSubmit) {
            await templateLoader.addFile(
              file, title, selectedCanvas, ...coords, imgRef.current,
            );
            setRender(false);
          }
        }}
      >
        <img
          src="./logo.svg"
          alt="preview"
          key="logo"
          style={{
            maxWidth: 96,
            maxHeight: 96,
          }}
          onLoad={(evt) => setDimensions([
            evt.target.naturalWidth,
            evt.target.naturalHeight,
          ])}
          onError={() => setDimensions(null)}
          ref={imgRef}
        />
        <input
          type="file"
          onChange={(evt) => {
            setDimensions(null);
            setFile(evt.target.files?.[0]);
          }}
        />
        <input
          value={title}
          type="text"
          onChange={(evt) => setTitle(evt.target.value)}
          placeholder={t`Template Name`}
        />
        <select
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
        </select>
        <input
          type="text"
          style={{
            display: 'inline-block',
            width: '100%',
            maxWidth: '15em',
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
        />
        <button type="submit" disabled={!canSubmit}>{t`Save`}</button>
      </form>
    </div>
  );
};

export default React.memo(AddTemplate);
