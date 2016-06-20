import express from 'express';
import importAll from 'import-all';
import gestaltServer from 'gestalt-server';
import gestaltPostgres from 'gestalt-postgres';

const app = express();

app.use(gestaltServer({
  schemaPath: `${__dirname}/schema.graphql`,
  objects: importAll(`${__dirname}/objects`),
  mutations: importAll(`${__dirname}/mutations`),
  database: gestaltPostgres({
    databaseURL: 'postgres://localhost/blogs_example'
  }),
  secret: '༼ つ ◕_◕ ༽つ',
  development: true,
}));

app.use(express.static(`${__dirname}/static`));
app.get('/*', (req, res) => res.sendFile(`${__dirname}/static/index.html`));

app.listen(3000);
