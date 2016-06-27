import Relay, {Mutation} from 'react-relay';

export default class CreatePost extends Mutation {
  static fragments = {
    user: () => Relay.QL`
      fragment on User { id }
    `,
  };

  getMutation() {
    return Relay.QL`
      mutation { createPost }
    `;
  }

  getFatQuery() {
    return Relay.QL`
      fragment on CreatePostPayload {
        user {
          posts,
          feed
        }
      }
    `;
  }

  getConfigs() {
    return [{
      type: 'FIELDS_CHANGE',
      fieldIDs: { user: this.props.user.id },
    }];
  }

  getVariables() {
    return {
      title: this.props.title,
      text: this.props.text,
    };
  }
}
