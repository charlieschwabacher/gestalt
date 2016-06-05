import React from 'react';
import Relay from 'react-relay';
import {FollowUser} from '../../mutations';

export default Relay.createContainer(
  ({currentUser, user}) =>
    <input
      type='submit'
      style={{margin: '1rem 0'}}
      onClick={
        () => Relay.Store.commitUpdate(
          new FollowUser({
            user,
            currentUser,
            follow: !user.following
          })
        )
      }
      value={
        user.following
        ? `Following ${user.firstName}`
        : `Follow ${user.firstName}`
      }
    />
  ,
  {
    fragments: {
      user: () => Relay.QL`
        fragment on User {
          ${FollowUser.getFragment('user')}
          firstName
          following
        }
      `,
      currentUser: () => Relay.QL`
        fragment on User {
          ${FollowUser.getFragment('currentUser')}
        }
      `
    }
  }
);
