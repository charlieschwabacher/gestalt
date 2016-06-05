import Relay, {Mutation} from 'react-relay';

export default class SignOut extends Mutation {
  static fragments = {
    session: () => Relay.QL`
      fragment on Session { id }
    `,
  };

  getMutation() {
    return Relay.QL`
      mutation { signOut }
    `;
  }

  getFatQuery() {
    return Relay.QL`
      fragment on SignOutPayload {
        session { currentUser }
      }
    `;
  }

  getConfigs() {
    return [{
      type: 'FIELDS_CHANGE',
      fieldIDs: { session: this.props.session.id },
    }];
  }

  getVariables() {
    return {};
  }
}
