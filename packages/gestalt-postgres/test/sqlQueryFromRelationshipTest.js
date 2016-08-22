// @flow

import fs from 'fs';
import assert from 'assert';
import {parse} from 'graphql';
import {databaseInfoFromAST, relationshipFromPathString as r} from
  'gestalt-graphql';
import generateDatabaseInterface, {segmentDescriptionsFromRelationships} from
  '../src/generateDatabaseInterface';
import {keyMap} from 'gestalt-utils';
import {objectKeyColumnFromRelationship, sqlStringFromQuery,
  queryFromRelationship} from '../src/generateRelationshipResolver';

import type {Relationship, RelationshipSegmentDescriptionMap,
  ConnectionArguments} from 'gestalt-utils';
declare function describe(a: string, b: () => any): void;
declare function it(a: string, b: () => any): void;


function testRelationship(
  outRelationship: ?Relationship,
  inRelationship: ?Relationship,
  outSQL: ?string,
  inSQL: ?string,
): void {
  const descriptions = keyMap(
    segmentDescriptionsFromRelationships(
      [inRelationship, outRelationship].filter(relationship => relationship)
    ),
    segment => segment.signature,
  );
  outRelationship && assert.equal(
    outSQL,
    sqlStringFromQuery(
      queryFromRelationship(descriptions, outRelationship)
    )
  );
  inRelationship && assert.equal(
    inSQL,
    sqlStringFromQuery(
      queryFromRelationship(descriptions, inRelationship)
    )
  );
}


const expectedSQLQueries =
  fs.readFileSync(`${__dirname}/fixtures/queries.sql`, 'utf8');
const schema = fs.readFileSync(`${__dirname}/fixtures/schema.graphql`, 'utf8');
const schemaAST = parse(schema);
const {relationships} = databaseInfoFromAST(schemaAST);

describe('sqlQueryFromRelationship', () => {

  it('generates SQL queries for fixture schema', () => {
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
    assert.deepEqual(
      sqlQueries,
      expectedSQLQueries
        .replace(/\n$/, '')
        .split('\n\n')
        .map(s => s.replace(/\n/g, ' ')),
    );
  });

  describe('plural one segment foreign key relationship', () => {
    it('generates correct SQL', () => {
      testRelationship(
        r('posts', 'User', 'Post', false, '=AUTHORED=>'),
        r('author', 'Post', 'User', false, '<-AUTHORED-'),
        'SELECT posts.* FROM posts WHERE posts.authored_by_user_id = ANY ($1);',
        'SELECT users.* FROM users WHERE users.id = ANY ($1);',
      );
    });
  });

  describe('plural one segment join table relationship', () => {
    it('generates correct SQL', () => {
      testRelationship(
        r('posts', 'User', 'Post', false, '=AUTHORED=>'),
        r('author', 'Post', 'User', false, '<=AUTHORED='),

        'SELECT posts.* FROM posts JOIN user_authored_posts ON ' +
        'user_authored_posts.authored_post_id = posts.id WHERE ' +
        'user_authored_posts.user_id = ANY ($1);',

        'SELECT users.* FROM users JOIN user_authored_posts ON ' +
        'user_authored_posts.user_id = users.id WHERE ' +
        'user_authored_posts.authored_post_id = ANY ($1);',
      );
    });
  });

  describe('plural two segment relationship', () => {
    it('generates correct SQL', () => {
      testRelationship(
        r('feed', 'User', 'Post', false, '=FOLLOWED=>User=AUTHORED=>'),
        r('audience', 'Post', 'User', false, '<=AUTHORED=User<=FOLLOWED='),

        'SELECT posts.* FROM posts JOIN user_authored_posts ON ' +
        'user_authored_posts.authored_post_id = posts.id JOIN ' +
        'user_followed_users ON user_followed_users.followed_user_id = ' +
        'user_authored_posts.user_id WHERE user_followed_users.user_id = ANY ' +
        '($1);',

        'SELECT users.* FROM users JOIN user_followed_users ON ' +
        'user_followed_users.user_id = users.id JOIN user_authored_posts ON ' +
        'user_authored_posts.user_id = user_followed_users.followed_user_id ' +
        'WHERE user_authored_posts.authored_post_id = ANY ($1);',
      );
    });
  });

  describe('singular one segment relationship', () => {
    it('generates correct SQL', () => {
      testRelationship(
        r('profile', 'User', 'Profile', true, '-CREATED->'),
        r('user', 'Profile', 'User', true, '<-CREATED-'),

        'SELECT profiles.* FROM profiles WHERE profiles.created_by_user_id = ' +
        'ANY ($1);',

        'SELECT users.* FROM users WHERE users.id = ANY ($1);',
      );
    });
  });

  describe('singular bidirectional two segment relationship', () => {
    it('generates correct SQL', () => {
      testRelationship(
        r('image', 'User', 'Image', false, '-CREATED->Profile<-DEPICTED-'),
        r('user', 'Image', 'User', false, '-DEPICTED->Profile<-CREATED-'),

        'SELECT images.* FROM images JOIN profiles ON ' +
        'profiles.depicted_by_image_id = images.id WHERE ' +
        'profiles.created_by_user_id = ANY ($1);',

        'SELECT users.* FROM users JOIN profiles ON ' +
        'profiles.created_by_user_id = users.id WHERE ' +
        'profiles.depicted_by_image_id = ANY ($1);',
      );
    });
  });

  describe('singular two segment relationship', () => {
    it('generates correct SQL', () => {
      testRelationship(
        r('post', 'User', 'Theme', false, '-CREATED->Profile-SELECTED->'),
        r('user', 'Theme', 'User', false, '<-SELECTED-Profile<-CREATED-'),

        'SELECT themes.* FROM themes JOIN profiles ON profiles.id = ' +
        'themes.selected_by_profile_id WHERE profiles.created_by_user_id = ' +
        'ANY ($1);',

        'SELECT users.* FROM users JOIN profiles ON ' +
        'profiles.created_by_user_id = users.id WHERE profiles.id = ANY ($1);',
      );
    });
  });

  describe('mixed singular and plural two segment relationship', () => {
    it('generates correct SQL', () => {
      testRelationship(
        r('images', 'User', 'Image', false, '-CREATED->PROFILE=UPLOADED=>'),
        r('owner', 'Image', 'User', false, '<-UPLOADED-PROFILE<-CREATED-'),

        'SELECT images.* FROM images JOIN profiles ON profiles.id = ' +
        'images.uploaded_by_profile_id WHERE profiles.created_by_user_id = ' +
        'ANY ($1);',

        'SELECT users.* FROM users JOIN profiles ON ' +
        'profiles.created_by_user_id = users.id WHERE profiles.id = ANY ($1);',
      );
    });
  });

  describe('one sided outward plural one segment relationship', () => {
    it('generates correct SQL', () => {
      testRelationship(
        r('posts', 'User', 'Post', false, '=AUTHORED=>'),

        null,

        'SELECT posts.* FROM posts JOIN user_authored_posts ON ' +
        'user_authored_posts.authored_post_id = posts.id WHERE ' +
        'user_authored_posts.user_id = ANY ($1);',

        null
      );
    });
  });

  describe('one sided inward singular one segment relationship', () => {
    it('generates correct SQL', () => {
      testRelationship(
        null,

        r('author', 'Post', 'User', false, '<-AUTHORED-'),

        null,

        'SELECT users.* FROM users WHERE users.authored_post_id = ANY ($1);'
      );
    });
  });

  describe('one sided outward singular one segment relationship', () => {
    it('generates correct SQL', () => {
      testRelationship(
        null,

        r('pinnedPost', 'User', 'Post', false, '-PINNED->'),

        null,

        'SELECT posts.* FROM posts WHERE posts.id = ANY ($1);'
      );
    });
  });


  describe('one sided two segment relationship', () => {
    it('generates correct SQL', () => {
      testRelationship(
        r('feed', 'User', 'Post', false, '=FOLLOWED=>Page=AUTHORED=>'),

        null,

        'SELECT posts.* FROM posts JOIN page_authored_posts ON ' +
        'page_authored_posts.authored_post_id = posts.id JOIN ' +
        'user_followed_pages ON user_followed_pages.followed_page_id = ' +
        'page_authored_posts.page_id WHERE user_followed_pages.user_id = ANY ' +
        '($1);',

        null
      );
    });
  });

  describe('three segment relationship', () => {
    it('generates correct SQL', () => {
      testRelationship(
        r(
          'feed',
          'User',
          'Comment',
          false,
          '=FOLLOWED=>Page=MADE=>Post=INSPIRED=>'
        ),

        r(
          'audience',
          'Comment',
          'User',
          false,
          '<-INSPIRED-Post<-MADE-Page<=FOLLOWED='
        ),

        'SELECT comments.* FROM comments JOIN posts ON posts.id = ' +
        'comments.inspired_by_post_id JOIN user_followed_pages ON ' +
        'user_followed_pages.followed_page_id = posts.made_by_page_id WHERE ' +
        'user_followed_pages.user_id = ANY ($1);',

        'SELECT users.* FROM users JOIN user_followed_pages ON ' +
        'user_followed_pages.user_id = users.id JOIN posts ON ' +
        'posts.made_by_page_id = user_followed_pages.followed_page_id WHERE ' +
        'posts.id = ANY ($1);',
      );
    });
  });

  describe('relationship joining the same table twice', () => {
    it('generates correct SQL', () => {
      testRelationship(
        r('grandfather', 'Human', 'Human', false, '<-RAISED-Human<-RAISED-'),
        r('grandchild', 'Human', 'Human', false, '=RAISED=>Human=RAISED=>'),

        'SELECT humans.* FROM humans JOIN humans humans2 ON ' +
        'humans2.raised_by_human_id = humans.id WHERE humans2.id = ANY ($1);',

        'SELECT humans.* FROM humans JOIN humans humans2 ON ' +
        'humans2.id = humans.raised_by_human_id WHERE ' +
        'humans2.raised_by_human_id = ANY ($1);',
      );
    });
  });
});
