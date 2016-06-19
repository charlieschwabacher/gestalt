// @flow

import generateDatabaseInterface from './generateDatabaseInterface';
import type {DatabaseInterfaceDefinitionFn} from 'gestalt-utils';

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
