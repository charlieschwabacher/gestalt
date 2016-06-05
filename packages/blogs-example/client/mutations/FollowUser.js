import Relay, {Mutation} from 'react-relay';

export default class FollowUser extends Mutation {
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
      mutation { followUser }
    `;
  }

  getFatQuery() {
    return Relay.QL`
      fragment on FollowUserPayload {
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
      follow: this.props.follow,
    };
  }
}
