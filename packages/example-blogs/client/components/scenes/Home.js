import React from 'react';
import Relay from 'react-relay';
import {Feed, SignInForm, SignUpForm, CreatePostForm} from '../shared';

export default Relay.createContainer(
  ({session}) => (
    <div>
      {
        session.currentUser
        ?
          <div>
            <CreatePostForm user={session.currentUser}/>
            <hr/>
            <div className='row'>
              <div className='flex'>
                <h3>Your Posts:</h3>
                <Feed posts={session.currentUser.posts}/>
              </div>
              <div className='flex ml1'>
                <h3>Feed:</h3>
                <Feed posts={session.currentUser.feed}/>
              </div>
            </div>
          </div>
        :
          <div className='row'>
            <div className='flex'>
              <SignInForm session={session}/>
            </div>
            <div className='flex ml1'>
              <SignUpForm session={session}/>
            </div>
          </div>
      }
    </div>
  ),
  {
    fragments: {
      session: () => Relay.QL`
        fragment on Session {
          ${SignInForm.getFragment('session')}
          ${SignUpForm.getFragment('session')}
          currentUser {
            ${CreatePostForm.getFragment('user')}
            feed {
              ${Feed.getFragment('posts')}
            }
            posts {
              ${Feed.getFragment('posts')}
            }
          }
        }
      `
    }
  }
);
