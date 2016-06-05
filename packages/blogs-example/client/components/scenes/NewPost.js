import React from 'react';
import Relay from 'react-relay';
import {CreatePostForm} from '../shared';

export default Relay.createContainer(
  ({session}) => (
    <CreatePostForm user={session.currentUser}/>
  ),
  {
    fragments: {
      session: () => Relay.QL`
        fragment on Session {
          currentUser {
            ${CreatePostForm.getFragment('user')}
          }
        }
      `
    }
  }
);
