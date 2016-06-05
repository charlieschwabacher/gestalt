import React, {Component} from 'react';
import Relay from 'react-relay';
import {SignUp} from '../../mutations';

class SignUpForm extends Component {
  state = {
    loading: false,
    error: false,
  };

  signUp = e => {
    e.preventDefault();
    Relay.Store.commitUpdate(
      new SignUp({
        session,
        email: e.target.email.value,
        password: e.target.password.value,
        firstName: e.target.firstName.value,
        lastName: e.target.lastName.value,
      }),
      {
        onFailure: () => this.setState({loading: false, error: true})
      }
    );
  };

  render() {
    const {session} = this.props;

    return (
      <form onSubmit={this.signUp}>
        <h3>Sign Up</h3>
        <input name='email' type='email' placeholder='Email'/>
        <input name='password' type='password' placeholder='Password'/>
        <input name='firstName' type='text' placeholder='First Name'/>
        <input name='lastName' type='text' placeholder='Last Name'/>
        <input type='submit' value='Sign Up'/>
      </form>
    );
  }
}

export default Relay.createContainer(
  SignUpForm,
  {
    fragments: {
      session: () => Relay.QL`
        fragment on Session {
          ${SignUp.getFragment('session')}
        }
      `
    }
  }
);
