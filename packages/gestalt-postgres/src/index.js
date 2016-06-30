// @flow

import generateDatabaseInterface from './generateDatabaseInterface';
import type {DatabaseInterfaceDefinitionFn} from 'gestalt-utils';

export {default as generateDatabaseInterface} from
  './generateDatabaseInterface';
export {default as generateDatabaseSchemaMigration} from
  './generateDatabaseSchemaMigration';
export {default as readExistingDatabaseSchema} from
  './readExistingDatabaseSchema';
export {default as DB} from './DB';

export default function gestaltPostgres(databaseAdapterConfig: {
  databaseURL: string
}): DatabaseInterfaceDefinitionFn {
  const {databaseURL} = databaseAdapterConfig;

  return (objectDefinitions, relationships, serverConfig) =>
    generateDatabaseInterface(
      databaseURL,
      objectDefinitions,
      relationships,
      serverConfig,
    );
}
