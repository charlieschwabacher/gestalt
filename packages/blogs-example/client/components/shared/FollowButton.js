import React from 'react';
import Relay from 'react-relay';
import {FollowUser, UnfollowUser} from '../../mutations';

export default Relay.createContainer(
  ({currentUser, user}) =>
    <button
      style={{margin: '1rem 0'}}
      onClick={
        () => Relay.Store.commitUpdate(
          (user.following)
          ? new UnfollowUser({user, currentUser})
          : new FollowUser({user, currentUser})
        )
      }
    >
      {
        user.following
        ? `Following ${user.firstName}`
        : `Follow ${user.firstName}`
      }
    </button>
  ,
  {
    fragments: {
      user: () => Relay.QL`
        fragment on User {
          ${FollowUser.getFragment('user')}
          ${UnfollowUser.getFragment('user')}
          firstName
          following
        }
      `,
      currentUser: () => Relay.QL`
        fragment on User {
          ${FollowUser.getFragment('currentUser')}
          ${UnfollowUser.getFragment('currentUser')}
        }
      `
    }
  }
);
