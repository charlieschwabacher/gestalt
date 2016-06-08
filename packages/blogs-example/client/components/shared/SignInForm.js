import React, {Component} from 'react';
import Relay from 'react-relay';
import {SignIn} from '../../mutations';

class SignInForm extends Component {
  state = {
    error: null,
  };

  signIn = e => {
    e.preventDefault();
    Relay.Store.commitUpdate(
      new SignIn({
        session: this.props.session,
        email: e.target.email.value,
        password: e.target.password.value,
      }), {
        onFailure: transaction => this.setState({
          error: transaction.getError().source.errors[0].message
        }),
      }
    );
  }

  render() {
    const {loading, error} = this.state;
    return (
      <form onSubmit={this.signIn}>
        <h3>Sign In:</h3>
        {error && <div className='error'>{error}</div>}
        <input name='email' type='email' placeholder='Email'/>
        <input name='password' type='password' placeholder='Password'/>
        <button type='submit'>Sign In</button>
      </form>
    );
  }
}

export default Relay.createContainer(
  SignInForm,
  {
    fragments: {
      session: () => Relay.QL`
        fragment on Session {
          ${SignIn.getFragment('session')}
        }
      `
    }
  }
);
