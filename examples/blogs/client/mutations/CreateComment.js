import Relay, {Mutation} from 'react-relay';

export default class CreateComment extends Mutation {
  static fragments = {
    post: () => Relay.QL`
      fragment on Post { id }
    `,
  };

  getMutation() {
    return Relay.QL`
      mutation { createComment }
    `;
  }

  getFatQuery() {
    return Relay.QL`
      fragment on CreateCommentPayload {
        post { comments }
      }
    `;
  }

  getConfigs() {
    return [{
      type: 'FIELDS_CHANGE',
      fieldIDs: { post: this.props.post.id },
    }];
  }

  getVariables() {
    return {
      text: this.props.text,
      inspiredByPostID: this.props.post.id,
    };
  }
}
