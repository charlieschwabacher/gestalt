import express from 'express';
import cors from 'cors';
import importAll from 'import-all';
import gestaltServer from 'gestalt-server';
import gestaltPostgres from 'gestalt-postgres';

const app = express();

app.use(cors({origin: 'http://localhost:3000', credentials: true}));

app.use(gestaltServer({
  schemaPath: `${__dirname}/schema.graphql`,
  objects: importAll(`${__dirname}/objects`),
  mutations: importAll(`${__dirname}/mutations`),
  database: gestaltPostgres({
    databaseURL: 'postgres://localhost/gestalt'
  }),
  secret: '༼ つ ◕_◕ ༽つ',
  development: true,
}));

app.listen(3001);
