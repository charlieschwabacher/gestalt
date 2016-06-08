import express from 'express';
import cors from 'cors';
import importAll from 'import-all';
import gestaltServer from 'gestalt-server';
import gestaltPostgres from 'gestalt-postgres';

const app = express();

app.use(cors({origin: 'http://localhost:3000', credentials: true}));

app.use(gestaltServer({
  schemaPath: `${__dirname}/schema.graphql`,
  database: gestaltPostgres('postgres://localhost/gestalt'),
  objects: importAll(`${__dirname}/objects`),
  mutations: importAll(`${__dirname}/mutations`),
  secret: '༼ つ ◕_◕ ༽つ',
  development: true,
}));

app.listen(3001);
