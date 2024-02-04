/*
 * actions for templates
 */

export function listTemplate(imageId, title, canvasId, x, y, width, height) {
  return {
    type: 's/LIST_TEMPLATE',
    imageId,
    title,
    canvasId,
    x,
    y,
    width,
    height,
  };
}

export function templatesReady() {
  return {
    type: 'TEMPLATES_READY',
  };
}

export function removeTemplate(title) {
  return {
    type: 's/REM_TEMPLATE',
    title,
  };
}

export function changeTemplate(title, props) {
  return {
    type: 's/CHG_TEMPLATE',
    title,
    props,
  };
}

export function toggleOVEnabled() {
  return {
    type: 's/TGL_OVENABLED',
  };
}

export function toggleSmallPxls() {
  return {
    type: 's/TGL_SMALLPXLS',
  };
}

export function setOvOpacity(opacity) {
  return {
    type: 's/SET_O_OPACITY',
    opacity,
  };
}

export function receivedTemplate() {
  return {
    type: 'REC_TEMPLATE',
  };
}

export function updatedTemplateImage(imageId, width, height) {
  return {
    type: 's/UPD_TEMPLATE_IMG',
    imageId,
    width,
    height,
  };
}
