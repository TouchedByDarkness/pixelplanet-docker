/*
 * webpack loader that reads po files
 */

const parser = require("ttag-cli/dist/src/lib/parser");

module.exports = function (source) {
  if (this.cacheable) this.cacheable();
  const includeFuzzy = this.getOptions().includeFuzzy;

  let poData = parser.parse(source);

  for (const ctxt of Object.values(poData.translations)) {
    for (const msgid of Object.keys(ctxt)) {
      const msg = ctxt[msgid];
      if (msg.comments) {
        if (!includeFuzzy && msg.comments.flag
          && msg.comments.flag.includes('fuzzy')) {
          delete ctxt[msgid];
        } else {
          delete msg.comments;
        }
      }
    }
  }

  value = JSON.stringify(poData)
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');

  return `export default ${ value };`;
}
