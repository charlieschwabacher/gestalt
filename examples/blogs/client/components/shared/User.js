import React from 'react';
import Relay from 'react-relay';
import {Link} from 'react-router';

export default Relay.createContainer(
  ({user}) =>
    <div className='row align-center'>
      <img
        src={user.profileImage}
        style={{width: 15, height: 15, marginRight: '0.5rem'}}
      />
      <Link to={`/users/${user.id}`}>{user.fullName}</Link>
    </div>
  ,
  {
    fragments: {
      user: () => Relay.QL`
        fragment on User {
          id
          fullName
          profileImage(size: 30)
        }
      `
    }
  }
);
