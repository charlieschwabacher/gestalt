module.exports = {
  entry: './client/index.js',
  output: {
    path: './static/',
    filename: 'index.js',
  },
  module: {
    loaders: [{
      test: /\.js?$/,
      exclude: /node_modules/,
      loader: 'babel',
    }],
  },
};
