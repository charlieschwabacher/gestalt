// @flow
// updates schema json when run from a gestalt directory

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import importAll from 'import-all';
import prompt from 'prompt';
import semver from 'semver';
import {blue} from 'colors/safe';
import {snake} from 'change-case';
import {graphql, parse} from 'graphql';
import {introspectionQuery} from 'graphql/utilities';
import {generateGraphQLSchemaWithoutResolution, databaseInfoFromAST} from
  'gestalt-graphql';
import {generateDatabaseInterface, generateDatabaseSchemaMigration,
  readExistingDatabaseSchema} from 'gestalt-postgres';
import {invariant} from 'gestalt-utils';
import {get} from './cli';
import 'babel-register';

export default async function migrate() {
  prompt.start();
  try {

    // we should be in a directory w/ schema.graphql and package.json
    invariant(
      fs.existsSync('schema.graphql') && fs.existsSync('package.json'),
      'gestalt migrate must be run from the root directory of a gestalt project'
    );

    const schemaText = fs.readFileSync('schema.graphql', 'utf8');
    const localPackage = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const localVersion = localPackage.dependencies['gestalt-server'];
    const cliVersion = require('../package.json').version;

    // version of gestalt-server in node modules should match the version of
    // gestalt-cli
    invariant(
      semver.satisfies(cliVersion, localVersion),
      `Gestalt cli version (${cliVersion}) does not match local ` +
      `gestalt-server (${localVersion})`
    );

    console.log('migrating..');

    await updateJSONSchema(localPackage, schemaText);
    await updateDatabaseSchema(localPackage, schemaText);

    console.log('migration complete');

  } catch (err) {

    console.log('migration failed with the error:', err);
    throw err;

  }
  prompt.stop();
}

async function updateJSONSchema(
  localPackage: Object,
  schemaText: string
): Promise {
  const mutations = importAll(path.join(process.cwd(), './mutations'));
  const ast = parse(schemaText);
  const schema = generateGraphQLSchemaWithoutResolution(ast, mutations);

  // Save JSON of full schema introspection
  const result = await graphql(schema, introspectionQuery);
  if (result.errors) {
    console.error(
      'ERROR introspecting schema: ',
      JSON.stringify(result.errors, null, 2),
    );
  } else {
    fs.writeFileSync(
      path.resolve('schema.json'),
      JSON.stringify(result, null, 2),
    );
  }
}

async function updateDatabaseSchema(
  localPackage: Object,
  schemaText: string,
): Promise {
  const {databaseURL} = await get({
    name: 'databaseURL',
    message: 'what is the url to your database?',
    default: `postgres://localhost/${snake(localPackage.name)}`,
  });

  const existingSchema = await readExistingDatabaseSchema(databaseURL);

  const ast = parse(schemaText);
  const {objectDefinitions, relationships} = databaseInfoFromAST(ast);
  const {db, schema} = generateDatabaseInterface(
    databaseURL,
    objectDefinitions,
    relationships
  );

  const {sql} = generateDatabaseSchemaMigration(schema, existingSchema);

  console.log(`Generated SQL migration:\n\n${blue(sql)}\n`);

  const {runMigration, writeFile} = await get({
    properties: {
      runMigration: {
        message: 'Run migration? [yes/no]',
        validator: /^(y(es)?|no?)$/i,
        warning: 'Must respond yes or no',
        default: 'no',
      },
      writeFile: {
        message: 'Write migration to file? [yes/no]',
        validator: /^(y(es)?|no?)$/i,
        warning: 'Must respond yes or no',
        default: 'no',
      },
    },
  });

  if (runMigration[0] === 'y') {
    db.exec(sql);
    console.log('Ran migration');
  }

  if (writeFile[0] === 'y') {
    const hash = crypto.createHash('md5').update(sql).digest('hex');
    fs.writeFileSync(`migration-${hash}.graphql`, sql, 'utf8');
    console.log(`Wrote migration to file (migration-${hash}.graphql)`);
  }
}
