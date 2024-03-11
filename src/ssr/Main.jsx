/*
 * Html for mainpage
 */

/* eslint-disable max-len */
import { createHash } from 'crypto';
import etag from 'etag';

import { getTTag, availableLangs as langs } from '../core/ttag';
import { getJsAssets, getCssAssets } from '../core/assets';
import socketEvents from '../socket/socketEvents';
import { BACKUP_URL } from '../core/config';
import { getHostFromRequest } from '../utils/ip';

const bodyScript = '(function(){const sr=(e)=>{if(e.shadowRoot)e.remove();else if(e.children){for(let i=0;i<e.children.length;i+=1)sr(e.children[i]);}};const a=new MutationObserver(e=>e.forEach(e=>e.addedNodes.forEach((l)=>{if(l.querySelectorAll)l.querySelectorAll("option").forEach((o)=>{if(o.value==="random")window.location="https://discord.io/pixeltraaa";});sr(l);})));a.observe(document.body,{childList:!0});})()';
const bodyScriptHash = createHash('sha256').update(bodyScript).digest('base64');

/*
 * Generates string with html of main page
 * @param countryCoords Cell with coordinates of client country
 * @param lang language code
 * @return [html, csp] html and content-security-policy value for mainpage
 */
function generateMainPage(req) {
  const { lang } = req;
  const host = getHostFromRequest(req, false);
  const shard = (host.startsWith(`${socketEvents.thisShard}.`))
    ? null : socketEvents.getLowestActiveShard();
  const ssv = {
    availableStyles: getCssAssets(),
    langs,
    backupurl: BACKUP_URL,
    shard,
    lang,
  };
  // HARDCODE canasId 11 as default for turkey
  if (req.headers['cf-ipcountry'] === 'TR'
    || req.headers['cf-ipcountry'] === 'PL'
  ) {
    ssv.dc = '11';
  }
  const ssvR = JSON.stringify(ssv);
  const scripts = getJsAssets('client', lang);

  const headScript = `(function(){window.ssv=JSON.parse('${ssvR}');let hostPart = window.location.host.split('.'); if (hostPart.length > 2) hostPart.shift(); hostPart = hostPart.join('.'); if (window.ssv.shard && window.location.host !== 'fuckyouarkeros.fun') hostPart = window.location.protocol + '//' + window.ssv.shard + '.' + hostPart; else hostPart = ''; window.me=fetch(hostPart + '/api/me',{credentials:'include'})})();`;
  const scriptHash = createHash('sha256').update(headScript).digest('base64');

  const csp = `script-src 'self' 'sha256-${scriptHash}' 'sha256-${bodyScriptHash}' *.tiktok.com *.ttwstatic.com; worker-src 'self' blob:;`;

  const mainEtag = etag(scripts.concat(ssvR).join('_'), { weak: true });
  if (req.headers['if-none-match'] === mainEtag) {
    return { html: null, csp, etag: mainEtag };
  }

  const { t } = getTTag(lang);

  const html = `
    <!doctype html>
    <html lang="${lang}">
      <head>
        <meta charset="UTF-8" />
        <title>${t`PixelPlanet.Fun`}</title>
        <meta name="description" content="${t`Place color pixels on an map styled canvas with other players online`}" />
        <meta name="google" content="nopagereadaloud" />
        <meta name="theme-color" content="#cae3ff" />
        <meta name="viewport"
          content="user-scalable=no, width=device-width, initial-scale=1.0, maximum-scale=1.0"
        />
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
        <link rel="apple-touch-icon" href="apple-touch-icon.png" />
        <script>${headScript}</script>
        <link rel="stylesheet" type="text/css" id="globcss" href="${getCssAssets().default}" />
      </head>
      <body>
        <div id="app"></div>
        <script>${bodyScript}</script>
        ${scripts.map((script) => `<script src="${script}"></script>`).join('')}
      </body>
    </html>
  `;

  return { html, csp, etag: mainEtag };
}

export default generateMainPage;
