/*
 * We got so many locals that building them all in one go can lead to out-of-memory error
 * Lets split that here
 */

const path = require('path');
const fs = require('fs');
const webpack = require('webpack');
const serverConfig = require('../webpack.config.server.js');
const clientConfig = require('../webpack.config.client.js');
const { getAllAvailableLocals } = clientConfig;

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
  // server files
  console.log('-----------------------------');
  console.log(`Build server...`);
  console.log('-----------------------------');
  await compile(serverConfig({
    development: false,
    extract: false,
  }));
  // client files
  const langs = getAllAvailableLocals();
  console.log('Available locales:', langs);
  const st = Date.now();
  for(let i = 0; i < langs.length; i += 1) {
    const lang = langs[i];
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
}

buildProduction();
