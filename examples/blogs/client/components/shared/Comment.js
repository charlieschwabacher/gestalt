import React from 'react';
import Relay from 'react-relay';
import {User} from '.';

export default Relay.createContainer(
  ({comment}) =>
    <div className='row my1'>
      <User user={comment.author}/>
      <div className='flex ml1'>{comment.text}</div>
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
