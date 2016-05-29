import express from 'express';
import gestalt from '../../src/gestalt';

const app = express();
app.use(express.static(`${__dirname}/static`));
app.use(gestalt({
  schemaPath: `${__dirname}/schema.graphql`,
  objects: [],
  mutations: [],
  secret: 'keyboard cat',
}));

app.listen(3000);
