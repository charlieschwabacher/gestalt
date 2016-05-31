import React from 'react';
import Relay from 'react-relay';
import {Post, SignInForm, SignUpForm} from '../shared';

const Feed = Relay.createContainer(
  ({user}) => (
    <div>
      {
        user.feed.edges.map(({post: node}) =>
          <Post post={post}/>
        )
      }
    </div>
  ),
  {
    fragments: {
      user: () => Relay.QL`
        fragment on User {
          feed {
            edges {
              node {
                ${Post.getFragment('post')}
              }
            }
          }
        }
      `
    }
  }
);

export default Relay.createContainer(
  ({session}) => (
    console.log('rendering home', session),
    <div>
      {
        session.currentUser
        ?
          <Feed user={session.currentUser}/>
        :
          <div className='row mx-1'>
            <div className='flex p1'>
              <SignInForm session={session}/>
            </div>
            <div className='flex p1'>
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
            ${Feed.getFragment('user')}
          }
        }
      `
    }
  }
);
