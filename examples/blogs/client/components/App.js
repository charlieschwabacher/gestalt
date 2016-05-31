// @flow
import React from 'react';
import Relay from 'react-relay';
import {User} from './shared';
import {SignOut} from '../mutations';

export default Relay.createContainer(
  ({session, children}) => (
    <div>
      <header>
        <div className='container row'>
          <div className='flex'>Gestalt Blogs Example</div>
          {
            session.currentUser &&
            <div>
              <User user={session.currentUser}/>
              {' | '}
              <a
                onClick={() => Relay.Store.commitUpdate(
                  new SignOut({session})
                )}
              >
                Sign Out
              </a>
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
          ${SignOut.getFragment('session')}
          currentUser {
            ${User.getFragment('user')}
          }
        }
      `
    }
  }
);
