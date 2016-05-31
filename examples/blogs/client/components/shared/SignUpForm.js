import React from 'react';
import Relay from 'react-relay';
import {SignUp} from '../../mutations';

export default Relay.createContainer(
  ({session}) => (
    <form
      onSubmit={e => {
        e.preventDefault();
        Relay.Store.commitUpdate(
          new SignUp({
            session,
            email: e.target.email.value,
            password: e.target.password.value,
            firstName: e.target.firstName.value,
            lastName: e.target.lastName.value,
          })
        );
      }}
    >
      <input name='email' type='email' placeholder='Email'/>
      <input name='password' type='password' placeholder='Password'/>
      <input name='firstName' type='text' placeholder='First Name'/>
      <input name='lastName' type='text' placeholder='Last Name'/>
      <input type='submit' value='Sign Up'/>
    </form>
  ),
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
