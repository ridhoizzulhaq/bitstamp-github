const webpack = require('webpack');

module.exports = function override(config) {
  config.resolve.fallback = {
    ...config.resolve.fallback,
    stream: require.resolve('stream-browserify'),
    assert: require.resolve('assert/'),
    http:   require.resolve('stream-http'),
    https:  require.resolve('https-browserify'),
    os:     require.resolve('os-browserify/browser'),
    url:    require.resolve('url/'),
    buffer: require.resolve('buffer/'),
    util:   require.resolve('util/')
  };
  config.plugins.push(
    new webpack.ProvidePlugin({
      process: 'process/browser',
      Buffer:  ['buffer', 'Buffer']
    })
  );
  return config;
};