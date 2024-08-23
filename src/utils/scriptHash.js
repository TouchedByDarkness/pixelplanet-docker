/*
 * hash a script, given as a string, into
 * Content-Security-Policy consumable sha hashes
 */

import { createHash } from 'crypto';

export default function hashScript(scriptString) {
  return [
    scriptString,
    /*
     * LibreJS modifies the script, which should be considered a bug on their side
     */
    `/* LibreJS: script accepted by user. */\n${scriptString}`,
  ].map(
    (s) => `'sha256-${createHash('sha256').update(s).digest('base64')}'`,
  ).join(' ');
}
