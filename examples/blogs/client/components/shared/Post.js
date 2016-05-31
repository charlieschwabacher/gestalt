import React from 'react';
import Relay from 'react-relay';
import {User, Comment} from '.';

export default Relay.createContainer(
  ({post}) =>
    <div>
      <User user={post.author}/>
      <h3>{post.title}</h3>
      <p>{post.text}</p>
      <div>
        {
          node.comments.edges.map(({comment: node}) =>
            <Comment comment={comment}/>
          )
        }
      </div>
    </div>
  ,
  {
    fragments: {
      post: () => Relay.QL`
        fragment on Post {
          title
          text
          author {
            ${User.getFragment('user')}
          }
          comments {
            edges {
              node {
                ${Comment.getFragment('comment')}
              }
            }
          }
        }
      `
    }
  }
);
