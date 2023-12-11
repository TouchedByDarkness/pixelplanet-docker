/**
 * webpack config for client files
 */

const fs = require('fs');
const path = require('path');
const process = require('process');
const webpack = require('webpack');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

/*
 * make sure we build in root dir
 */
process.chdir(__dirname);

function buildWebpackClientConfig(
  development,
  analyze,
  locale,
  extract,
) {
  const ttag = {
    resolve: {
      translations: (locale !== 'default')
        ? path.resolve('i18n', `${locale}.po`)
        : locale,
    },
  };

  if (extract) {
    ttag.extract = {
      output: path.resolve('i18n', 'template.pot'),
    };
  }

  const babelPlugins = [
    ['ttag', ttag],
  ];

  // cache invalidates if .po file changed
  const buildDependencies = {
    config: [__filename],
  }
  if (locale !== 'default') {
    buildDependencies.i18n = [ttag.resolve.translations];
  }

  return {
    name: 'client',
    target: 'web',

    mode: (development) ? 'development' : 'production',
    devtool: (development) ? 'inline-source-map' : false,

    entry: {
      [`client.${locale}`]:
        [path.resolve('src', 'client.js')],
      [`globe.${locale}`]:
        [path.resolve('src', 'globe.js')],
      [`popup.${locale}`]:
        [path.resolve('src', 'popup.js')],
    },

    output: {
      path: path.resolve('dist', 'public', 'assets'),
      publicPath: '/assets/',
      filename: `[name].[chunkhash:8].js`,
      chunkFilename: `[name].${locale}.[chunkhash:8].js`,
    },

    resolve: {
      alias: {
        /*
         * have to mock it, because we don't ship ttag itself with the client,
         * we have a script for every language
        */
        ttag: 'ttag/dist/mock',
        /*
         * if we don't do that,we might load different versions of three
         */
        three: path.resolve('node_modules', 'three'),
      },
      extensions: ['.js', '.jsx'],
    },

    module: {
      rules: [
        {
          test: /\.svg$/,
          use: [
            {
              loader: 'babel-loader',
            },
            {
              loader: 'react-svg-loader',
              options: {
                svgo: {
                  plugins: [
                    {
                      removeViewBox: false,
                    },
                    {
                      removeDimensions: true,
                    },
                  ],
                },
                jsx: false,
              },
            },
          ],
        },
        {
          test: /\.(js|jsx)$/,
          loader: 'babel-loader',
          include: [
            path.resolve('src'),
            ...['image-q'].map((moduleName) => (
              path.resolve('node_modules', moduleName)
            )),
          ],
          options: {
            plugins: babelPlugins,
          },
        },
      ],
    },

    plugins: [
      // Define free variables
      // https://webpack.github.io/docs/list-of-plugins.html#defineplugin
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': development ? '"development"' : '"production"',
        'process.env.BROWSER': true,
      }),

      // Webpack Bundle Analyzer
      // https://github.com/th0r/webpack-bundle-analyzer
      ...analyze ? [new BundleAnalyzerPlugin({ analyzerPort: 8889 })] : [],
    ],

    optimization: {
      splitChunks: {
        chunks: 'all',
        name: false,
        cacheGroups: {
          default: false,
          defaultVendors: false,

          /*
           * this layout of chunks is also assumed in src/core/assets.js
           * client -> client.js + vendor.js
           * globe -> globe.js + three.js
           */
          vendor: {
            name: 'vendor',
            chunks: (chunk) => chunk.name.startsWith('client'),
            test: /[\\/]node_modules[\\/]/,
          },
          three: {
            name: 'three',
            chunks: 'all',
            test: /[\\/]node_modules[\\/]three[\\/]/,
          },
        },
      },
    },

    recordsPath: path.join(__dirname, 'records.json'),

    stats: {
      colors: true,
      reasons: false,
      hash: false,
      version: false,
      chunkModules: false,
    },

    cache: (extract) ? false
      : {
        type: 'filesystem',
        name: (development) ? `${locale}-dev` : locale,
        buildDependencies,
      },
  };
}

function getAllAvailableLocals() {
  const langDir = path.resolve('i18n');
  const langs = fs.readdirSync(langDir)
    .filter((e) => (e.endsWith('.po') && !e.startsWith('ssr')))
    .map((l) => l.slice(0, -3));
  langs.push('default');
  return langs;
}

/*
 * return array of webpack configuartions for all languages
 */
function buildWebpackClientConfigAllLangs() {
  const langs = getAllAvailableLocals();
  const webpackConfigClient = [];
  for (let l = 0; l < langs.length; l += 1) {
    const lang = langs[l];
    const cfg = buildWebpackClientConfig(false, false, lang, false);
    webpackConfigClient.push(cfg);
  }
  return webpackConfigClient;
}

/*
 * Per default get configuration of all packages
 * If any argument is given, it will only get one
 * ('default' aka english if locale is unset)
 *
 * @param development If development mode
 * @param extract if translatable strings get in i18n templates should
 *   get updated
 * @param locale language get single configuration of specific locale
 * @param analyze launch BundleAnalyzerPlugin after build
 * @return webpack configuration
 */
module.exports = ({
  development, analyze, extract, locale,
}) => {
  if (extract || analyze || locale || development) {
    return buildWebpackClientConfig(
      development, analyze, locale || 'default', extract,
    );
  }
  return buildWebpackClientConfigAllLangs(development);
};

module.exports.buildWebpackClientConfig = buildWebpackClientConfig;
module.exports.getAllAvailableLocals = getAllAvailableLocals;
