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
import {sqlStringFromQuery} from '../src/sqlStringFromQuery';
import {queryFromRelationship, describeRelationship} from
  '../src/generateRelationshipResolver';
import generateDatabaseSchemaMigration from
  '../src/generateDatabaseSchemaMigration';
import {magenta, cyan} from 'colors';

declare function describe(a: string, b: () => any): void;
declare function it(a: string, b: () => any): void;

const testPaths = glob.sync(
  `${__dirname}/fixtures/unit-schemas/*/*/*`,
);

function testNameFromPath(path: string): string {
  const [type, length, relationshipType] = path.split('/').slice(-3);
  return noCase(`${type} ${length} ${relationshipType}`);
}

function normalizeSQLQuery(query: string): string {
  const parts = query.split('\n').map(line => line.replace(/^ */, ''));
  const result = parts.join(' ');
  return result + (result.slice(-1) === ';' ? '' : ';');
}

function logQuery(query, color) {
  console.log(color(
    query
      .replace(/(FROM|LEFT JOIN|JOIN|WHERE)/g, match => `\n  ${match}`)
      .replace(/(ON|AND|OR)/g, match => `\n    ${match}`)
  ));
}

testPaths.forEach(path => {
  describe(testNameFromPath(path), () => {
    // read expected graphql schema, if its not yet filled in skip this test
    const graphQLText = fs.readFileSync(`${path}/schema.graphql`, 'utf8');
    if (graphQLText.replace(/\s/g, '') === '') {
      return;
    }

    // parse graphql schema
    const graphQLSchema = parse(graphQLText);

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

    it('generates sql queries', async () => {
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
        relationship => {
          const polyType = polymorphicTypes[relationship.path[0].toType];
          return sqlStringFromQuery(
            queryFromRelationship(
              polymorphicTypes,
              describeRelationship(
                segmentDescriptionsBySignature,
                relationship,
              ),
              polyType && polyType[0],
            )
          );
        }
      );

      sqlQueries.forEach((query, i) => {
        logQuery(query, cyan);
        logQuery(expectedSQLQueries[i], magenta);
      });

      assert.deepEqual(
        sqlQueries,
        expectedSQLQueries,
      );
    });
  });
});
