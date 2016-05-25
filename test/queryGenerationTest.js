// @flow
import {assert} from 'chai';
import {edgeFromPathString, segmentDescriptionsFromEdges} from
  '../src/PostgreSQL/generateDatabaseInterface';
import {keyMap} from '../src/util';
import {sqlQueryFromEdge} from '../src/PostgreSQL/generateEdgeResolver';
import type {Edge, EdgeSegmentDescriptionMap} from '../src/types';

declare function describe(a: string, b: () => any): void;
declare function it(a: string, b: () => any): void;


function segmentDescriptionsBySignatureFromEdges(
  edges: Edge[],
): EdgeSegmentDescriptionMap {
  return keyMap(
    segmentDescriptionsFromEdges(edges),
    segment => segment.signature
  );
}


describe('query generation', () => {

  // describe('plural one segment foreign key relationship', () => {
  //   const outEdge = edgeFromPathString('posts', 'User', 'Post', false, '=AUTHORED=>');
  //   const inEdge = edgeFromPathString('author', 'Post', 'User', false, '<-AUTHORED-');
  //   const segmentDescriptionsBySignature = segmentDescriptionsBySignatureFromEdges([inEdge, outEdge]);
  //
  //   it('resolves inwards', () => {
  //     assert.equal(
  //       sqlQueryFromEdge(segmentDescriptionsBySignature, inEdge),
  //       'SELECT users.* FROM users WHERE users.id = ?',
  //     );
  //   });
  //
  //   it('resolves outwards', () => {
  //     assert.equal(
  //       sqlQueryFromEdge(segmentDescriptionsBySignature, outEdge),
  //       'SELECT posts.* FROM posts WHERE posts.authored_by_user_id = ?',
  //     );
  //   });
  // });
  //
  // describe('plural one segment join table relationship', () => {
  //   const outEdge = edgeFromPathString('posts', 'User', 'Post', false, '=AUTHORED=>');
  //   const inEdge = edgeFromPathString('author', 'Post', 'User', false, '<=AUTHORED=');
  //   const segmentDescriptionsBySignature = segmentDescriptionsBySignatureFromEdges([inEdge, outEdge]);
  //
  //   it('resolves inwards', () => {
  //     assert.equal(
  //       sqlQueryFromEdge(segmentDescriptionsBySignature, inEdge),
  //       'SELECT users.* FROM users JOIN user_authored_posts ON user_authored_posts.user_id = users.id WHERE user_authored_posts.authored_post_id = ?',
  //     );
  //   });
  //
  //   it('resolves outwards', () => {
  //     assert.equal(
  //       sqlQueryFromEdge(segmentDescriptionsBySignature, outEdge),
  //       'SELECT posts.* FROM posts JOIN user_authored_posts ON user_authored_posts.authored_post_id = posts.id WHERE user_authored_posts.user_id = ?',
  //     );
  //   });
  // });
  //
  // describe('plural multi segment relationship', () => {
  //   const outEdge = edgeFromPathString('feed', 'User', 'Post', false, '=FOLLOWED=>User=AUTHORED=>');
  //   const inEdge = edgeFromPathString('audience', 'Post', 'User', false, '<=AUTHORED=User<=FOLLOWED=');
  //   const segmentDescriptionsBySignature = segmentDescriptionsBySignatureFromEdges([inEdge, outEdge]);
  //
  //   it('resolves inwards', () => {
  //     assert.equal(
  //       sqlQueryFromEdge(segmentDescriptionsBySignature, inEdge),
  //       // TODO: this query is not yet correct - it should name tables users_a, users_b, etc to resolve ambiguity but will get to that later...
  //       'SELECT users.* FROM users JOIN user_followed_users ON user_followed_users.user_id = users.id JOIN users ON users.id = user_followed_users.followed_user_id JOIN user_authored_posts ON user_authored_posts.user_id = users.id WHERE user_authored_posts.authored_post_id = ?',
  //     );
  //   });
  //
  //   it('resolves outwards', () => {
  //     assert.equal(
  //       sqlQueryFromEdge(segmentDescriptionsBySignature, outEdge),
  //       'SELECT posts.* FROM posts JOIN user_authored_posts ON user_authored_posts.authored_post_id = posts.id JOIN users ON users.id = user_authored_posts.user_id JOIN user_followed_users ON user_followed_users.followed_user_id = users.id WHERE user_followed_users.user_id = ?',
  //     );
  //   });
  // });

  describe('singular one segment relationship', () => {
    const outEdge = edgeFromPathString('profile', 'User', 'Profile', true, '-CREATED->');
    const inEdge = edgeFromPathString('user', 'Profile', 'User', true, '<-CREATED-');
    const segmentDescriptionsBySignature = segmentDescriptionsBySignatureFromEdges([inEdge, outEdge]);

    it('resolves inwards', () => {
      assert.equal(
        sqlQueryFromEdge(segmentDescriptionsBySignature, inEdge),
        'SELECT users.* FROM users WHERE users.id = ?',
      );
    });

    it('resolves outwards', () => {
      assert.equal(
        sqlQueryFromEdge(segmentDescriptionsBySignature, outEdge),
        'SELECT profiles.* FROM profiles WHERE profiles.created_by_user_id = ?'
      );
    });

  });

  // describe('singular multi segment relationship', () => {
  //   const outEdge = edgeFromPathString('pinnedPost', 'User', 'Image', false, '-CREATED->Profile<-DEPICTED-');
  //   const inEdge = edgeFromPathString('user', 'Image', 'User', false, '-DEPICTED->Profile<-CREATED-');
  //   const segmentDescriptionsBySignature = segmentDescriptionsBySignatureFromEdges([inEdge, outEdge]);
  //
  //   it('resolves inwards', () => {
  //     assert.equal(
  //       sqlQueryFromEdge(segmentDescriptionsBySignature, inEdge),
  //       'SELECT users.* FROM users JOIN profiles ON profile.created_by_user_id = users.id WHERE profiles.depicted_by_image_id = ?'
  //     );
  //   });
  //
  //   it('resolves outwards', () => {
  //     assert.equal(
  //       sqlQueryFromEdge(segmentDescriptionsBySignature, outEdge),
  //       'SELECT profiles.* FROM profiles WHERE profiles.user_id = ?'
  //     );
  //   });
  // });
  //
  // describe('mixed singular and plural multi segment relationship', () => {
  //   it('resolves inwards', () => {
  //   });
  //
  //   it('resolves outwards', () => {
  //   });
  // });
  //
  // describe('one directional relationship', () => {
  //   it('resolves inwards', () => {
  //   });
  //
  //   it('resolves outwards', () => {
  //   });
  // });

});
