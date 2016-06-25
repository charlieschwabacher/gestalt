import Relay, {Mutation} from 'react-relay';

export default class UnfollowUser extends Mutation {
  static fragments = {
    user: () => Relay.QL`
      fragment on User { id }
    `,
    currentUser: () => Relay.QL`
      fragment on User { id }
    `,
  };

  getMutation() {
    return Relay.QL`
      mutation { unfollowUser }
    `;
  }

  getFatQuery() {
    return Relay.QL`
      fragment on UnfollowUserPayload {
        user {
          following
          followers
        }
        currentUser {
          followedUsers
          feed
        }
      }
    `;
  }

  getConfigs() {
    return [{
      type: 'FIELDS_CHANGE',
      fieldIDs: {
        user: this.props.user.id,
        currentUser: this.props.currentUser.id,
      },
    }];
  }

  getVariables() {
    return {
      userID: this.props.user.id,
    };
  }
}
