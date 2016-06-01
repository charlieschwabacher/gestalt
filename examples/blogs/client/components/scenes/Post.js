import React from 'react';
import Relay from 'react-relay';
import {Post} from '../shared';

export default Relay.createContainer(
  ({node: post}) => (
    <div>
      <p className='text-right'>{post.createdAt}</p>
      <Post post={post}/>
    </div>
  ),
  {
    fragments: {
      node: () => Relay.QL`
        fragment on Post {
          createdAt
          ${Post.getFragment('post')}
        }
      `
    }
  }
);
