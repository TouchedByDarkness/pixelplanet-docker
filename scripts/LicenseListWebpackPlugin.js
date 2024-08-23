/*
 * Creates json file of used licenses in a webpack bundle
 * 
 * Make sure that a licenses.json file is present in the same directory as
 * this plugin, you can get it from:
 * https://github.com/spdx/license-list-data/blob/main/json/licenses.json
 * 
 */

const path = require('path');
const fs = require('fs');
const spdxCorrect = require('spdx-correct');
const spdxParse = require('spdx-expression-parse');

const PLUGIN_NAME = 'LicenseListWebpackPlugin';

const licensesOverride = {
  'Apache-2.0': { url: 'http://www.apache.org/licenses/LICENSE-2.0' },
  'Artistic-2.0': { url: 'http://www.perlfoundation.org/artistic_license_2_0' },
  'BSL-1.0': { url: 'http://www.boost.org/LICENSE_1_0.txt' },
  'BSD-3-Clause': { url: 'http://opensource.org/licenses/BSD-3-Clause' },
  'CPAL-1.0': { url: 'http://opensource.org/licenses/cpal_1.0' },
  'CC0-1.0': { url: 'http://creativecommons.org/publicdomain/zero/1.0/legalcode' },
  'EPL-1.0': { url: 'http://www.eclipse.org/legal/epl-v10.html' },
  'MIT': { url: 'http://www.jclark.com/xml/copying.txt', name: 'Expat License' },
  'BSD-2-Clause-FreeBSD': { url: 'http://www.freebsd.org/copyright/freebsd-license.html' },
  'GPL-2.0-only': { url: 'http://www.gnu.org/licenses/gpl-2.0.html' },
  'GPL-2.0-or-later': { url: 'http://www.gnu.org/licenses/gpl-2.0.html' },
  'GPL-2.0+': { url: 'http://www.gnu.org/licenses/gpl-2.0.html' },
  'GPL-2.0': { url: 'http://www.gnu.org/licenses/gpl-2.0.html' },
  'GPL-3.0-only': { url: 'http://www.gnu.org/licenses/gpl-3.0.html' },
  'GPL-3.0-or-later': { url: 'http://www.gnu.org/licenses/gpl-3.0.html' },
  'GPL-3.0+': { url: 'http://www.gnu.org/licenses/gpl-3.0.html' },
  'GPL-3.0': { url: 'http://www.gnu.org/licenses/gpl-3.0.html' },
  'LGPL-2.1-only': { url: 'http://www.gnu.org/licenses/lgpl-2.1.html' },
  'LGPL-2.1-or-later': { url: 'http://www.gnu.org/licenses/lgpl-2.1.html' },
  'LGPL-2.1+': { url: 'http://www.gnu.org/licenses/lgpl-2.1.html' },
  'LGPL-2.1': { url: 'http://www.gnu.org/licenses/lgpl-2.1.html' },
  'LGPL-3.0-only': { url: 'http://www.gnu.org/licenses/lgpl-3.0.html' },
  'LGPL-3.0-or-later': { url: 'http://www.gnu.org/licenses/lgpl-3.0.html' },
  'LGPL-3.0+': { url: 'http://www.gnu.org/licenses/lgpl-3.0.html' },
  'LGPL-3.0': { url: 'http://www.gnu.org/licenses/lgpl-3.0.html' },
  'AGPL-3.0-only': { url: 'http://www.gnu.org/licenses/agpl-3.0.html' },
  'AGPL-3.0-or-later': { url: 'http://www.gnu.org/licenses/agpl-3.0.html' },
  'AGPL-3.0+': { url: 'http://www.gnu.org/licenses/agpl-3.0.html' },
  'AGPL-3.0': { url: 'http://www.gnu.org/licenses/agpl-3.0.html' },
  'ISC': { url: 'https://www.isc.org/downloads/software-support-policy/isc-license/' },
  'MPL-2.0': { url: 'http://www.mozilla.org/MPL/2.0' },
  'UPL-1.0': { url: 'https://oss.oracle.com/licenses/upl/' },
  'WTFPL': { url: 'http://www.wtfpl.net/txt/copying/' },
  'Unlicense': { url: 'http://unlicense.org/UNLICENSE' },
  'X11 License': { url: 'http://www.xfree86.org/3.3.6/COPYRIGHT2.html#3' },
  'XFree86-1.1': { url: 'http://www.xfree86.org/current/LICENSE4.html' },
};

/*
 * load json file
 * @param filepath
 * @return parsed json object or null if failed
 */
function readJSONFile(filepath) {
  if (fs.existsSync(filepath)) {
    return JSON.parse(fs.readFileSync(filepath).toString('utf8'));
  }
  return null;
}

/*
 * resolve %{variable} in string templates
 * @param template
 * @param values values to fill in { variable: value,... }
 */
function resolveStringTemplate(template, values) {
  if (typeof template === 'function') {
    return template(values);
  }

  let text = '';
  let pStart = 0;
  let isInside = 0;
  for (let i = 0; i < template.length; i += 1) {
    const char = template[i];
    if (isInside === 2) {
      if (char === '}') {
        isInside = 0;
        text += values[template.slice(pStart, i)];
        pStart = i + 1;
      }
    } else if (char === '%') {
      isInside = 1;
    } else if (isInside === 1) {
      if (char === '{') {
        isInside = 2;
        text += template.slice(pStart, i - 1);
        pStart = i + 1;
      } else {
        isInside = 0;
      }
    }
  }
  text += template.slice(pStart);
  return text;
}

function escapeQuotes(string) {
  return string.split('"').join('&quot;');
}

/*
 * merge two nested objects that have arrays with { name, ...} elements
 * accoding to their name
 */
function deepMergeNamedArrays(obj1, obj2) {
  if (Array.isArray(obj1) && Array.isArray(obj2)) {
    for (let val2 of obj2) {
      const val1 = obj1.find(
        (val) => val.name && val.name === val2.name && val.url === val2.url
      );
      if (val1) {
        deepMergeNamedArrays(val1, val2);
      } else {
        obj1.push(val2);
      }
    }
  } else {
    for (let key in obj2) {
      if (obj2.hasOwnProperty(key)) {
        if (obj2[key] instanceof Object && obj1[key] instanceof Object) {
          obj1[key] = deepMergeNamedArrays(obj1[key], obj2[key]);
        } else {
          obj1[key] = obj2[key];
        }
      }
    }
  }
  return obj1;
}

/*
 * check if two arrays with { name, ...} elemenns are equal
 */
function deepCompareNamedArrays(obj1, obj2) {
  
}

class LicenseListWebpackPlugin {
  chunkIdToName = {};
  chunkNameToJsAsset = {};
  packageJsonCache = {};
  packageTextFiles = {};
  copiedFiles = new Map();
  spdxLicenses = {};
  logger = console;
  exclude = [];
  override = {};
  outputDir;
  outputPath;
  sourcesOutputDir;
  sourcesOutputPath;
  sourcesPublicPath;
  outputFile;
  outputFilename;
  outputHtmlFilename;
  buildName;
  buildId;
  output = [];
  scriptsOutput;
  includeLicenseFiles;
  includeSourceFiles;
  mergeByChunnkName;
  publicPathOverride;
  processOutput;
  sourcesDir = 'sources';
  static srcExtsRegexp = /^.*\.(js|ts|jsx|coffee|lua)$/;
  static filesToCopy = ['license', 'copying', 'authors', 'code_of_conduct'];
  static filePathCleanUpRegEx = /^([.\/]*node_modules|\.)\//;
  static modulePathCleanUpRegEx = /^([.\/]*node_modules\/[^\/]*|\.)\//;

  /*
   * @param options {
   *   outputDir,
   *   filename,
   *   append,
   *   buildId,
   *   buildName,
   *   exclude: [],
   *   override: {},
   *   mergeByChunnkName: boolean,
   *   includeLicenseFiles: boolean,
   *   includeSourceFiles: boolean,
   *   souces: {},
   *   processOutput: function,
   * }
   */
  constructor(options = {}) {
    this.outputDir = options.outputDir || 'dist';
    this.sourcesOutputDir = path.join(options.outputDir, this.sourcesDir);
    this.outputFilename = options.filename || 'licenses.json';
    this.outputHtmlFilename = options.htmlFilename || null;
    this.buildName = options.name || 'web';
    this.buildId = options.id || 'jslicense-labels1';
    this.publicPathOverride = options.publicPath;
    this.includeLicenseFiles = options.includeLicenseFiles;
    this.includeSourceFiles = options.includeSourceFiles;
    this.mergeByChunnkName = options.mergeByChunnkName;
    this.processOutput = options.processOutput;
    this.append = options.append;
    // populate module prefix patterns to exclude
    if (Array.isArray(options.exclude)) {
      this.options['exclude'].forEach(toExclude => {
        if (!toExclude.startsWith('.')) {
          this.exclude.push('./' + path.join('node_modules', toExclude));
        } else {
          this.exclude.push(toExclude);
        }
      });
    }
    // populate overrides
    if (options.override) {
      for (const [srcFilePrefixKey, moduleOverride] of Object.entries(
        options.override,
      )) {
        const srcFilePrefix = (srcFilePrefixKey.startsWith('.'))
          ? srcFilePrefixKey
          : './' + path.join('node_modules', srcFilePrefixKey) + '/';
        if (moduleOverride.license) {
          const parsedSpdxLicenses = this.parseSpdxLicenseExpression(
            moduleOverride.license, `file ${srcFilePrefixKey}`,
          );
          moduleOverride.licenses = this.spdxToWebLabelsLicenses(
            parsedSpdxLicenses,
          );
        }
        this.override[srcFilePrefix] = moduleOverride;
      }
    }
    // spdx licenses informations
    const spdxLicenseFile = readJSONFile(
      path.resolve(__dirname, 'licenses.json'),
    );
    if (spdxLicenseFile?.licenses) {
      spdxLicenseFile.licenses.forEach((l) => {
        const override = licensesOverride[l.licenseId];
        if (override) {
          if (override.url) l.reference = override.url;
          if (override.name) l.name = override.name;
        }
        this.spdxLicenses[l.licenseId] = l;
      });
    }
  }

  static findPackageJsonPath(srcFilePath) {
    const pathSplit = srcFilePath.split('/');
    let packageJsonPath;
    for (let i = 3; i < pathSplit.length; ++i) {
      packageJsonPath = path.join(...pathSplit.slice(0, i), 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        break;
      }
    }
    return packageJsonPath;
  }

  // try to get an url out of repository string
  static parseRepositoryString(repository) {
    if (!repository) return repository;
    if (repository.endsWith('/')) {
      repository = repository.substring(0, repository.length - 1);
    }
    if (repository.endsWith('.git')) {
      repository = repository.substring(0, repository.length - 4);
    }
    // not path, url or anything, it's github
    if (repository.indexOf('://') === -1 && repository.indexOf('.') === -1 && repository.indexOf(':') === -1) {
      return `https://github.com/${repository}`;
    }
    let pre = repository.substring(0, repository.indexOf(':'));
    let post = repository.substring(repository.indexOf(':') + 1);
    if (pre) {
      switch (pre) {
        case 'github':
          return `https://github.com/${post}`;
        case 'gist':
          return `https://gist.github.com/${post}`;
        case 'gitlab':
          return `https://gitlab.com/${post}`;
        case 'bitbucket':
          return `https://bitbucket.org/${post}`;
        default:
          //
      }
      // http://... git+http://...
      if (pre.endsWith('http')) {
        return `http:${post}`;
      }
      // https://... git+https://...
      if (pre.endsWith('https')) {
        return `https:${post}`;
      }
      // git://... ssh://user@...
      if (post.startsWith('//')) {
        const findAt = post.indexOf('@');
        if (findAt !== -1) {
          const findSlash = post.indexOf('/', 2);
          const findDouble = post.indexOf(':');
          // git+ssh://git@github.com:user/repo
          if (findDouble && findDouble < findSlash) {
            post = post.substring(0, findDouble) + '/' + post.substring(findDouble + 1);
          }
          if (!findSlash || findSlash > findAt) {
            post = '//' + post.substring(post.indexOf('@') + 1);
          }
        }
        return `https:${post}`;
      }
      // git@github.com:user/repo
      if (pre.indexOf('@') !== -1) {
        return `https://${pre.substring(pre.indexOf('@') + 1)}/${post}`;
      }
    }
    return `https://${repository}`;
  }

  summarizeOutput() {
    const { scriptsOutput } = this;
    const modulesWithoutSources = [];

    scriptsOutput.sort(
      (a, b) => a.name.split('.').length - b.name.split('.').length || a.name.localeCompare(b.name),
    );

    /*
     * Sort modules and sources in alphabethical order and merge all sources
     * and licenses of modules to create an overall columns
    */
    for (const scriptObj of scriptsOutput) {
      const sources = [];
      const licenses = [];
      scriptObj.sources = sources;
      scriptObj.licenses = licenses;

      scriptObj.modules.sort((a, b) => a.name.localeCompare(b.name));

      for (const module of scriptObj.modules) {
        if (!module.sources.length && !modulesWithoutSources.includes(module.name)) {
          modulesWithoutSources.push(module.name);
        }

        module.sources.sort((a, b) => a.name.localeCompare(b.name));
        module.sourceFiles.sort((a, b) => a.name.localeCompare(b.name));

        module.sources.forEach((s) => {
          if (!sources.some((l) => l.url === s.url)) {
            sources.push(s);
          }
        });
        module.licenses.forEach((s) => {
          if (!licenses.some((l) => l.name === s.name)) {
            licenses.push(s);
          }
        });
      }
    }
    if (modulesWithoutSources.length) {
      this.logger.info(`The following Modules have no Sources: ${modulesWithoutSources.join(', ')}`);
    }
  }

  /*
   * parse output object to HTML
   */
  static generateHTML(output, onlyTables = false) {
    const tables = output.map((t) => {

      const scripts = t.scripts.map((s) => {

        const assets = s.assets.map(
          (a) => `<a class="ls_asset" href="${a.url}">${a.name}</a>`,
        );
        const licenses = s.licenses.map(
          (l) => `<a class="ls_license${l.isLibre ? ' libre' : ''}" href="${l.url}" title="${escapeQuotes(l.name)}">${l.id}</a>`
        );
        let sources = s.sources.map(
          (s) => `<a class="ls_source" href="${s.url}">${s.name}</a>`,
        ).join('<br>\n');
        if (s.sources.length > 3) {
          sources = `<details><summary>${s.sources.length} Sources</summary>${sources}</details>`;
        }

        let modules = s.modules.map((m) => {
          let moduleString = '<div class="ls_module"><p class="ls_m_name">';
          if (m.url) {
            moduleString += `<a href="${m.url}">${m.name}</a>`;
          } else {
            moduleString += m.name;
          }
          if (m.version) {
            moduleString += `&nbsp;${m.version}`;
          }
          if (m.repository) {
            moduleString += ` (<a class="ls_repository" href="${m.repository}">repo</a>)`;
          }
          const mLicenses = m.licenses.map(
            (l) => `<a class="ls_license${l.isLibre ? ' libre' : ''}" href="${l.url}" title="${escapeQuotes(l.name)}">${l.id}</a>`,
          );
          let mFiles = '';
          if (m.files?.length) {
            mFiles = m.files.map(
              (l) => `<a class="ls_file" href="${l.url}">${l.name}</a>`
            ).join(' ');
            mFiles = `<br>${mFiles}`;
          }
          let mSources = '';
          if (m.sources?.length) {
            mSources = m.sources.map(
              (s) => `<a class="ls_source" href="${s.url}">${s.name}</a>`,
            ).join('<br>\n');
            mSources = `<details><summary>${m.sources.length > 1 ? `${m.sources.length} Sources` : 'Source'}</summary>${mSources}</details>`;
          }
          let mSourceFiles = '';
          if (m.sourceFiles?.length) {
            mSourceFiles = m.sourceFiles.map(
              (s) => s.url ? `<a class="ls_sourcefiles" href="${s.url}">${s.name}</a>` : `<span class="ls_source">${s.name}</span>`,
            ).join('<br>\n');
            mSourceFiles = `<details><summary>${m.sourceFiles.length > 1 ? `${m.sourceFiles.length} Source Files` : 'Source File'}</summary>${mSourceFiles}</details>`;
          }

          moduleString += `</p>${mLicenses.join(' ')}${mFiles}${mSources}${mSourceFiles}</div>`;
          return moduleString;
        }).join('\n');
        if (s.modules.length > 3) {
          modules = `<details><summary>${s.modules.length} Modules</summary>${modules}</details>`
        }

        return `<tr>
          <td><p class="ls_chunk_name">${s.name}</p>${assets.join('<br>')}</td>
          <td>${licenses.join(' ')}</td>
          <td>${sources}</td>
          <td>${modules}</td>
        </tr>`;
      });

      return `<h3>${t.name}</h3>
        <table id="${t.id}" class="ls_table">
          <thead>
            <tr>
              <th>Script</th>
              <th>Licenses</th>
              <th>Sources</th>
              <th>Modules</th>
            </tr>
          </thead>
            ${scripts.join('\n')}
          <tbody>
        </table>
      `;
    });
    
    if (onlyTables) {
      return tables.join('<br>\n');
    }

    return `<!DOCTYPE html><html lang="en">
      <head>
        <title>JavaScript Sources</title>
        <style>
          .ls_table, .ls_table td {
            white-space: nowrap;
          }
          .ls_table {
            border-collapse: collapse;
          }
          .ls_table, .ls_table thead {
            border: 1px solid black;
          }
          .ls_table td {
            padding: 4px;
            height: 60px;
          }
          .ls_table td + td {
            border-left: 1px solid #c4c4c4;
          }
          .ls_table tr:nth-child(even) {
            background-color: #f2f2f2;
          }
          summary {
            cursor: pointer;
          }
          .ls_chunk_name {
            font-weight: bold;
          }
          .ls_module {
            background-color: #f7eee7;
            border-radius: 10px;
            border: thin solid gray;
            margin: 3px;
            padding: 5px;
          }
          .ls_license {
            background-color: #f2c7c7;
            border-radius: 5px;
            border: thin solid gray;
          }
          .ls_license.libre {
            background-color: #c6ffc6;
          }
          span.ls_source {
            color: gray;
          }
        </style>
      </head>
      <body>
        ${tables.join('<br>\n')}
      </body>
    </html>`;
  }

  findTextFile(packageJsonDir, name) {
    let packageTextFiles = this.packageTextFiles[name];
    if (!packageTextFiles) {
      packageTextFiles = {};
      this.packageTextFiles[name] = packageTextFiles;
    }
    if (!packageTextFiles.hasOwnProperty(packageJsonDir)) {
      let foundTextFile;
      fs.readdirSync(packageJsonDir).forEach(file => {
        if (foundTextFile) {
          return;
        }
        if (file.toLowerCase().startsWith(name)) {
          foundTextFile = path.join(packageJsonDir, file);
        }
      });
      packageTextFiles[packageJsonDir] = foundTextFile;
    }
    return packageTextFiles[packageJsonDir];
  }

  copyTextFile(textFilePath) {
    if (!textFilePath) return '';
    const ext = (textFilePath.indexOf('.') === -1) ? '.txt' : '';
    return this.copyFileToOutputPath(textFilePath, ext);
  }
  
  parsePackageJson(packageJsonPath) {
    if (!this.packageJsonCache.hasOwnProperty(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath).toString('utf8'));

      packageJson.licenses = this.extractLicenseInformation(packageJson);
      const licenseDir = path.join(...packageJsonPath.split('/').slice(0, -1));
      if (this.includeLicenseFiles) {
        packageJson.files = LicenseListWebpackPlugin.filesToCopy.map(
          (filename) => this.findTextFile(licenseDir, filename),
        ).filter((f) => f);
      } else {
        delete packageJson.files;
      }
      const repositoryUrl = packageJson.repository?.url;
      if (repositoryUrl) packageJson.repository = repositoryUrl;
      this.packageJsonCache[packageJsonPath] = packageJson;
    }
    return this.packageJsonCache[packageJsonPath];
  }
  
  parseSpdxLicenseExpression(spdxLicenseExpression, context) {
    let parsedLicense;
    try {
      parsedLicense = spdxParse(spdxCorrect(spdxLicenseExpression));
      if (spdxLicenseExpression.indexOf('AND') !== -1) {
        this.logger.warn(`The SPDX license expression '${spdxLicenseExpression}' associated to ${context} ` +
        'contains an AND operator, this is currently not properly handled and erroneous ' +
        'licenses information may be provided to LibreJS');
      }
    } catch (e) {
      this.logger.warn(`Unable to parse the SPDX license expression '${spdxLicenseExpression}' associated to ${context}.`);
      this.logger.warn('Some generated JavaScript assets may be blocked by LibreJS due to missing license information.');
      parsedLicense = {'license': spdxLicenseExpression};
    }
    return parsedLicense;
  }
  
  spdxToWebLabelsLicense(spdxLicenceId) {
    const licenseInfo = this.spdxLicenses[spdxLicenceId];
    if (licenseInfo) {
      if (!licenseInfo.isFsfLibre) {
        this.logger.info(`License '${spdxLicenceId}' is not a Free license according to the FSF.`);
      }
      return {
        id: spdxLicenceId,
        name: licenseInfo.name,
        url: licenseInfo.reference,
        isLibre: licenseInfo.isFsfLibre,
      };
    }
    this.logger.warn(`Unable to associate the SPDX license identifier '${spdxLicenceId}' to a LibreJS supported license.`);
    this.logger.warn('Some generated JavaScript assets may be blocked by LibreJS due to missing license information.');
    return {
      'name': spdxLicenceId,
      'url': '',
    };
  }
  
  spdxToWebLabelsLicenses(spdxLicenses) {
    // This method simply extracts all referenced licenses in the SPDX expression
    // regardless of their combinations.
    // TODO: Handle licenses combination properly once LibreJS has a spec for it.
    let ret = [];
    if (spdxLicenses.hasOwnProperty('license')) {
      ret.push(this.spdxToWebLabelsLicense(spdxLicenses['license']));
    } else if (spdxLicenses.hasOwnProperty('left')) {
      if (spdxLicenses['left'].hasOwnProperty('license')) {
        const licenseData = this.spdxToWebLabelsLicense(spdxLicenses['left']['license']);
        ret.push(licenseData);
      } else {
        ret = ret.concat(this.spdxToWebLabelsLicenses(spdxLicenses['left']));
      }
      ret = ret.concat(this.spdxToWebLabelsLicenses(spdxLicenses['right']));
    }
    return ret;
  }

  extractLicenseInformation(packageJson) {
    let spdxLicenseExpression;
    if (packageJson.hasOwnProperty('license')) {
      spdxLicenseExpression = packageJson['license'];
    } else if (packageJson.hasOwnProperty('licenses')) {
      // for node packages using deprecated licenses property
      const licenses = packageJson['licenses'];
      if (Array.isArray(licenses)) {
        const l = [];
        licenses.forEach(license => {
          l.push(license['type']);
        });
        spdxLicenseExpression = l.join(' OR ');
      } else {
        spdxLicenseExpression = licenses['type'];
      }
    }
    const parsedSpdxLicenses = this.parseSpdxLicenseExpression(
      spdxLicenseExpression, `module ${packageJson['name']}`,
    );
    return this.spdxToWebLabelsLicenses(parsedSpdxLicenses);
  }

  /*
   * copy source or license file to output directory
   * @param srcFilePath full path to file
   * @param ext file extionsion to append (dot included like '.txt')
   * @return public path if successful, null if not
   */
  copyFileToOutputPath(srcFilePath, ext = '') {
    let publicFilePath = this.copiedFiles.get(srcFilePath);
    if (publicFilePath) {
      return publicFilePath;
    }
    if (srcFilePath.indexOf('://') !== -1 || !fs.existsSync(srcFilePath)) {
      return null;
    }

    // determine output bath based on folder within package
    let destPath = srcFilePath.replace(
      LicenseListWebpackPlugin.filePathCleanUpRegEx,
      '',
    ) + ext;

    publicFilePath = path.join(this.sourcesPublicPath, destPath);
    const destDir = path.join(this.sourcesOutputPath, ...destPath.split('/').slice(0, -1));
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    fs.copyFileSync(
      srcFilePath, path.join(this.sourcesOutputPath, destPath),
    );
    this.copiedFiles.set(srcFilePath, publicFilePath);
    return publicFilePath;
  }
  
  getPackageInformation(srcFilePath) {
    let name;
    let version;
    let licenses;
    let repository;
    let repositoryUrl;
    let files;
    let homepage;
    let sources = [];
    let moduleSourceTemplate;
    
    // find and parse the corresponding package.json file
    let packageJsonPath;
    const nodeModule = srcFilePath.startsWith('./node_modules/');
    if (nodeModule) {
      packageJsonPath = LicenseListWebpackPlugin.findPackageJsonPath(srcFilePath);
    } else {
      packageJsonPath = './package.json';
    }
    ({
      name,
      version,
      homepage,
      licenses,
      repository,
      files,
    } = this.parsePackageJson(packageJsonPath));
    repositoryUrl = LicenseListWebpackPlugin.parseRepositoryString(repository);
    
    // custom overrides
    for (const srcFilePrefix in this.override) {
      if (srcFilePath.startsWith(srcFilePrefix)) {
        const moduleOverride = this.override[srcFilePrefix];
        if (moduleOverride.replace) {
          name = undefined;
          version = undefined;
          homepage = undefined,
          licenses = undefined;
          repository = undefined;
          repositoryUrl = undefined;
          files = undefined;
          sources.length = 0;
          moduleSourceTemplate = undefined;
        }
        const {
          name: overridename,
          version: overrideVersion,
          homepage: overrideHomepage,
          repository: overrideRepository,
          licenses: overrideLicenses,
          files: overrideFiles,
          sources: overrideSources,
          moduleSourceTemplate: overrideModuleSource,
        } = moduleOverride;
        if (overridename) name = overridename;
        if (overrideVersion) version = overrideVersion;
        if (overrideHomepage) version = overrideHomepage;
        if (overrideRepository) {
          repository = overrideRepository;
          repositoryUrl = LicenseListWebpackPlugin.parseRepositoryString(repository);
        }
        if (overrideModuleSource) {
          if (overrideModuleSource.startsWith?.('branch:')) {
            moduleSourceTemplate = `%{repositoryUrl}/src/branch/${overrideModuleSource.substring(7)}/%{filename}`;
          } else {
            moduleSourceTemplate = overrideModuleSource;
          }
        }
        if (overrideLicenses) {
          if (!Array.isArray(licenses)) licenses = [];
          licenses = licenses.concat(overrideLicenses);
        }
        if (overrideFiles) {
          if (!Array.isArray(licenses)) files = [];
          files = files.concat(overrideFiles);
        }
        if (overrideSources) {
          sources = sources
            .concat(overrideSources)
            .map((s) => (typeof s === 'object') ? s : { name, url: s});
          sources.forEach((s) => {
            // resolve special strings
            let templateString = s.url;
            if (templateString === 'tag') {
              templateString = '%{repositoryUrl}/archive/refs/tags/v%{version}.tar.gz';
            } else if (templateString.startsWith?.('branch:')) {
              templateString = `%{repositoryUrl}/archive/refs/heads/${templateString.substring(7)}.zip`;
            }
            s.url = resolveStringTemplate(templateString, { name, version, repositoryUrl });
          });
        }
      }
    }

    return {
      name,
      version,
      homepage,
      licenses,
      repository,
      repositoryUrl,
      files,
      sources,
      moduleSourceTemplate,
    };
  }
  
  addModuleToOutput(srcFilePath, assetOutput, packageInformation) {
    const {
      name,
      version,
      homepage,
      licenses,
      repository,
      repositoryUrl,
      files,
      sources,
      moduleSourceTemplate,
    } = packageInformation;

    let packageOutput = assetOutput.modules.find(
      (m) => m.name === name,
    );
    if (!packageOutput) {
      let parsedFiles = [];
      if (Array.isArray(files)) {
        for (let i = 0; i < files.length; i += 1) {
          const filePath = files[i];
          if (filePath.id) {
            parsedFiles.push(filePath);
          } else if (typeof filePath === 'string') {
            parsedFiles.push({
              name: path.parse(filePath).name.toUpperCase(),
              url: this.copyTextFile(filePath),
            });
          }
        }
      }
      packageOutput = {
        name,
        url: homepage || repositoryUrl,
        version,
        licenses,
        sources,
        sourceFiles: [],
      };
      if (parsedFiles.length) packageOutput.files = parsedFiles;
      if (repository) packageOutput.repository = repository;
      assetOutput.modules.push(packageOutput);
    } else {
      // make sure we got all soures
      sources.forEach((s) => {
        if (!packageOutput.sources.some((u) => u.url === s.url)) {
          packageOutput.sources.push(s);
        }
      });
    }

    const sourceName = srcFilePath.replace(
      LicenseListWebpackPlugin.modulePathCleanUpRegEx,
      '',
    );
    if (packageOutput.sourceFiles.some((m) => m.name === sourceName)) {
      return;
    }

    const module = { name: sourceName };

    if (moduleSourceTemplate) {
      module.url = resolveStringTemplate(
        moduleSourceTemplate, { name, filename: module.name, version, repositoryUrl },
      );
    } else if (this.includeSourceFiles && !sources.length) {
      module.url = this.copyFileToOutputPath(srcFilePath);
    }
    
    if (!sources.length && module.url) {
      packageOutput.sources.push({
        name: module.name.split('/').pop(),
        url: module.url,
      });
    }

    packageOutput.sourceFiles.push(module);
  }
  
  apply(compiler) {
    this.logger = compiler.getInfrastructureLogger(PLUGIN_NAME);

    // populate output
    let buildOutput = this.output.find(o => o.name === this.buildName);
    if (!buildOutput) {
      buildOutput = {
        name: this.buildName,
        id: this.buildId,
        scripts: [],
      };
      this.output.push(buildOutput);
    }
    this.scriptsOutput = buildOutput.scripts;

    compiler.hooks.done.tapAsync(PLUGIN_NAME, (statsObj, callback)  => {
      // https://webpack.js.org/api/stats/
      const stats = statsObj.toJson();
      this.outputPath = path.join(stats.outputPath, this.outputDir);
      const publicPath = this.publicPathOverride || stats.publicPath;
      this.sourcesOutputPath = path.join(stats.outputPath, this.sourcesOutputDir);
      /*
       * Ensure that output links are relative and in posix format
       * Absolute would be:
       *   this.sourcesPublicPath = path.join(publicPath, this.sourcesOutputDir);
       */
      this.sourcesPublicPath = path.posix.relative(this.outputPath, this.sourcesOutputPath);

      if (!fs.existsSync(this.outputPath)) {
        fs.mkdirSync(this.outputPath, { recursive: true });
      }
  
      stats.assets.forEach(asset => {
        for (let i = 0; i < asset.chunks.length; ++i) {
          this.chunkIdToName[asset.chunks[i]] = asset.chunkNames[i];
        }
      });
      
      // map each generated webpack chunk to its js asset
      Object.keys(stats.assetsByChunkName).forEach((chunkName, i) => {
        if (Array.isArray(stats.assetsByChunkName[chunkName])) {
          for (const asset of stats.assetsByChunkName[chunkName]) {
            if (asset.endsWith('.js')) {
              this.chunkNameToJsAsset[chunkName] = asset;
              this.chunkNameToJsAsset[i] = asset;
              break;
            }
          }
        } else if (stats.assetsByChunkName[chunkName].endsWith('.js')) {
          this.chunkNameToJsAsset[chunkName] = stats.assetsByChunkName[chunkName];
          this.chunkNameToJsAsset[i] = stats.assetsByChunkName[chunkName];
        }
      });

      // iterate on all bundled webpack modules
      stats.modules.forEach((mod) => {
        const chunks = mod.chunks;
        const names = (mod.modules?.length)
          ? mod.modules.map((m) => m.name) : [mod.name];

        names.forEach((srcFilePath) => {
          // do not process non js related modules
          if (!LicenseListWebpackPlugin.srcExtsRegexp.test(srcFilePath)) {
            return;
          }
          // do not process modules unrelated to a source file
          if (!srcFilePath.startsWith('./')) {
            return;
          }
          // do not process modules in the exclusion list
          for (const toExclude of this.exclude) {
            if (srcFilePath.startsWith(toExclude)) {
              return;
            }
          }

          // remove webpack loader call if any
          const loaderEndPos = srcFilePath.indexOf('!');
          if (loaderEndPos !== -1) {
            srcFilePath = srcFilePath.slice(loaderEndPos + 1);
          }

          const packageInformation = this.getPackageInformation(srcFilePath);
    
          // iterate on all chunks containing the module
          mod.chunks.forEach(chunk => {
            const chunkName = this.chunkIdToName[chunk];
            const jsAsset = this.chunkNameToJsAsset[chunkName]
            const chunkJsAsset = publicPath + jsAsset;
            let assetOutput = this.scriptsOutput.find(
              (a) => a.name === chunkName && (this.mergeByChunnkName || a.url === chunkJsAsset)
            );
            if (!assetOutput) {
              assetOutput = {
                name: chunkName,
                assets: [],
                modules: [],
              };
              if (!this.mergeByChunnkName) {
                assetOutput.url = chunkJsAsset;
              }
              this.scriptsOutput.push(assetOutput);
            }
            if (!assetOutput.assets.some((a) => a.url === chunkJsAsset)) {
              assetOutput.assets.push({
                name: jsAsset,
                url: chunkJsAsset,
              });
            }
            this.addModuleToOutput(srcFilePath, assetOutput, packageInformation);
          });
        });
      });

      const weblabelsJsonFile = path.join(this.outputPath, this.outputFilename);

      const previousOutput = readJSONFile(weblabelsJsonFile);
      if (previousOutput) {
        this.output = deepMergeNamedArrays(this.output, previousOutput);
      }
      this.summarizeOutput();

      // generate the output file
      if (this.processOutput) {
        this.output = this.processOutput(this.output);
      }

      if (this.outputHtmlFilename) {
        fs.writeFileSync(
          path.join(this.outputPath, this.outputHtmlFilename), LicenseListWebpackPlugin.generateHTML(this.output),
        );
      }

      if (typeof this.output !== 'string') {
        this.output = JSON.stringify(this.output);
      }
      fs.writeFileSync(weblabelsJsonFile, this.output);

      callback();
    });
  }
}

module.exports = LicenseListWebpackPlugin;
