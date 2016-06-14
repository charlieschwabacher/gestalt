import express from 'express';
import gestaltServer from 'gestalt-server';
import gestaltPostgres from 'gestalt-postgres';
import importAll from 'import-all';

const app = express();

app.use(gestaltServer({
  database: gestaltPostgres('{{databaseUrl}}'),
  schemaPath: `${__dirname}/schema.graphql`,
  objects: importAll(`${__dirname}/objects`),
  mutations: importAll(`${__dirname}/mutations`),
  development: true,
  secret: '༼ つ ◕_◕ ༽つ',
}));

app.listen(3000);
