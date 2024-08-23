/*
 * mapping of package to source for LicenseListWebpackPlugin
 */
module.exports = {
  './src': {
    sources: './source.zip',
    moduleSourceTemplate: 'branch:master',
  },
  three: {
    sources: (v) => `https://github.com/mrdoob/three.js/archive/refs/tags/r${v.version.split('.')[1]}.tar.gz`,
  },
  'three-trackballcontrols': {
    sources: 'https://github.com/JonLim/%{name}/archive/refs/tags/%{version}.zip',
  },
  '@babel/runtime': {
    sources: 'tag',
  },
  classnames: {
    sources: 'tag',
  },
  events: {
    sources: 'tag',
  },
  'hoist-non-react-statics': {
    sources: 'branch:main',
  },
  'js-file-download': {
    sources: 'tag',
  },
  'memoize-one': {
    sources: 'tag',
  },
  'prop-types': {
    sources: 'tag',
  },
  react: {
    sources: 'tag',
  },
  'react-dom': {
    name: 'react',
    sources: 'tag',
  },
  'react-is': {
    name: 'react',
    sources: 'branch:main',
  },
  'use-sync-external-store': {
    name: 'react',
    sources: 'branch:main',
  },
  scheduler: {
    name: 'react',
    sources: 'branch:main',
  },
  'react-icons': {
    sources: 'tag',
  },
  'react-redux': {
    sources: 'tag',
  },
  'react-stay-scrolled': {
    sources: 'tag',
  },
  'react-toggle': {
    sources: 'branch:master',
  },
  redux: {
    sources: 'tag',
  },
  'redux-persist': {
    sources: 'tag',
  },
  'redux-thunk': {
    sources: 'tag',
  },
  reselect: {
    sources: 'tag',
  },
  'tiny-invariant': {
    sources: 'tag',
  },
  'react-chartjs-2': {
    sources: 'tag',
  },
  'css-loader': {
    sources: 'tag',
  },
  'passport-discord': {
    sources: 'branch:master',
  },
  'passport-facebook': {
    sources: 'tag',
  },
  'passport-google-oauth2': {
    sources: 'branch:master',
  },
  'passport-json': {
    sources: 'tag',
  },
  'passport-oauth2': {
    sources: 'tag',
  },
  'passport-strategy': {
    sources: 'branch:master',
  },
  'passport-vkontakte': {
    sources: 'https://github.com/stevebest/%{name}/archive/refs/tags/%{version}.tar.gz',
  },
};
