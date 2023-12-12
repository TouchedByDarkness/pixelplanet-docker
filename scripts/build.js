/*
 * We got so many locals that building them all in one go can lead to out-of-memory error
 * Lets split that here
 */

const path = require('path');
const fs = require('fs');
const webpack = require('webpack');

const minifyCss = require('./minifyCss');
const serverConfig = require('../webpack.config.server.js');
const clientConfig = require('../webpack.config.client.js');
const { getAllAvailableLocals } = clientConfig;

let langs = 'all';
for (let i = 0; i < process.argv.length; i += 1) {
  if (process.argv[i] == '--langs') {
    const newLangs = process.argv[++i];
    if (newLangs) langs = newLangs;
    break;
  }
}

function compile(webpackConfig) {
  return new Promise((resolve, reject) => {
    webpack(webpackConfig).run((err, stats) => {
      if (err) {
        return reject(err);
      }
      const statsConfig = (webpackConfig.length) ? webpackConfig[0].stats : webpackConfig.stats;
      console.log(stats.toString(statsConfig))
      return resolve();
    });
  });
}

async function buildProduction() {
  // cleanup old files
  fs.rmSync(path.resolve(__dirname, '..', 'node_modules', '.cache', 'webpack'), { recursive: true, force: true });
  // fs.rmSync(path.resolve(__dirname, '..', 'dist', 'public', 'assets'), { recursive: true, force: true });

  // decide which languages to build
  let avlangs = getAllAvailableLocals();
  if (langs !== 'all') {
    avlangs = langs.split(',').map((l) => l.trim())
      .filter((l) => avlangs.includes(l));
    if (!avlangs.length) {
      console.error(`ERROR: language ${langs} not available`);
      process.exit(1);
      return;
    }
  }
  console.log('Building locales:', avlangs);

  // server files
  console.log('-----------------------------');
  console.log(`Build server...`);
  console.log('-----------------------------');
  await compile(serverConfig({
    development: false,
    extract: false,
  }));

  // client files
  const st = Date.now();
  for(let i = 0; i < avlangs.length; i += 1) {
    const lang = avlangs[i];
    console.log(`Build client for locale ${lang}...`);
    console.log('-----------------------------');
    await compile(clientConfig({
      development: false,
      analyze: false,
      extract: false,
      locale: lang,
      clean: (i === 0),
    }));
  }
  console.log(`Finished building in ${(Date.now() - st) / 1000}s`);
  await minifyCss();
}

buildProduction();
