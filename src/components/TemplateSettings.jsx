/*
 * Settings for minimap / overlay
 */

import React, { useState, useCallback, useRef } from 'react';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import fileDownload from 'js-file-download';
import { c, t } from 'ttag';

import TemplateItem from './TemplateItem';
import TemplateItemEdit from './TemplateItemEdit';
import SettingsItem from './SettingsItem';
import templateLoader from '../ui/templateLoader';
import {
  toggleOVEnabled,
  toggleSmallPxls,
  setOvOpacity,
} from '../store/actions/templates';


const TemplateSettings = () => {
  const [showAdd, setShowAdd] = useState(false);
  const [
    list,
    oVEnabled,
    oSmallPxls,
    oOpacity,
  ] = useSelector((state) => [
    state.templates.list,
    state.templates.ovEnabled,
    state.templates.oSmallPxls,
    state.templates.oOpacity,
  ], shallowEqual);
  const [editingIndices, setEditingIndices] = useState([]);
  const close = useCallback(() => setShowAdd(false), []);
  const importRef = useRef();
  const dispatch = useDispatch();

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
      <h2>{t`Templates`}</h2>
      <p>
        {t`Tired of always spaming one single color? Want to create art instead, but you have to count pixels from some other image? Templates can help you with that! Templates can show as overlay and you can draw over them. One pixel on the template, should be one pixel on the canvas.`}
      </p>
      <SettingsItem
        title={t`Enable Overlay`}
        keyBind={c('keybinds').t`T`}
        value={oVEnabled}
        onToggle={() => dispatch(toggleOVEnabled())}
      >
        {t`Show templates as overlays ingame.`}
      </SettingsItem>
      <SettingsItem
        title={t`Small Pixels Overlay`}
        value={oSmallPxls}
        deactivated={!oVEnabled}
        onToggle={() => dispatch(toggleSmallPxls())}
      >
        {t`Show overlay as small individual pixels (will only show in high zoomlevels).`}
      </SettingsItem>

      <div className="setitem">
        <div className="setrow">
          <h3 className="settitle">
            {t`Overlay Opacity`}
          </h3>
          <div style={{ textAlign: 'right' }}>
            <input
              type="number"
              value={oOpacity}
              style={{ maxWidth: '6em' }}
              step="1"
              min="10"
              max="100"
              onChange={(evt) => dispatch(setOvOpacity(evt.target.value))}
            />
          </div>
        </div>
        <div className="modaldesc">{t`Opacity of Overlay in percent.`}</div>
        <div className="modaldivider" />
      </div>

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
