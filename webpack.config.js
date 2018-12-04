const path = require('path');
module.exports = {
  mode: 'development',
  entry: './src/index.js',
  output: {
    path: path.resolve('.'),
    filename: 'curve-builder.js',
  },
  module: {
    rules: [{ test: /\.js$/, use: ['babel-loader'] }],
  },
  devtool: 'cheap-module-eval-source-map',
};
