// @flow

import type {DatabaseSchema} from '../types';

export default function readExistingDatabaseScheme(): DatabaseSchema {
  return {
    tables: [],
    indices: [],
  };
}
