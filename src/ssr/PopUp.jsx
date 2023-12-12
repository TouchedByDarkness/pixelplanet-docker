/*
 * create html for popup page
 *
 */

/* eslint-disable max-len */
import etag from 'etag';

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
 * @return html and etag of popup page
 */
function generatePopUpPage(req) {
  const { lang } = req;
  const host = getHostFromRequest(req);
  const shard = (host.startsWith(`${socketEvents.thisShard}.`))
    ? null : socketEvents.getLowestActiveShard();
  const ssvR = JSON.stringify({
    ...ssv,
    shard,
    lang,
  });
  const scripts = getJsAssets('popup', lang);

  const popEtag = etag(scripts.concat(ssvR).join('_'), { weak: true });
  if (req.headers['if-none-match'] === popEtag) {
    return { html: null, etag: popEtag };
  }

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
        <script>window.ssv=JSON.parse('${ssvR}')</script>
        <link rel="stylesheet" type="text/css" id="globcss" href="${getCssAssets().default}" />
      </head>
      <body>
        <div id="app" class="popup">
        </div>
        ${scripts.map((script) => `<script src="${script}"></script>`).join('')}
      </body>
    </html>
  `;

  return { html, etag: popEtag };
}

export default generatePopUpPage;
