import React, {Component} from 'react';
import Relay from 'react-relay';
import {SignIn} from '../../mutations';

class SignInForm extends Component {
  state = {
    loading: false,
    error: false,
  };

  signIn = e => {
    e.preventDefault();
    if (this.state.loading) {
      return;
    }

    this.setState({loading: true});
    Relay.Store.commitUpdate(
      new SignIn({
        session: this.props.session,
        email: e.target.email.value,
        password: e.target.password.value,
      }), {
        onFailure: () => this.setState({loading: false, error: true}),
      }
    );
  }

  render() {
    const {loading, error} = this.state;
    return (
      <form onSubmit={this.signIn}>
        <h3>Sign In:</h3>
        {error && <div className='error'>Email or passord is invalid</div>}
        <input
          name='email'
          type='email'
          placeholder='Email'
          disabled={loading}
        />
        <input
          name='password'
          type='password'
          placeholder='Password'
          disabled={loading}
        />
        <input
          type='submit'
          value='Sign In'
          disabled={loading}
        />
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
