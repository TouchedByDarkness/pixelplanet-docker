/*
 * Settings for minimap / overlay
 */

import React, { useState, useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import fileDownload from 'js-file-download';
import { t } from 'ttag';

import AddTemplate from './AddTemplate';
import TemplateItem from './TemplateItem';
import TemplateItemEdit from './TemplateItemEdit';
import templateLoader from '../ui/templateLoader';


const TemplateSettings = () => {
  const [showAdd, setShowAdd] = useState(false);
  const list = useSelector((state) => state.templates.list);
  const [editingIndices, setEditingIndices] = useState([]);
  const close = useCallback(() => setShowAdd(false), []);
  const importRef = useRef();

  const toggleEditing = useCallback((title) => {
    const index = list.findIndex((t) => t.title === title);
    const ind = editingIndices.indexOf(index);
    setEditingIndices((ind === -1)
      ? [...editingIndices, index]
      : editingIndices.toSpliced(ind, 1),
    );
  }, [list, editingIndices]);

  console.log('list', list);

  return (
    <>
      <h3>{t`Templates`}</h3>
      <p>
      {t`Tired of always spaming one single color? Want to create art instead, but you have to count pixels from some other image? Templates can help you with that! Templates can show as overlay and you can draw over them. One pixel on the template, should be one pixel on the canvas.`}
      </p>
      <div className="content">
        {list.map(({
          enabled, imageId, canvasId, title, x, y, width, height,
        }, index) => (editingIndices.includes(index) ? (
          <TemplateItemEdit
            enabled={enabled}
            key={index}
            title={title}
            imageId={imageId}
            canvasId={canvasId}
            x={x}
            y={y}
            stopEditing={toggleEditing}
          />
        ) : (
          <TemplateItem
            enabled={enabled}
            key={index}
            title={title}
            imageId={imageId}
            canvasId={canvasId}
            x={x}
            y={y}
            width={width}
            height={height}
            startEditing={toggleEditing}
          />
        )))}
        {showAdd && <TemplateItemEdit stopEditing={close} />}
        {(showAdd) ? (
          <span
            role="button"
            tabIndex={-1}
            className="modallink"
            onClick={() => close()}
          > {t`Cancel adding Template`}</span>
        ) : (
          <span
            role="button"
            tabIndex={-1}
            className="modallink"
            onClick={() => setShowAdd(true)}
          > {t`Add Template`}</span>
        )}
        {(list.some((z) => z.enabled)) && (
          <React.Fragment key="exps">
            &nbsp;|&nbsp;
            <span
              role="button"
              tabIndex={-1}
              className="modallink"
              onClick={async () => {
                const data = await templateLoader.exportEnabledTemplates();
                fileDownload(
                  JSON.stringify(data), 'PixelplanetTemplates.json',
                );
              }}
            >{t`Export enabled templates`}</span>
          </React.Fragment>
        )}
        &nbsp;|&nbsp;
        <span
          role="button"
          tabIndex={-1}
          className="modallink"
          onClick={async () => importRef.current?.click()}
          >{t`Import templates`}</span>
          <input
            type="file"
            key="impin"
            accept="image/*"
            ref={importRef}
            style={{ display: 'none' }}
            onChange={(evt) => {
              templateLoader.importTemplates(evt.target.files?.[0]);
            }}
          />
      </div>
    </>
  );
};

export default TemplateSettings;
