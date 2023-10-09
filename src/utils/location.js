/*
 * provide location and lang specific features
 */

/*
 * gets preferred language out of localisation string
 * @param location string (like from accept-language header)
 * @return language code
 */
export function languageFromLocalisation(localisation) {
  if (!localisation) {
    return 'default';
  }
  let lang = localisation;
  let i = lang.indexOf('-');
  if (i !== -1) {
    lang = lang.slice(0, i);
  }
  i = lang.indexOf(',');
  if (i !== -1) {
    lang = lang.slice(0, i);
  }
  i = lang.indexOf(';');
  if (i !== -1) {
    lang = lang.slice(0, i);
  }
  if (lang === 'en') {
    lang = 'default';
  }
  return lang.toLowerCase();
}

/*
 * get country code to language code for displaying flags
 * to languages
 * @param lang 2-char lang code
 * @return 2-char country code
 */
const lang2CC = {
  en: 'gb',
  dz: 'bt',
  hy: 'am',
  uk: 'ua',
  ca: 'ct',
  sr: 'rs',
  be: 'by',
  kk: 'kz',
  da: 'dk',
  fa: 'ir',
};
export function langCodeToCC(lang) {
  return lang2CC[lang] || lang;
}
