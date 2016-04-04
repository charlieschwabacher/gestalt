import fs from 'fs';
import path from 'path';
import {nodes, edges} from './seeds';
import neo4jReset from '../../src/neo4j/reset';

const types = fs
  .readdirSync(path.resolve(__dirname, './types'))
  .filter((fileName) => fileName.match(/.*Type\.js$/))
  .map((fileName) => fileName.replace(/Type\.js$/, ''))

export default function resetDb() {
  return neo4jReset({nodes, edges, types});
}
