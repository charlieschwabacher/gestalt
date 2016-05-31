import React from 'react';
import Relay from 'react-relay';
import {Link} from 'react-router';

export default Relay.createContainer(
  ({user}) =>
    <span>
      <img src={user.profileImage} style={{width: 40, height: 40}}/>
      <Link to={`/users/${user.id}`}>{user.fullName}</Link>
    </span>
  ,
  {
    fragments: {
      user: () => Relay.QL`
        fragment on User {
          id
          fullName
          profileImage(size: 80)
        }
      `
    }
  }
);
