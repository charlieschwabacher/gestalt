import React from 'react';
import Relay from 'react-relay';
import {Post} from '.';

export default Relay.createContainer(
  ({posts}) => (
    <div>
      {
        posts.edges.map(({node: post}, i) =>
          <Post
            post={post}
            key={i}
          />
        )
      }
    </div>
  ),
  {
    fragments: {
      posts: () => Relay.QL`
        fragment on PostsConnection {
          edges {
            node {
              ${Post.getFragment('post')}
            }
          }
        }
      `
    }
  }
);
