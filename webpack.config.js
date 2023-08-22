const path = require('path');

module.exports = {
  entry: './src/game.js',
  mode: 'development',
  output: {
    path: path.resolve(__dirname, 'app', 'js'),
    filename: 'game.js'
  },
  devtool: 'source-map',
  resolve: {
    fallback: {
      "crypto": false
    }
  },
  devServer: {
    devMiddleware: {
      index: true,
      mimeTypes: { phtml: 'text/html' },
      publicPath: '/js',
      writeToDisk: true,
    },
    static: {
      directory: path.resolve(__dirname, 'static'),
      publicPath: '/',
    },
    client: {
      overlay: true,
    },
  }
};