/*
 * We got so many locals that building them all in one go can lead to out-of-memory error
 * Lets split that here
 */

const path = require('path');
const fs = require('fs');
const readline = require('readline');
const { spawn } = require('child_process');
const webpack = require('webpack');
const validate = require("ttag-cli/dist/src/commands/validate").default;

const minifyCss = require('./minifyCss');
const serverConfig = require('../webpack.config.server.js');
const clientConfig = require('../webpack.config.client.js');

let langs = 'all';
let doBuildServer = false;
let doBuildClient = false;
let parallel = false;
let recursion = false;
let onlyValidate = false;
for (let i = 0; i < process.argv.length; i += 1) {
  switch (process.argv[i]) {
    case '--langs': {
      const newLangs = process.argv[++i];
      if (newLangs) langs = newLangs;
      break;
    }
    case '--client':
      doBuildClient = true;
      break;
    case `--server`:
      doBuildServer = true;
      break;
    case '--parallel':
      parallel = true;
      break;
    case '--recursion':
      recursion = true;
      break;
    case '--validate':
      onlyValidate = true;
      break;
    default:
      // nothing
  }
}
if (!doBuildServer && !doBuildClient) {
  doBuildServer = true;
  doBuildClient = true;
}

/*
 * get available locals based on the files available in ../i18n
 */
function getAllAvailableLocals() {
  const langDir = path.resolve(__dirname, '..', 'i18n');
  const langs = fs.readdirSync(langDir)
    .filter((e) => (e.endsWith('.po') && !e.startsWith('ssr')))
    .map((l) => l.slice(0, -3));
  langs.unshift('en');
  return langs;
}

/*
 * get amount of msgid and msgstr of po file
 */
function getPoFileStats(file) {
  return new Promise((resolve) => {
    const fileStream = fs.createReadStream(file);
    const lineReader = readline.createInterface({ 
      input: fileStream,
      crlfDelay: Infinity,
    });

    let msgid = 0;
    let msgstr = 0;

    lineReader.on('line', (l) => {
      l = l.trim();
      if (l.endsWith('""')) {
        return;
      }
      let seperator = l.indexOf(' ');
      if (seperator === -1) {
        seperator = l.indexOf('\t');
      }
      if (seperator === -1) {
        return;
      }
      const tag = l.substring(0, seperator);
      if (tag === 'msgid') {
        msgid += 1;
      } else if (tag === 'msgstr') {
        msgstr += 1;
      }
    });

    lineReader.on('close', (l) => {
      resolve({ msgid, msgstr });
    });
  });
}

async function filterLackingLocals(langs, percentage) {
  langs = langs.filter((l) => l !== 'en');
  const promises = [];
  const { msgid, msgstr } = await getPoFileStats(path.resolve(
    __dirname, '..', 'i18n', `template.pot`,
  ));

  const langStats = await Promise.all(langs
    .map((l) => getPoFileStats(
      path.resolve(__dirname, '..', 'i18n', `${l}.po`),
    )));
  const goodLangs = [ 'en' ];
  const badLangs = [];
  for (let i = 0; i < langs.length; i += 1) {
    const lang = langs[i];
    const stats = langStats[i];
    const percent = Math.floor(stats.msgstr / msgid * 100);
    if (percent >= percentage) {
      goodLangs.push(lang);
    } else {
      console.log(`Lang ${lang} completion:`, percent, '%');
      badLangs.push(lang);
    }
  }
  return {
    goodLangs,
    badLangs,
  };
}

/*
 * check if language files contain errors
 */
function validateLangs(langs) {
  console.log('Validating language files...');
  const langDir = path.resolve(__dirname, '..', 'i18n');
  const brokenLangs = [];
  for (const lang of langs) {
    const langFiles = [`${lang}.po`, `ssr-${lang}.po`];
    for (const langFile of langFiles) {
      process.stdout.clearLine(0);
      process.stdout.cursorTo(0);
      process.stdout.write(`i18n/${langFile} `);
      filePath = path.join(langDir, langFile);
      if (!fs.existsSync(filePath)) {
        continue;
      }
      try {
        validate(filePath);
      } catch {
        brokenLangs.push(langFile);
      }
    }
  }
  process.stdout.clearLine(0);
  process.stdout.cursorTo(0);
  return brokenLangs;
}


function compile(webpackConfig) {
  return new Promise((resolve, reject) => {
    webpack(webpackConfig, (err, stats) => {
      if (err) {
        return reject(err);
      }
      const statsConfig = (webpackConfig.length) ? webpackConfig[0].stats : webpackConfig.stats;
      console.log(stats.toString(statsConfig))
      return resolve();
    });
  });
}

function buildServer() {
  console.log('-----------------------------');
  console.log(`Build server...`);
  console.log('-----------------------------');
  const ts = Date.now();

  return new Promise((resolve, reject) => {
    const argsc = (langs === 'all')
      ? ['webpack', '--env', 'extract', '--config', './webpack.config.server.js']
      : ['webpack', '--config', './webpack.config.server.js']
    const serverCompile = spawn('npx', argsc, {
      shell: process.platform == 'win32',
    });
    serverCompile.stdout.on('data', (data) => {
      console.log(data.toString());
    });
    serverCompile.stderr.on('data', (data) => {
      console.error(data.toString());
    });
    serverCompile.on('close', (code) => {
      if (code) {
        reject(new Error('Server compilation failed!'));
      } else {
        console.log('---------------------------------------');
        console.log(`Server Compilation finished in ${Math.floor((Date.now() - ts) / 1000)}s`);
        console.log('---------------------------------------');
        resolve();
      }
    });
  });
}

function buildClients(slangs) {
  return new Promise((resolve, reject) => {
    const clientCompile = spawn('npm', ['run', 'build', '--', '--client', '--recursion', '--langs', slangs.join(',')], {
      shell: process.platform == 'win32',
    });
    clientCompile.stdout.on('data', (data) => {
      console.log(data.toString());
    });
    clientCompile.stderr.on('data', (data) => {
      console.error(data.toString());
    });
    clientCompile.on('close', (code) => {
      if (code) {
        reject(new Error('Client compilation failed!'));
      } else {
        resolve();
      }
    });
  });
}

async function buildClientsSync(avlangs) {
  for(let i = 0; i < avlangs.length; i += 1) {
    const lang = avlangs[i];
    console.log(`Build client for locale ${lang}...`);
    await compile(clientConfig({
      development: false,
      analyze: false,
      extract: false,
      locale: lang,
      clean: false,
      readonly: recursion,
    }));
  }
}

function buildClientsParallel(avlangs) {
  const st = Date.now();
  const numProc = 3;
  let nump = Math.floor(avlangs.length / numProc);
  if (!nump) nump = 1;

  const promises = [];
  while (avlangs.length >= nump) {
    const slangs = avlangs.splice(0, nump);
    promises.push(buildClients(slangs));
  }
  if (avlangs.length) {
    promises.push(buildClientsSync(avlangs));
  }
  return Promise.all(promises);
}

async function build() {
  const st = Date.now();
  // cleanup old files
  if (!recursion) {
    fs.rmSync(path.resolve(__dirname, '..', 'node_modules', '.cache', 'webpack'), { recursive: true, force: true });
  }

  // decide which languages to build
  let avlangs = getAllAvailableLocals();
  if (langs !== 'all') {
    avlangs = langs.split(',').map((l) => l.trim())
      .filter((l) => avlangs.includes(l));
  } else {
    let badLangs;
    ({ goodLangs: avlangs, badLangs } = await filterLackingLocals(avlangs, 50));
    if (badLangs.length) {
      console.log(
        'Skipping',
        badLangs.length,
        'locals because of low completion:',
        badLangs,
      );
    }
  }
  if (!avlangs.length) {
    console.error(`ERROR: language ${langs} not available`);
    process.exit(1);
    return;
  }
  console.log('Building', avlangs.length, 'locales:', avlangs);

  const brokenLangs = validateLangs(avlangs);
  if (brokenLangs.length) {
    console.error('ERROR: Translation files', brokenLangs, 'contain errors.');
    process.exit(2);
    return;
  }
  if (onlyValidate) {
    console.log('Validation complete, everything is fine.');
    process.exit(0);
    return;
  }

  const promises = [];

  if (doBuildServer) {
    promises.push(buildServer());
  }

  if (doBuildClient) {
    if (!recursion) {
      console.log('Building one client package...');
      await compile(clientConfig({
        development: false,
        analyze: false,
        extract: (langs === 'all'),
        locale: avlangs.shift(),
        clean: true,
        readonly: false,
      }));

      console.log('-----------------------------');
      console.log(`Minify CSS assets...`);
      console.log('-----------------------------');
      await minifyCss();
    }

    if (parallel) {
      promises.push(buildClientsParallel(avlangs));
    } else {
      promises.push(buildClientsSync(avlangs));
    }
  }
  await Promise.all(promises);

  if (!recursion) {
    console.log(`Finished building in ${(Date.now() - st) / 1000}s`);
  } else {
    console.log(`Worker done in ${(Date.now() - st) / 1000}s`);
  }
}

build();
