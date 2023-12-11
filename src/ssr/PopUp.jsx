/*
 * create html for popup page
 *
 */

/* eslint-disable max-len */

import { langCodeToCC } from '../utils/location';
import ttags, { getTTag } from '../core/ttag';
import socketEvents from '../socket/socketEvents';
import { getJsAssets, getCssAssets } from '../core/assets';
import { BACKUP_URL } from '../core/config';
import { getHostFromRequest } from '../utils/ip';

/*
 * generate language list
 */
const langs = Object.keys(ttags)
  .map((l) => (l === 'default' ? 'en' : l))
  .map((l) => [l, langCodeToCC(l)]);

/*
 * values that we pass to client scripts
 */
const ssv = {
  availableStyles: getCssAssets(),
  langs,
};
if (BACKUP_URL) {
  ssv.backupurl = BACKUP_URL;
}

/*
 * generates string with html of win page
 * @param lang language code
 * @return html of mainpage
 */
function generatePopUpPage(req) {
  const { lang } = req;
  const host = getHostFromRequest(req);
  const ssvR = {
    ...ssv,
    shard: (host.startsWith(`${socketEvents.thisShard}.`))
      ? null : socketEvents.getLowestActiveShard(),
    lang: lang === 'default' ? 'en' : lang,
  };
  const script = getJsAssets('popup', lang);

  const { t } = getTTag(lang);

  const html = `
    <!doctype html>
    <html lang="${lang}">
      <head>
        <meta charset="UTF-8" />
        <title>${t`ppfun`}</title>
        <meta name="description" content="${t`PixelPlanet.Fun PopUp`}" />
        <meta name="google" content="nopagereadaloud" />
        <meta name="theme-color" content="#cae3ff" />
        <meta name="viewport"
          content="user-scalable=no, width=device-width, initial-scale=1.0, maximum-scale=1.0"
        />
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
        <link rel="apple-touch-icon" href="apple-touch-icon.png" />
        <script>window.ssv=JSON.parse('${JSON.stringify(ssvR)}')</script>
        <link rel="stylesheet" type="text/css" id="globcss" href="${getCssAssets().default}" />
      </head>
      <body>
        <div id="app" class="popup">
        </div>
        <script src="${script}"></script>
      </body>
    </html>
  `;

  return html;
}

export default generatePopUpPage;
