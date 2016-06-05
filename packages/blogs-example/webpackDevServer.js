import express from 'express';
import webpack from 'webpack';
import webpackMiddleware from 'webpack-dev-middleware';

const app = express();

app.use(webpackMiddleware(webpack({
  devtool: 'eval-source-map',
  entry: './client/index.js',
  output: {
    path: '/',
    filename: 'index.js',
  },
  module: {
    loaders: [{
      test: /\.js?$/,
      exclude: /node_modules/,
      loader: 'babel',
    }],
  },
})));

app.use(express.static(`${__dirname}/static`));
app.get('/*', (req, res) => res.sendFile(`${__dirname}/static/index.html`));

app.listen(3000);
