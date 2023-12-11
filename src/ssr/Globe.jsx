/*
 * react html for 3D globe page
 *
 */

/* eslint-disable max-len */

import { getTTag } from '../core/ttag';

/* this will be set by webpack */
import { getJsAssets } from '../core/assets';

import globeCss from '../styles/globe.css';

/*
 * generates string with html of globe page
 * @param lang language code
 * @return html of mainpage
 */
function generateGlobePage(lang) {
  const scripts = getJsAssets('globe', lang);

  const { t } = getTTag(lang);

  const html = `
    <!doctype html>
    <html lang="${lang}">
      <head>
        <meta charset="UTF-8" />
        <title>${t`PixelPlanet.Fun 3DGlobe`}</title>
        <meta name="description" content="${t`A 3D globe of our whole map`}" />
        <meta name="google" content="nopagereadaloud" />
        <meta name="theme-color" content="#cae3ff" />
        <meta name="viewport"
          content="user-scalable=no, width=device-width, initial-scale=1.0, maximum-scale=1.0"
        />
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
        <link rel="apple-touch-icon" href="apple-touch-icon.png" />
        <style key="globe" id="globe">${globeCss}</style>
      </head>
      <body>
        <div id="webgl" />
        <div id="coorbox">(0, 0)</div>
        <div id="info">${t`Double click on globe to go back.`}</div>
        <div id="loading">${t`Loading...`}</div>
        ${scripts.map((script) => `<script src="${script}"></script>`).join('')}
      </body>
    </html>
  `;

  return html;
}

export default generateGlobePage;
