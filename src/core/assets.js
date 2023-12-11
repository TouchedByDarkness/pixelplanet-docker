import fs from 'fs';
import path from 'path';

const ASSET_DIR = '/assets';
const assetDir = path.join(__dirname, 'public', ASSET_DIR);
/*
 * {
 *   js:
 *     client:
 *       default: "/assets/client.defult.134234.js",
 *       de: "/assets/client.de.32834234.js",
 *       [...]
 *     [...]
 *   css:
 *     default: "/assets/default.234234.css",
 *     dark-round: "/assets/dark-round.234233324.css",
 *     [...]
 * }
 */
let assets;

/*
 * check files in asset folder and write insto assets object
 */
function checkAssets() {
  const parsedAssets = {
    js: {},
    css: {},
  };
  const assetFiles = fs.readdirSync(assetDir);
  const birthtimes = {};

  for (const filename of assetFiles) {
    const parts = filename.split('.');

    // File needs to have a timestamp in its name
    if (parts.length < 3 || Number.isNaN(Number(parts[parts.length - 2]))) {
      continue;
    }
    // if multiple candidates exist, take most recent created file
    const birthtime = fs.statSync(path.resolve(assetDir, filename))
      .birthtime.getTime();
    const ident = parts.filter((a, ind) => ind !== parts.length - 2).join('.');
    if (birthtimes[ident] && birthtimes[ident] > birthtime) {
      continue;
    }
    birthtimes[ident] = birthtime;

    const ext = parts[parts.length - 1];
    const relPath = `${ASSET_DIR}/${filename}`;

    switch (ext.toLowerCase()) {
      case 'js': {
        // Format: name.[lang].[timestamp].js
        if (parts.length === 4) {
          const [name, lang] = parts;
          if (!parsedAssets.js[name]) {
            parsedAssets.js[name] = {};
          }
          parsedAssets.js[name][lang] = relPath;
        } else {
          const [name] = parts;
          parsedAssets.js[name] = relPath;
        }
        break;
      }
      case 'css': {
        // Format: [dark-]name.[timestamp].js
        parsedAssets.css[parts[0]] = relPath;
        break;
      }
      default:
        // nothing
    }
  }
  return parsedAssets;
}

// eslint-disable-next-line prefer-const
assets = checkAssets();

export function getJsAssets(name, lang) {
  const jsAssets = [];
  const mainAsset = (lang && assets.js[name][lang])
    || assets.js[name].default
    || assets.js[name];
  if (mainAsset) {
    jsAssets.push(mainAsset);
  }

  switch (name) {
    case 'client':
      jsAssets.push(assets.js.vendor);
      break;
    case 'globe':
      jsAssets.push(assets.js.three);
      break;
    default:
      // nothing
  }
  return jsAssets;
}

export function getCssAssets() {
  return assets.css;
}
