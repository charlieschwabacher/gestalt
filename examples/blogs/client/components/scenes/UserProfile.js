import React from 'react';
import Relay from 'react-relay';
import {User} from '../shared';

export default Relay.createContainer(
  ({node: user}) => (
    <div>
      <User user={user}/>
    </div>
  ),
  {
    fragments: {
      node: () => Relay.QL`
        fragment on User {
          id
          ${User.getFragment('user')}
        }
      `
    }
  }
);
