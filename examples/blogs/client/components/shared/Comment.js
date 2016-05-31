import React from 'react';
import Relay from 'react-relay';
import {User} from '.';

export default Relay.createContainer(
  ({comment}) =>
    <div>
      <User user={comment.author}/>
      <p>{comment.text}</p>
    </div>
  ,
  {
    fragments: {
      comment: () => Relay.QL`
        fragment on Comment {
          text
          author {
            ${User.getFragment('user')}
          }
        }
      `
    }
  }
);
