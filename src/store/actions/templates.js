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

export function templatesReady(title) {
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

export function updatedTemplateImage(imageId, width, height) {
  console.log('update', width, height, 'store');
  return {
    type: 's/UPD_TEMPLATE_IMG',
    imageId,
    width,
    height,
  };
}
