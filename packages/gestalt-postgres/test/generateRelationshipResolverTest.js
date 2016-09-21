// @flow

import fs from 'fs';
import assert from 'assert';
import DB from '../src/DB';
import {parse} from 'graphql';
import {databaseInfoFromAST} from 'gestalt-graphql';
import {segmentPairsFromRelationships, segmentDescriptionsFromPairs}
  from '../src/generateDatabaseInterface';
import {generateRelationshipLoaders, generateRelationshipResolver} from
  '../src/generateRelationshipResolver';
import {keyMap, spyOn} from 'gestalt-utils';
import type {Relationship} from 'gestalt-utils';
declare function describe(a: string, b: () => any): void;
declare function it(a: string, b: () => any): void;
declare function before(b: () => any): void;

const DATABASE_URL = 'postgres://localhost/gestalt_test';

const db = new DB({
  url: DATABASE_URL,
  log: false,
});

const schemaPath = `${__dirname}/fixtures/schema.graphql`;
const schemaText = fs.readFileSync(schemaPath, 'utf8');
const schemaAST = parse(schemaText);
const {objectDefinitions, relationships} = databaseInfoFromAST(schemaAST);
const relationshipMap = keyMap(
  relationships,
  relationship => `${relationship.path[0].fromType}|${relationship.fieldName}`
);
const segmentDescriptionMap = keyMap(
  segmentDescriptionsFromPairs(
    segmentPairsFromRelationships(relationships)
  ),
  segment => segment.pair.signature
);
const loaders = generateRelationshipLoaders(
  db,
  segmentDescriptionMap,
  relationships
);
const context = {db, loaders};
const buildResolver = generateRelationshipResolver(segmentDescriptionMap);
const resolverMap = relationships.reduce(
  (memo, relationship) => {
    memo.set(relationship, buildResolver(relationship));
    return memo;
  },
  new Map,
);

const completeInfo = {
  fieldASTs: [{
    selectionSet: {
      selections: [
        {name: {value: 'totalCount'}},
        {name: {value: 'pageInfo'}},
      ],
    },
  }],
};

const emptyInfo = {
  fieldASTs: [{selectionSet: {selections: []}}],
};

function getRelationship(typeName: string, fieldName: string): Relationship {
  return relationshipMap[`${typeName}|${fieldName}`];
}

function resolveRelationship(
  relationship: Relationship,
  object: Object,
  args: Object = {},
  info: Object = completeInfo
): Promise<Object> {
  return resolverMap.get(relationship)(object, args, context, info);
}

describe('generateRelationshipResolver', () => {
  before(async () => {
    // reset database, load schema and seeds
    await db.exec([
      'DROP SCHEMA public CASCADE;',
      'CREATE SCHEMA public;',
      'GRANT ALL ON SCHEMA public TO postgres;',
      'GRANT ALL ON SCHEMA public TO public;',
      'COMMENT ON SCHEMA public IS \'standard public schema\';',
      fs.readFileSync(`${__dirname}/fixtures/schema.sql`),
      fs.readFileSync(`${__dirname}/fixtures/seeds.sql`),
    ].join('\n'));
  });

  describe('loading singular relationships', () => {
    it('loads correct results with a single query', async () => {
      const user = await resolveRelationship(
        getRelationship('Post', 'author'),
        {authoredByUserId: '00000000-0000-0000-0000-000000000001'},
      );
      assert.equal(user && user.id, '00000000-0000-0000-0000-000000000001');
    });

    it('batches multiple queries', async () => {
      const spy = spyOn(db, 'query');
      const relationship = getRelationship('Comment', 'subject');

      const results = await Promise.all([
        resolveRelationship(
          relationship,
          {inspiredByPostId: '00000000-0000-0000-0000-000000000004'}
        ),
        resolveRelationship(
          relationship,
          {inspiredByPostId: '00000000-0000-0000-0000-000000000005'}
        ),
        resolveRelationship(
          relationship,
          {inspiredByPostId: '00000000-0000-0000-0000-000000000006'}
        ),
      ]);

      assert.deepEqual(
        results.map(post => post.id),
        [
          '00000000-0000-0000-0000-000000000004',
          '00000000-0000-0000-0000-000000000005',
          '00000000-0000-0000-0000-000000000006',
        ],
      );
      assert.equal(spy.calls.length, 1);
      spy.stop();
    });
  });

  describe('loading plural relationships', () => {
    it('loads correct results', async () => {
      const posts = await resolveRelationship(
        getRelationship('User', 'posts'),
        {id: '00000000-0000-0000-0000-000000000001'},
      );

      assert.deepEqual(
        posts.edges.map(post => post.node.id),
        [
          '00000000-0000-0000-0000-000000000004',
          '00000000-0000-0000-0000-000000000007',
          '00000000-0000-0000-0000-000000000010',
        ]
      );
      assert.equal(posts.totalCount, 3);
    });

    it('batches multiple queries', async () => {
      const relationship = getRelationship('Post', 'comments');

      const results = await Promise.all([
        resolveRelationship(
          relationship,
          {id: '00000000-0000-0000-0000-000000000004'}
        ),
        resolveRelationship(
          relationship,
          {id: '00000000-0000-0000-0000-000000000005'}
        ),
        resolveRelationship(
          relationship,
          {id: '00000000-0000-0000-0000-000000000006'}
        ),
      ]);

      assert.deepEqual(
        results.map(comments => comments.edges.map(comment => comment.node.id)),
        [
          ['00000000-0000-0000-0000-000000000020'],
          ['00000000-0000-0000-0000-000000000021'],
          ['00000000-0000-0000-0000-000000000022'],
        ],
      );
      assert.deepEqual(
        results.map(comments => comments.totalCount),
        [1, 1, 1],
      );
    });

    it('handles forward pagination', async () => {
      const posts = await resolveRelationship(
        getRelationship('User', 'posts'),
        {id: '00000000-0000-0000-0000-000000000003'},
        {first: 3, after: '00000000-0000-0000-0000-000000000012'},
      );

      assert.deepEqual(
        posts.edges.map(post => post.node.id),
        [
          '00000000-0000-0000-0000-000000000013',
          '00000000-0000-0000-0000-000000000014',
          '00000000-0000-0000-0000-000000000015',
        ]
      );
      assert.equal(posts.totalCount, 10);
      assert.deepEqual(posts.pageInfo, {
        hasNextPage: true,
        hasPreviousPage: false,
      });
    });

    it('handles reverse pagination', async () => {
      const posts = await resolveRelationship(
        getRelationship('User', 'posts'),
        {id: '00000000-0000-0000-0000-000000000003'},
        {last: 3, before: '00000000-0000-0000-0000-000000000015'},
      );

      assert.deepEqual(
        posts.edges.map(post => post.node.id),
        [
          '00000000-0000-0000-0000-000000000012',
          '00000000-0000-0000-0000-000000000013',
          '00000000-0000-0000-0000-000000000014',
        ]
      );
      assert.equal(posts.totalCount, 10);
      assert.deepEqual(posts.pageInfo, {
        hasNextPage: false,
        hasPreviousPage: true,
      });
    });

    it('does not resolve count or pageInfo when not selected', async () => {
      const spy = spyOn(db, 'exec');
      const posts = await resolveRelationship(
        getRelationship('User', 'posts'),
        {id: '00000000-0000-0000-0000-000000000001'},
        {},
        emptyInfo,
      );
      assert.equal(spy.calls.length, 1);
      spy.stop();
    });
  });
});
