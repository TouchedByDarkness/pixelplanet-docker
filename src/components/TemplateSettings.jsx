/*
 * Settings for minimap / overlay
 */

import React, { useState, useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import { t } from 'ttag';

import AddTemplate from './AddTemplate';
import TemplateItem from './TemplateItem';
import TemplateItemEdit from './TemplateItemEdit';

const TemplateSettings = () => {
  const [showAdd, setShowAdd] = useState(false);
  const list = useSelector((state) => state.templates.list);
  const [editingIndices, setEditingIndices] = useState([]);
  const close = useCallback(() => setShowAdd(false), []);
  const refClose = useRef();

  const toggleEditing = useCallback((title) => {
    const index = list.findIndex((t) => t.title === title);
    const ind = editingIndices.indexOf(index);
    setEditingIndices((ind === -1)
      ? [...editingIndices, index]
      : editingIndices.toSpliced(ind, 1),
    );
  }, [editingIndices]);

  console.log('editing', editingIndices);

  return (
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
          width={width}
          height={height}
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
      {(showAdd) ? (
        <span
          role="button"
          tabIndex={-1}
          className="modallink"
          onClick={() => refClose.current?.()}
        > {t`Cancel adding Template`}</span>
      ) : (
        <span
          role="button"
          tabIndex={-1}
          className="modallink"
          onClick={() => setShowAdd(true)}
        > {t`Add Template`}</span>
      )}
      {showAdd && <AddTemplate close={close} triggerClose={refClose} />}
    </div>
  );
};

export default TemplateSettings;
