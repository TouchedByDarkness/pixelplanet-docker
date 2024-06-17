/*
 * webpack config to build server files
 */

const fs = require('fs');
const path = require('path');
const process = require('process');
const webpack = require('webpack');
const nodeExternals = require('webpack-node-externals');
const GeneratePackageJsonPlugin = require('generate-package-json-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const sourceMapping = require('./scripts/sourceMapping');
const LicenseListWebpackPlugin = require('./scripts/LicenseListWebpackPlugin');

const pkg = require('./package.json');

// make sure we build in root dir
process.chdir(__dirname);

const basePackageValues = {
  name: pkg.name,
  version: pkg.version,
  license: pkg.license,
  private: true,
  engines: pkg.engines,
  scripts: {
    start: 'pm2 start ecosystem.yml',
    restart: 'pm2 restart ecosystem.yml',
    stop: 'pm2 stop all',
    poststop: 'pm2 kill',
    'install-pm2': 'npm install -g pm2'
  },
  dependencies: {
    mysql2: '',
    'utf-8-validate': '',
    bufferutil: '',
  },
};

const copyPluginPatterns = [
  {
    from: path.resolve('public'),
    to: path.resolve('dist', 'public'),
  },
  path.resolve('LICENSE'),
  path.resolve('COPYING'),
  path.resolve('CODE_OF_CONDUCT.md'),
  path.resolve('AUTHORS'),
  {
    from: path.resolve('deployment', 'example-ecosystem.yml'),
    to: path.resolve('dist', 'ecosystem.yml'),
  },
  {
    from: path.resolve('deployment', 'example-ecosystem-backup.yml'),
    to: path.resolve('dist', 'ecosystem-backup.yml'),
  },
  {
    from: path.resolve('deployment', 'captchaFonts'),
    to: path.resolve('dist', 'captchaFonts'),
  },
  {
    from: path.resolve('src', 'data', 'redis', 'lua'),
    to: path.resolve('dist', 'workers', 'lua'),
  },
  /*
   * i have no idea why this doesn't get overwritten by the ./overrides
   * copy below
   */
  path.resolve(
    (fs.existsSync(path.join('overrides', 'canvases.json'))) ? 'overrides' : 'src',
    'canvases.json',
  ),
]
/*
 * overrides exist to deploy our own files,
 * that are not part of the repository, like a logo.svg
 */
if (fs.existsSync('overrides')) {
  copyPluginPatterns.push({
    from: path.resolve('overrides'),
    to: path.resolve('dist'),
  });
}

const ttag = {};
const babelPlugins = [
  ['ttag', ttag],
];

module.exports = ({
  development, extract,
}) => {
  /*
   * write template files for translations
   */
  if (extract) {
    ttag.extract = {
      output: path.resolve('i18n', 'template-ssr.pot'),
    };
    ttag.discover = ['t', 'jt'];
  }

  /*
   * worker threads need to be their own
   * entry points
   */
  const workersDir = path.resolve('src', 'workers');
  const workerEntries = {};
  fs.readdirSync(workersDir)
    .filter((e) => e.endsWith('.js'))
    .forEach((filename) => {
      const name = `workers/${filename.slice(0, -3)}`;
      const fullPath = path.resolve(workersDir, filename);
      workerEntries[name] = fullPath;
    });

  return {
    name: 'server',
    target: 'node',

    mode: (development) ? 'development' : 'production',

    entry: {
      server: [path.resolve('src', 'server.js')],
      backup: [path.resolve('src', 'backup.js')],
      ...workerEntries,
    },

    output: {
      clean: false,
    },

    resolve: {
      extensions: ['.js', '.jsx'],
    },

    module: {
      rules: [
        {
          test: /\.(js|jsx)$/,
          loader: 'babel-loader',
          include: [
            path.resolve('src'),
          ],
          options: {
            cacheDirectory: false,
            plugins: babelPlugins,
          },
        },
        {
          test: /\.css/,
          use: [
            {
              loader: 'css-loader',
              options: {
                importLoaders: 1,
                sourceMap: false,
                modules: false,
              },
            },
            'clean-css-loader',
          ],
        },
        {
          test: [/\.po$/],
          loader: path.resolve('scripts/TtagPoLoader.js'),
        },
      ],
    },

    externalsPresets: {
      // exclude built-in node modules (path, fs, etc.)
      node: true,
    },

    externals: [
      nodeExternals({
        // passport-reddit is an ESM module
        // bundle it, then we don't have to import it
        allowlist: [ /^passport-/ ],
      }),
    ],

    plugins: [
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': development ? '"development"' : '"production"',
        'process.env.BROWSER': false,
      }),
      // create package.json for deployment
      new GeneratePackageJsonPlugin(basePackageValues, {
        sourcePackageFilenames: [ path.resolve('package.json') ],
        // provided by node itself
        excludeDependencies: ['node:buffer'],
      }),
      // Output license informations
      new LicenseListWebpackPlugin({
        name: 'Server Scripts',
        id: 'server-licenses',
        htmlFilename: 'index.html',
        outputDir: path.join('public', 'legal'),
        includeLicenseFiles: true,
        // includeSourceFiles: true,
        override: sourceMapping,
      }),
      new CopyPlugin({
        patterns: copyPluginPatterns,
      }),
    ],

    stats: {
      colors: true,
      reasons: false,
      hash: false,
      version: false,
      chunkModules: false,
    },

    node: {
      global: false,
      __dirname: false,
      __filename: false,
    },
  };
};
