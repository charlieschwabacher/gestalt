// @flow
import React from 'react';
import Relay from 'react-relay';
import {Link} from 'react-router';
import {User, SignOutLink} from './shared';

export default Relay.createContainer(
  ({session, children}) => (
    <div>
      <header className='p1 light-bg'>
        <div className='container row'>
          <div className='flex'>
            <Link to='/'>Gestalt Blogs Example</Link>
          </div>
          {
            session.currentUser &&
            <div className='row align-center'>
              <User user={session.currentUser}/>
              <div className='mx1'>|</div>
              <SignOutLink session={session}/>
            </div>
          }
        </div>
      </header>
      <div className='container my1'>
        {children}
      </div>
    </div>
  ),
  {
    fragments: {
      session: () => Relay.QL`
        fragment on Session {
          id
          ${SignOutLink.getFragment('session')}
          currentUser {
            ${User.getFragment('user')}
          }
        }
      `
    }
  }
);
