// @flow

import fs from 'fs';
import assert from 'assert';
import {parse} from 'graphql';
import {databaseInfoFromAST, relationshipFromPathString as r} from
  'gestalt-graphql';
import {sqlStringFromQuery} from '../src/sqlStringFromQuery';
import generateDatabaseInterface, {segmentDescriptionsFromPairs,
  segmentPairsFromRelationships} from '../src/generateDatabaseInterface';
import {keyMap} from 'gestalt-utils';
import {queryFromRelationship, describeRelationship} from
  '../src/generateRelationshipResolver';

import type {Relationship, RelationshipSegmentDescriptionMap,
  ConnectionArguments} from 'gestalt-utils';
declare function describe(a: string, b: () => any): void;
declare function it(a: string, b: () => any): void;

const expectedSQLQueries =
  fs.readFileSync(`${__dirname}/fixtures/queries.sql`, 'utf8');
const schema = fs.readFileSync(`${__dirname}/fixtures/schema.graphql`, 'utf8');
const schemaAST = parse(schema);
const {relationships} = databaseInfoFromAST(schemaAST);

describe('sqlQueryFromRelationship', () => {

  it('generates SQL queries for fixture schema', () => {
    const polymorphicTypes = {};
    const descriptions = keyMap(
      segmentDescriptionsFromPairs(
        segmentPairsFromRelationships(relationships),
        {},
      ),
      segment => segment.pair.signature,
    );
    const sqlQueries = relationships.map(
      relationship => sqlStringFromQuery(
        queryFromRelationship(
          polymorphicTypes,
          describeRelationship(descriptions, relationship),
        )
      )
    );
    assert.deepEqual(
      sqlQueries,
      expectedSQLQueries
        .replace(/\n$/, '')
        .split('\n\n')
        .map(s => s.replace(/\n/g, ' ')),
    );
  });
});
