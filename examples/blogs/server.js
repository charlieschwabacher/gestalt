import express from 'express';
import cors from 'cors';
import requireAll from 'require-all';
import gestalt from '../../src/gestalt';

const app = express();

app.use(cors({origin: 'http://localhost:3000', credentials: true}));

app.use(gestalt({
  objects: Object.values(requireAll({
    dirname: `${__dirname}/server/objects`,
    resolve: o => o.default
  })),
  mutations: Object.values(requireAll({
    dirname: `${__dirname}/server/mutations`,
    resolve: o => o.default
  })),
  schemaPath: `${__dirname}/schema.graphql`,
  secret: 'keyboard cat',
}));

app.listen(3001);
