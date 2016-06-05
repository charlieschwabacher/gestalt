import Relay, {Mutation} from 'react-relay';

export default class SignUp extends Mutation {
  static fragments = {
    session: () => Relay.QL`
      fragment on Session { id }
    `,
  };

  getMutation() {
    return Relay.QL`
      mutation { signUp }
    `;
  }

  getFatQuery() {
    return Relay.QL`
      fragment on SignUpPayload {
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
      firstName: this.props.firstName,
      lastName: this.props.lastName,
    };
  }
}
