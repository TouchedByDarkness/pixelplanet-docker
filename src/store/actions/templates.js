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
