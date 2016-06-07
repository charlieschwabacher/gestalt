import React, {Component} from 'react';
import Relay from 'react-relay';
import {SignUp} from '../../mutations';

class SignUpForm extends Component {
  state = {
    error: null,
  };

  signUp = e => {
    e.preventDefault();
    Relay.Store.commitUpdate(
      new SignUp({
        session: this.props.session,
        email: e.target.email.value,
        password: e.target.password.value,
        firstName: e.target.firstName.value,
        lastName: e.target.lastName.value,
      }), {
        onFailure: transaction => this.setState({
          error: transaction.getError().source.errors[0].message
        })
      }
    );
  };

  render() {
    const {error} = this.state;

    return (
      <form onSubmit={this.signUp}>
        <h3>Sign Up</h3>
        {error && <div className='error'>{error}</div>}
        <input name='email' type='email' placeholder='Email'/>
        <input name='password' type='password' placeholder='Password'/>
        <input name='firstName' type='text' placeholder='First Name'/>
        <input name='lastName' type='text' placeholder='Last Name'/>
        <button type='submit'>Sign Up</button>
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
