/*
 * Provide translation serverside
 */
import { TTag } from 'ttag';
import cookie from 'cookie';

import { languageFromLocalisation } from '../utils/location';
import { getLangsOfJsAsset } from './assets';

// eslint-disable-next-line max-len
const localeImports = require.context('../../i18n', false, /^\.[/\\]ssr-.+\.po$/);

const ttags = {};

(() => {
  const langs = localeImports.keys();
  const jsLangs = getLangsOfJsAsset('client');

  if (jsLangs.includes('en')) {
    ttags.en = new TTag();
  }

  for (let i = 0; i < langs.length; i += 1) {
    const file = langs[i];
    // ./ssr-de.po
    const lang = file.replace('./ssr-', '').replace('.po', '').toLowerCase();
    if (jsLangs.includes(lang)) {
      const ttag = new TTag();
      ttag.addLocale(lang, localeImports(file).default);
      ttag.useLocale(lang);
      ttags[lang] = ttag;
    }
  }
})();

export function getTTag(lang) {
  return ttags[lang] || ttags.en || Object.values(ttags)[0];
}

/*
 * express middleware for getting language
 * It checks the lang cookie, and if not present,
 * the Accept-Language header
 */
export function expressTTag(req, res, next) {
  const cookies = cookie.parse(req.headers.cookie || '');
  const language = cookies.plang || req.headers['accept-language'];
  let lang = languageFromLocalisation(language);
  if (!ttags[lang]) {
    if (ttags.en) {
      lang = 'en';
    } else {
      [lang] = Object.keys(ttags);
    }
  }
  req.lang = lang;
  req.ttag = ttags[lang];
  next();
}

export default ttags;
