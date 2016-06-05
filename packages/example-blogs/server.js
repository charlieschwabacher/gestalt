import express from 'express';
import cors from 'cors';
import importDefaults from 'import-defaults';
import gestaltServer from 'gestalt-server';
import gestaltPostgres from 'gestalt-postgres';

const app = express();

app.use(cors({origin: 'http://localhost:3000', credentials: true}));

app.use(gestaltServer({
  schemaPath: `${__dirname}/schema.graphql`,
  databaseInterface: gestaltPostgres('postgres://localhost/gestalt'),
  objects: importDefaults(`${__dirname}/server/objects`),
  mutations: importDefaults(`${__dirname}/server/mutations`),
  secret: '༼ つ ◕_◕ ༽つ',
  development: true,
}));

app.listen(3001);
