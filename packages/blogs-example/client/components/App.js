// @flow
import React from 'react';
import Relay from 'react-relay';
import {Link} from 'react-router';
import {User, SignOutLink, GestaltLogo} from './shared';

export default Relay.createContainer(
  ({session, children}) => (
    <div>
      <header>
        <div className='container row'>
          <div style={{margin: '-5px 10px -5px 0'}}>
            <GestaltLogo height={25} color={'rebeccapurple'}/>
          </div>
          <div className='flex'>
            <Link to='/'>Gestalt Blogs Example</Link>
          </div>
          {
            session.currentUser &&
            <div className='row'>
              <User user={session.currentUser}/>
              <span style={{padding: '0 1rem'}}>|</span>
              <Link to='/posts/new'>New Post</Link>
              <span style={{padding: '0 1rem'}}>|</span>
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
