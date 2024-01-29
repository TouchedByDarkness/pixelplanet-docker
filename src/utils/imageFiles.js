/**
 * function relating image and files
 */

/*
 * read image element into canvas
 * @param img image element
 * @return canvas
 */
export function imageToCanvas(img) {
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const context = canvas.getContext('2d');
  context.drawImage(img, 0, 0);
  return canvas;
}

/*
 * read File object into canvas
 * @param file
 * @return HTMLCanvas
 */
export function fileToCanvas(file) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => {
      const img = new Image();
      img.onload = () => {
        resolve(imageToCanvas(img));
      };
      img.onerror = (error) => reject(error);
      img.src = fr.result;
    };
    fr.onerror = (error) => reject(error);
    fr.readAsDataURL(file);
  });
}

/*
 * read fimage file from arraybuffer into canvas
 * @param Buffer
 * @param type mimetype
 * @return HTMLCanvas
 */
export function bufferToCanvas(buffer, type) {
  const blob = new Blob([buffer], { type });
  return fileToCanvas(blob);
}

/*
 * read canvas into arraybuffer
 * @param canvas
 * @param type optional, defaults to image/png
 * @return buffer
 */
export function canvasToBuffer(canvas, type) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      blob.arrayBuffer().then(resolve).catch(reject);
    }, type);
  });
}

/*
 * convert canvas into base64 encoded png
 * @param canvas
 * @return base64
 */
export function canvasToBas64PNG() {
}
