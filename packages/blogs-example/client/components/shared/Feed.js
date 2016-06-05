import React from 'react';
import Relay from 'react-relay';
import {Post} from '.';

export default Relay.createContainer(
  ({posts, relay}) => (
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
    variables: {

    },
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
