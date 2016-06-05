import Relay, {Mutation} from 'react-relay';

export default class SignIn extends Mutation {
  static fragments = {
    session: () => Relay.QL`
      fragment on Session { id }
    `,
  };

  getMutation() {
    return Relay.QL`
      mutation { signIn }
    `;
  }

  getFatQuery() {
    return Relay.QL`
      fragment on SignInPayload {
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
    return {
      email: this.props.email,
      password: this.props.password,
    };
  }
}
