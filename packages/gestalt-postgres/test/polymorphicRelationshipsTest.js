// @flow
import fs from 'fs';
import glob from 'glob';
import noCase from 'no-case';
import assert from 'assert';
import {parse} from 'graphql';
import {keyMap} from 'gestalt-utils';
import {databaseInfoFromAST} from 'gestalt-graphql';
import generateDatabaseInterface, {segmentDescriptionsFromRelationships} from
  '../src/generateDatabaseInterface';
import {sqlStringFromQuery, queryFromRelationship} from
  '../src/generateRelationshipResolver';
import generateDatabaseSchemaMigration from
  '../src/generateDatabaseSchemaMigration';

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
  return query.split('\n').map(line => line.replace(/^ */, '')).join(' ');
}

describe('polymorphic relationships', () => {
  testPaths.forEach(path => {
    describe(testNameFromPath(path), () => {
      const graphQLSchema = parse(
        fs.readFileSync(`${path}/schema.graphql`, 'utf8')
      );
      const schemaInfo = databaseInfoFromAST(graphQLSchema);
      const {relationships} = schemaInfo;
      const segmentDescriptionsBySignature = keyMap(
        segmentDescriptionsFromRelationships(relationships),
        segment => segment.signature,
      );
      const sqlQueries = relationships.map(
        relationship => sqlStringFromQuery(
          queryFromRelationship(
            segmentDescriptionsBySignature,
            relationship
          )
        )
      );
      const sqlSchema = generateDatabaseSchemaMigration(
        generateDatabaseInterface('', schemaInfo).schema
      ).sql;

      const expectedSQLSchema = fs.readFileSync(`${path}/schema.sql`, 'utf8');
      const expectedSQLQueries = fs
        .readFileSync(`${path}/queries.sql`, 'utf8')
        .split(';')
        .map(normalizeSQLQuery);


      it('generates a database schema', () => {
        assert.equal(
          sqlSchema,
          expectedSQLSchema,
        );
      });

      it('generates sql queries', () => {
        assert.deepEqual(
          sqlQueries,
          expectedSQLQueries,
        );
      });
    });
  });
});
