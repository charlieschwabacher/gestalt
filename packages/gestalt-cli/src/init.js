// @flow
// scaffolds a new gestalt project

import fs from 'fs';
import path from 'path';
import prompt from 'prompt';
import rimraf from 'rimraf';
import ejs from 'ejs';
import {get, exec, copy} from './cli';
import {invariant} from 'gestalt-utils';
import {snake, camel} from 'change-case';

export default async function(name: string): Promise {
  try {
    invariant(
      name.match(/^[$A-Z_][0-9A-Z_$]*$/i),
      `"${name}" is not a valid name for a project. Please use a valid ` +
      'identifier name (alphanumeric).'
    );

    const root = path.resolve(name);
    const projectName = path.basename(root);

    prompt.start();

    // ask for confirmation if overwriting an existing directory
    if (fs.existsSync(root)) {
      const {yesno} = await get({
        name: 'yesno',
        message: `Directory ${name} already exists. Continue? [yes/no]`,
        validator: /^(y(es)?|no?)$/i,
        warning: 'Must respond yes or no',
        default: 'no',
      });

      if (yesno[0] === 'y') {
        console.log(`Overwriting files in ${name}`);
        rimraf.sync(root);
      } else {
        console.log('Project initialization canceled');
        process.exit();
      }
    }

    const {databaseURL} = await get({
      name: 'databaseURL',
      message: 'what is the url to your database?',
      default: `postgres://localhost/${snake(name)}`,
    });

    console.log(`Creating a new Gestalt project in ${root}...`);

    if (!fs.existsSync(root)) {
      fs.mkdirSync(root);
    }

    fs.writeFileSync(
      path.join(root, 'package.json'),
      JSON.stringify({
        name: projectName,
        version: '0.0.1',
        private: true,
        scripts: {
          start: 'babel-node server.js'
        },
      }, null, 2)
    );

    process.chdir(root);

    console.log('Installing gestalt packages from npm...');

    console.log(
      await exec(
        'npm install --save --save-exact express import-all gestalt-server ' +
        'gestalt-postgres'
      ),
      await exec(
        'npm install --save-dev babel-cli babel-preset-es2015 ' +
        'babel-preset-stage-0'
      ),
    );

    console.log('Copying files...');

    // create directories
    fs.mkdirSync(path.join(root, 'objects'));
    fs.mkdirSync(path.join(root, 'mutations'));

    // copy static files
    await Promise.all(
      [
        '.babelrc',
        'schema.graphql',
        'objects/Session.js',
        'mutations/.gitkeep',
      ].map(
        fileName => copy(
          path.join(__dirname, '../template', fileName),
          path.join(root, fileName),
        )
      )
    );

    // copy server.js with interpolated values
    fs.writeFileSync(
      path.join(root, 'server.js'),
      ejs.render(
        fs.readFileSync(
          path.join(__dirname, '../template/server.js.ejs'),
          'utf8',
        ),
        {databaseURL}
      )
    );

  } catch (err) {
    console.log('gestalt init failed with the error:', err);
    throw err;
  }

  prompt.stop();
}
