const path = require('path');
module.exports = {
  mode: 'development',
  entry: './src/index.js',
  output: {
    path: path.resolve('.'),
    filename: 'curve-builder.js',
  },
  module: {
    rules: [
      { test: /\.js$/, use: ['babel-loader'] },
      { test: /\.js\.(md|tex|html)$/, use: ['babel-loader', '@oinkiguana/outline-loader'] },
    ],
  },
  resolve: {
    extensions: ['.js', '.js.md', '.js.tex', '.js.html'],
  },
  devtool: 'cheap-module-eval-source-map',
};
