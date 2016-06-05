// @flow

import type {DatabaseSchema} from 'gestalt-utils';

export default function readExistingDatabaseScheme(): DatabaseSchema {
  return {
    tables: [],
    indices: [],
  };
}
