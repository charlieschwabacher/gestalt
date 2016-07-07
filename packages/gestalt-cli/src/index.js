#! /usr/bin/env node
// @flow

import 'babel-polyfill';
import commander from 'commander';
import packageDescription from '../package.json';
import init from './init';
import migrate from './migrate';

commander
  .version(packageDescription.version)
  .action(commander.help);

commander
  .command('init [name]')
  .description(
    'create a directory, [name], and initialize a new Gestalt project in it'
  )
  .action(async name => {
    if (!name) {
      commander.help('init');
    }
    await init(name);
    process.exit(0);
  });

commander
  .command('migrate')
  .description(
    'update schema.json and create a database migration based on changes to ' +
    'schema.graphql in a Gestalt project directory.'
  )
  .option('-d, --mutations-directory <path>', 'the directory of your mutation files')
  .option('-g, --mutations-glob <pattern>', 'a glob pattern for selecting mutation files')
  .option('-u, --url <path>', 'the url to your local database')
  .action(async options => {
    await migrate(options);
    process.exit(0);
  });

commander.parse(process.argv);
