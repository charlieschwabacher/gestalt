// @flow
import {assert} from 'chai';
import {edgeFromPathString as edge, segmentDescriptionsFromEdges} from
  '../src/PostgreSQL/generateDatabaseInterface';
import {keyMap} from '../src/util';
import {sqlQueryFromEdge, objectKeyColumnFromEdge} from
  '../src/PostgreSQL/generateEdgeResolver';
import type {Edge, EdgeSegmentDescriptionMap} from '../src/types';

declare function describe(a: string, b: () => any): void;
declare function it(a: string, b: () => any): void;


function testRelationship(
  outEdge: ?Edge,
  inEdge: ?Edge,
  outSQL: ?string,
  inSQL: ?string,
): void {
  const descriptions = keyMap(
    segmentDescriptionsFromEdges([inEdge, outEdge].filter(edge => edge)),
    segment => segment.signature,
  );
  outEdge && assert.equal(outSQL, sqlQueryFromEdge(descriptions, outEdge));
  inEdge && assert.equal(inSQL, sqlQueryFromEdge(descriptions, inEdge));
}

describe('query generation', () => {

  describe('plural one segment foreign key relationship', () => {
    it('generates correct SQL', () => {
      testRelationship(
        edge('posts', 'User', 'Post', false, '=AUTHORED=>'),
        edge('author', 'Post', 'User', false, '<-AUTHORED-'),
        'SELECT posts.* FROM posts WHERE posts.authored_by_user_id = ANY ($1);',
        'SELECT users.* FROM users WHERE users.id = ANY ($1);',
      );
    });
  });

  describe('plural one segment join table relationship', () => {
    it('generates correct SQL', () => {
      testRelationship(
        edge('posts', 'User', 'Post', false, '=AUTHORED=>'),
        edge('author', 'Post', 'User', false, '<=AUTHORED='),

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
        edge('feed', 'User', 'Post', false, '=FOLLOWED=>User=AUTHORED=>'),
        edge('audience', 'Post', 'User', false, '<=AUTHORED=User<=FOLLOWED='),

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
        edge('profile', 'User', 'Profile', true, '-CREATED->'),
        edge('user', 'Profile', 'User', true, '<-CREATED-'),

        'SELECT profiles.* FROM profiles WHERE profiles.created_by_user_id = ' +
        'ANY ($1);',

        'SELECT users.* FROM users WHERE users.id = ANY ($1);',
      );
    });
  });

  describe('singular bidirectional two segment relationship', () => {
    it('generates correct SQL', () => {
      testRelationship(
        edge('image', 'User', 'Image', false, '-CREATED->Profile<-DEPICTED-'),
        edge('user', 'Image', 'User', false, '-DEPICTED->Profile<-CREATED-'),

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
        edge('post', 'User', 'Theme', false, '-CREATED->Profile-SELECTED->'),
        edge('user', 'Theme', 'User', false, '<-SELECTED-Profile<-CREATED-'),

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
        edge('images', 'User', 'Image', false, '-CREATED->PROFILE=UPLOADED=>'),
        edge('owner', 'Image', 'User', false, '<-UPLOADED-PROFILE<-CREATED-'),

        'SELECT images.* FROM images JOIN profiles ON profiles.id = ' +
        'images.uploaded_by_profile_id WHERE profiles.created_by_user_id = ' +
        'ANY ($1);',

        'SELECT users.* FROM users JOIN profiles ON ' +
        'profiles.created_by_user_id = users.id WHERE profiles.id = ANY ($1);',
      );
    });
  });

  describe('one sided outward one segment relationship', () => {
    it('generates correct SQL', () => {
      testRelationship(
        edge('posts', 'User', 'Post', false, '=AUTHORED=>'),

        null,

        'SELECT posts.* FROM posts JOIN user_authored_posts ON ' +
        'user_authored_posts.authored_post_id = posts.id WHERE ' +
        'user_authored_posts.user_id = ANY ($1);',

        null
      );
    });
  });

  describe('one sided inward one segment relationship', () => {
    it('generates correct SQL', () => {
      testRelationship(
        null,

        edge('author', 'Post', 'User', false, '<-AUTHORED-'),

        null,

        'SELECT users.* FROM users WHERE users.authored_post_id = ANY ($1);'
      );
    });
  });


  describe('one sided two segment relationship', () => {
    it('generates correct SQL', () => {
      testRelationship(
        edge('feed', 'User', 'Post', false, '=FOLLOWED=>Page=AUTHORED=>'),

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
        edge(
          'feed',
          'User',
          'Comment',
          false,
          '=FOLLOWED=>Page=MADE=>Post=INSPIRED=>'
        ),

        edge(
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
});


function testKeyColumns(
  inEdge: Edge,
  outEdge: Edge,
  inKeyColumn: string,
  outKeyColumn: string
): void {
  const descriptions = keyMap(
    segmentDescriptionsFromEdges([inEdge, outEdge]),
    segment => segment.signature,
  );
  assert.equal(objectKeyColumnFromEdge(descriptions, inEdge), inKeyColumn);
  assert.equal(objectKeyColumnFromEdge(descriptions, outEdge), outKeyColumn);
}


describe('key column generation', () => {
  it('one segment foreign key relationship', () => {
    testKeyColumns(
      edge('posts', 'User', 'Post', false, '=AUTHORED=>'),
      edge('author', 'Post', 'User', false, '<-AUTHORED-'),
      'id',
      'authoredByUserId',
    );
  });

  it('two segment join table relationship', () => {
    testKeyColumns(
      edge('posts', 'User', 'Post', false, '=AUTHORED=>'),
      edge('author', 'Post', 'User', false, '<=AUTHORED='),
      'id',
      'id',
    );
  });
});
