import React from 'react';
import Relay from 'react-relay';
import {Post, SignInForm, SignUpForm, CreatePostForm} from '../shared';

const Feed = Relay.createContainer(
  ({user}) => (
    <div>
      <h3>Feed:</h3>
      {
        user.feed.edges.map(({node: post}, i) =>
          <div key={i}>
            <Post post={post}/>
            <hr/>
          </div>
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
          <div>
            <CreatePostForm user={session.currentUser}/>
            <Feed user={session.currentUser}/>
          </div>
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
            ${CreatePostForm.getFragment('user')}
          }
        }
      `
    }
  }
);
