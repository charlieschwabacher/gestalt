import 'babel-polyfill';

import assert from 'assert';
import path from 'path';
import fs from 'fs';
import {graphql} from 'graphql';
import {parse} from 'graphql/language/parser';

const definitionPath = path.resolve(__dirname, 'BlogsSchema/schema.graphql');
const ast = parse(fs.readFileSync(definitionPath, 'utf8'));

console.log('AST');
console.log(ast);

describe('schema definition', () => {
  it('defines a database schema', () => {

  });

  it('defines a graphql schema', () => {

  });
});
