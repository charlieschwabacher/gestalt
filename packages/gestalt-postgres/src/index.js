// @flow

import generateDatabaseInterface from './generateDatabaseInterface';
import type {DatabaseInterfaceDefinitionFn} from 'gestalt-utils';

export default function gestaltPostgres(
  databaseURL: string
): DatabaseInterfaceDefinitionFn {
  return (objectDefinitions, relationships, config) =>
    generateDatabaseInterface(
      databaseURL,
      objectDefinitions,
      relationships,
      config
    );
}
