// @flow

import generateDatabaseInterface from './generateDatabaseInterface';
import type {DatabaseInterfaceDefinitionFn} from 'gestalt-utils';

export default function gestaltPostgres(config: {
  databaseURL: string
}): DatabaseInterfaceDefinitionFn {
  return (objectDefinitions, relationships, {databaseURL}) =>
    generateDatabaseInterface(
      databaseURL,
      objectDefinitions,
      relationships,
      config
    );
}
