import React from 'react';
import Relay from 'react-relay';
import {Post} from '../shared';


function formatDate(dateString) {
  const d = new Date(dateString);
  return `${d.getMonth()} / ${d.getDate()} / ${d.getFullYear()}`;
}

export default Relay.createContainer(
  ({node: post}) => (
    <div>
      <div style={{textAlign: 'right'}}>
        {formatDate(post.createdAt)}
      </div>
      <hr style={{marginTop: '0.5rem'}}/>
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
