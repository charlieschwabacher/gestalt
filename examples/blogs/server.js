import express from 'express';
import requireAll from 'require-all';
import gestalt from '../../src/gestalt';
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

app.use(gestalt({
  objects: Object.values(requireAll(`${__dirname}/server/objects`)).map(o => o.default),
  mutations: Object.values(requireAll(`${__dirname}/server/mutations`)).map(m => m.default),
  schemaPath: `${__dirname}/schema.graphql`,
  secret: 'keyboard cat',
}));

app.listen(3000);
