import React from 'react';
import Relay from 'react-relay';
import {SignIn} from '../../mutations';

export default Relay.createContainer(
  ({session}) => (
    <form
      onSubmit={e => {
        e.preventDefault();
        Relay.Store.commitUpdate(
          new SignIn({
            session,
            email: e.target.email.value,
            password: e.target.password.value,
          })
        );
      }}
    >
      <input name='email' type='email' placeholder='Email'/>
      <input name='password' type='password' placeholder='Password'/>
      <input type='submit' value='Sign In'/>
    </form>
  ),
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
