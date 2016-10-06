// @flow
import fs from 'fs';
import glob from 'glob';
import noCase from 'no-case';
import assert from 'assert';
import {parse} from 'graphql';
import {keyMap} from 'gestalt-utils';
import {databaseInfoFromAST} from 'gestalt-graphql';
import collapseRelationshipSegments from '../src/collapseRelationshipSegments';
import generateDatabaseInterface, {segmentPairsFromRelationships,
  segmentDescriptionsFromPairs, mapSegmentDescriptionsBySignature} from
  '../src/generateDatabaseInterface';
import {sqlStringFromQuery, queryFromRelationship} from
  '../src/generateRelationshipResolver';
import generateDatabaseSchemaMigration from
  '../src/generateDatabaseSchemaMigration';
import {magenta, cyan} from 'colors';

declare function describe(a: string, b: () => any): void;
declare function it(a: string, b: () => any): void;

const testPaths = glob.sync(
  `${__dirname}/fixtures/polymorphic-relationships/*/*`
);

function testNameFromPath(path: string): string {
  const [length, relationshipType] = path.split('/').slice(-2);
  return noCase(`${length} ${relationshipType}`);
}

function normalizeSQLQuery(query: string): string {
  const parts = query.split('\n').map(line => line.replace(/^ */, ''));
  const result = parts.join(' ');
  return result + (result.slice(-1) === ';' ? '' : ';');
}

describe('polymorphic relationships', () => {
  testPaths.forEach(path => {
    describe(testNameFromPath(path), () => {
      // read expected graphql schema
      const graphQLSchema = parse(
        fs.readFileSync(`${path}/schema.graphql`, 'utf8')
      );

      // load expected sql queries from file
      const expectedSQLQueries = fs
        .readFileSync(`${path}/queries.sql`, 'utf8')
        .split(';')
        .map(line => line.replace(/^\s*/, ''))
        .filter(line => line)
        .map(normalizeSQLQuery);

      // load expected sql schema from file
      const expectedSQLSchema = fs.readFileSync(`${path}/schema.sql`, 'utf8');

      it('generates a database schema', () => {
        // generate sql schema
        const schemaInfo = databaseInfoFromAST(graphQLSchema);
        const sqlSchema = generateDatabaseSchemaMigration(
          generateDatabaseInterface('', schemaInfo).schema
        ).sql;

        assert.equal(
          sqlSchema,
          expectedSQLSchema,
        );
      });

      it('generates sql queries', () => {
        // generate sql queries for relationship resolution
        const {relationships, polymorphicTypes} =
          databaseInfoFromAST(graphQLSchema);
        const segmentPairs = segmentPairsFromRelationships(relationships);
        const {mapping: pairMapping, pairs: collapsedPairs} =
          collapseRelationshipSegments(segmentPairs, polymorphicTypes);
        const segmentDescriptions =
          segmentDescriptionsFromPairs(collapsedPairs, polymorphicTypes);
        const segmentDescriptionsBySignature =
          mapSegmentDescriptionsBySignature(pairMapping, segmentDescriptions);

        const sqlQueries = relationships.map(
          relationship => sqlStringFromQuery(
            queryFromRelationship(
              segmentDescriptionsBySignature,
              relationship
            )
          )
        );

        assert.deepEqual(
          sqlQueries,
          expectedSQLQueries,
        );
      });
    });
  });
});
