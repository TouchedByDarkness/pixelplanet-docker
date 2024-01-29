/*
 * Template for the minimap / overlay
 */

import {
  fileToCanvas,
  imageToCanvas,
  bufferToCanvas,
  canvasToBuffer,
} from '../utils/imageFiles';

class Template {
  // HTMLCanvasElement of image
  image;
  // id to hold in indexedDB, in store as imageId
  id;
  // dimensions
  width;
  height;
  // if image is loaded
  ready = false;

  constructor(imageId) {
    this.id = imageId;
  }

  async arrayBuffer() {
    return canvasToBuffer(this.image);
  }

  setDimensionFromCanvas() {
    const { width, height } = this.image;
    this.width = width;
    this.height = height;
    this.read = true;
    return [width, height];
  }

  fromImage(img) {
    this.image = imageToCanvas(img);
    return this.setDimensionFromCanvas();
  }

  async fromFile(file) {
    this.image = await fileToCanvas(file);
    return this.setDimensionFromCanvas();
  }

  async fromBuffer(buffer, type = 'image/png') {
    this.image = await bufferToCanvas(buffer, type);
    return this.setDimensionFromCanvas();
  }
}

export default Template;
