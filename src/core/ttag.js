/*
 * Provide translation serverside
 */
import { TTag } from 'ttag';
import cookie from 'cookie';

import { languageFromLocalisation } from '../utils/location';

// eslint-disable-next-line max-len
const localeImports = require.context('../../i18n', false, /^\.[/\\]ssr-.+\.po$/);

const ttags = {
  en: new TTag(),
};

(() => {
  const langs = localeImports.keys();
  for (let i = 0; i < langs.length; i += 1) {
    const file = langs[i];
    const ttag = new TTag();
    // ./ssr-de.po
    const lang = file.replace('./ssr-', '').replace('.po', '');
    ttag.addLocale(lang, localeImports(file).default);
    ttag.useLocale(lang);
    ttags[lang] = ttag;
  }
})();

export function getTTag(lang) {
  return ttags[lang] || ttags.en;
}

/*
 * express middleware for getting language
 * It checks the lang cookie, and if not present,
 * the Accept-Language header
 */
export function expressTTag(req, res, next) {
  const cookies = cookie.parse(req.headers.cookie || '');
  const language = cookies.plang || req.headers['accept-language'];
  req.lang = languageFromLocalisation(language);
  req.ttag = getTTag(req.lang);
  next();
}

export default ttags;
