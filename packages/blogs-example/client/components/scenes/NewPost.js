import React from 'react';
import Relay from 'react-relay';
import {NewPostForm} from '../shared';

export default Relay.createContainer(
  ({session}) => (
    <NewPostForm user={session.currentUser}/>
  ),
  {
    fragments: {
      session: () => Relay.QL`
        fragment on Session {
          currentUser {
            ${NewPostForm.getFragment('user')}
          }
        }
      `
    }
  }
);
