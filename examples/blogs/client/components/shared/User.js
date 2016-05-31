import React from 'react';
import Relay from 'react-relay';

export default Relay.createContainer(
  ({user}) =>
    <div>
      <img src={user.profileImage} style={{width: 40, height: 40}}/>
      {user.fullName}
    </div>
  ,
  {
    fragments: {
      user: () => Relay.QL`
        fragment on User {
          fullName
          profileImage(size: 80)
        }
      `
    }
  }
);
