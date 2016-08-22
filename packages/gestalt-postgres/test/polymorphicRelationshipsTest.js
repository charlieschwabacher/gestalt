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
      const schemaInfo = databaseInfoFromAST(graphQLSchema);

      // generate sql queries for relationship resolution
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

      // load expected sql queries from file
      const expectedSQLQueries = fs
        .readFileSync(`${path}/queries.sql`, 'utf8')
        .split(';')
        .map(line => line.replace(/^\s*/, ''))
        .filter(line => line)
        .map(normalizeSQLQuery);

      // generate sql schema
      const sqlSchema = generateDatabaseSchemaMigration(
        generateDatabaseInterface('', schemaInfo).schema
      ).sql;

      // load expected sql schema from file
      const expectedSQLSchema = fs.readFileSync(`${path}/schema.sql`, 'utf8');


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
