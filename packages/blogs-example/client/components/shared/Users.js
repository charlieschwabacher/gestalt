import React from 'react';
import Relay from 'react-relay';
import {User} from './';

export default Relay.createContainer(
  ({users}) => (
    <div>
      {
        users.edges.map(({node: user}, i) =>
          <div
            key={i}
            style={{marginBottom: '0.5rem'}}
          >
            <User user={user}/>
          </div>
        )
      }
    </div>
  ),
  {
    fragments: {
      users: () => Relay.QL`
        fragment on UsersConnection {
          edges {
            node {
              ${User.getFragment('user')}
            }
          }
        }
      `
    }
  }
);
