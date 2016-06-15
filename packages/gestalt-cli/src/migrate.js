// @flow
// updates schema json when run from a gestalt directory
import fs from 'fs';
import path from 'path';
import importAll from 'import-all';
import prompt from 'prompt';
import {graphql, parse} from 'graphql';
import {introspectionQuery} from 'graphql/utilities';
import {generateGraphQLSchemaWithoutResolution} from 'gestalt-graphql';
import {get} from './cli';

export default async function migrate() {
  prompt.start();
  try {
    console.log('migrating..');
    await updateJSONSchema();
    await updateDatabaseSchema();
    console.log('Gestalt migration complete');
  } catch (err) {
    console.log('gestalt migration failed with the error:', err);
    throw err;
  }
  prompt.stop();
}

async function updateJSONSchema(): Promise {
  const schemaText = fs.readFileSync('schema.graphql');
  const ast = parse(schemaText);
  const mutations = importAll('mutations');
  const schema = generateGraphQLSchemaWithoutResolution(ast, mutations);

  // Save JSON of full schema introspection
  const result = await graphql(schema, introspectionQuery);
  if (result.errors) {
    console.error(
      'ERROR introspecting schema: ',
      JSON.stringify(result.errors, null, 2)
    );
  } else {
    fs.writeFileSync(
      path.resolve('schema.json'),
      JSON.stringify(result, null, 2)
    );
  }
}

async function updateDatabaseSchema() {
  console.log('update database schema running...');
}
