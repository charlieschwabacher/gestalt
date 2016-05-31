import React from 'react';
import Relay from 'react-relay';
import {User, Comment, CreateCommentForm} from '.';

export default Relay.createContainer(
  ({post}) =>
    <div>
      <User user={post.author}/>
      <h3>{post.title}</h3>
      <p>{post.text}</p>
      <div>
        {
          post.comments.edges.map(({node: comment}, i) =>
            <Comment key={i} comment={comment}/>
          )
        }
        <CreateCommentForm post={post}/>
      </div>
    </div>
  ,
  {
    fragments: {
      post: () => Relay.QL`
        fragment on Post {
          ${CreateCommentForm.getFragment('post')}
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
