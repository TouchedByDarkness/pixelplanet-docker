/*
 * Create canvases.json with localized translated
 * descriptions.
 *
 */

import canvases from './core/canvases';
import ttag from './core/ttag';


/* eslint-disable max-len */

function getCanvases(t) {
  /*
   * add descriptions and titles of canvases here
   * Use the t tag and right `backquotes`
   */
  const canvasTitles = {
    0: t`Earth`,
    1: t`Moon`,
    2: t`3D Canvas`,
    3: t`Coronavirus`,
    5: t`PixelZone`,
    6: t`PixelCanvas`,
    7: t`1bit`,
    8: t`Top10`,
    9: t`Thoia`,
  };
  const canvasDesc = {
    0: t`Our main canvas, a huge map of the world. Place everywhere you like`,
    1: t`Moon canvas. Safe space for art. No flags or large text (unless part of art) or art larger than 1.5k x 1.5k pixels.`,
    2: t`Place Voxels on a 3D canvas with others`,
    3: t`Special canvas to spread awareness of SARS-CoV2`,
    5: t`Mirror of PixelZone`,
    6: t`Mirror of PixelCanvas`,
    7: t`Black and White canvas`,
    8: t`A canvas for the most active players from the the previous day. Daily ranking updates at 00:00 UTC.`,
    9: t`Thoia World Canvas. Advanced fictional worldbuilding and arts. Abandon the old world and all it entails.`,
  };
  /*
   * no edit below here needed when adding/removing canvas
   */

  const localizedCanvases = {};
  const canvasKeys = Object.keys(canvases);

  for (let i = 0; i < canvasKeys.length; i += 1) {
    const key = canvasKeys[i];
    localizedCanvases[key] = { ...canvases[key] };
    localizedCanvases[key].desc = canvasDesc[key]
      || canvases[key].desc
      || `Canvas ${key}`;
    localizedCanvases[key].title = canvasTitles[key]
      || canvases[key].title
      || `Canvas ${key}`;
  }

  return localizedCanvases;
}

const lCanvases = {};
(() => {
  const langs = Object.keys(ttag);
  langs.forEach((lang) => {
    lCanvases[lang] = getCanvases(ttag[lang].t);
  });
})();

export function getLocalizedCanvases(lang) {
  return lCanvases[lang] || lCanvases.default;
}

export default lCanvases;
