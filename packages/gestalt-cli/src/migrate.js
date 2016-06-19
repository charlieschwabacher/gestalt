// @flow
// updates schema json when run from a gestalt directory
import fs from 'fs';
import path from 'path';
import importAll from 'import-all';
import prompt from 'prompt';
import {graphql, parse} from 'graphql';
import {introspectionQuery, invariant} from 'graphql/utilities';
import {generateGraphQLSchemaWithoutResolution} from 'gestalt-graphql';
import {get} from './cli';

const DATABASE_ADAPTERS = ['gestalt-postgres'];

export default async function migrate() {
  // we should be in a directory w/ schema.graphql and package.json
  invariant(
    fs.existsSync('schema.graphql') && fs.existsSync('package.json'),
    'gestalt migrate must be run from the root directory of a gestalt project',
  );

  // version of gestalt-server in node modules should match the version of
  // gestalt-cli
  const cliVersion = require(`${__dirname}/../package.json`).version;
  const localVersion =
    require('package.json').dependencies['gestalt-server'].version;

  invariant(
    cliVersion === localVersion,
    `Gestalt cli version (${cliVersion}) does not match local gestalt-server ` +
    `(${localVersion})`,
  );

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
