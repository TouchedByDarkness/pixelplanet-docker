const pkg = require('./package.json');

module.exports = function (api) {
  const plugins = [
    // react-optimize
    '@babel/transform-react-constant-elements',
    '@babel/transform-react-inline-elements',
  ];

  const presets = [
    [
      "@babel/preset-env",
      api.caller(caller => caller && caller.target === "node")
        ? {
          targets: {
            node: pkg.engines.node.replace(/^\D+/g, ''),
          },
          modules: false,
        }
        : {
          targets: {
            browsers: pkg.browserslist,
          },
        }
    ],
    '@babel/react',
  ];

  return {
    presets,
    plugins
  };
}
