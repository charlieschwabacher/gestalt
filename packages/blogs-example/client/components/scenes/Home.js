import React from 'react';
import Relay from 'react-relay';
import {SignInForm, SignUpForm, Posts, User} from '../shared';

const PAGE_SIZE = 10;

export default Relay.createContainer(
  ({session, relay}) => (
    <div style={{marginBottom: '4rem'}}>
      {
        (session.currentUser)
        ?
          <div className='row'>
            <div className='flex'>
              <h3>Who to follow</h3>
              <hr/>
              {
                session.suggestedUsers.map((user, i) =>
                  <div
                    key={i}
                    style={{marginBottom: '0.5rem'}}
                  >
                    <User user={user}/>
                  </div>
                )
              }
            </div>
            <div className='flex-2' style={{marginLeft: '3rem'}}>
              <h3>Your Feed:</h3>
              <hr/>
              <Posts
                posts={session.currentUser.feed}
                loadMore={
                  () => relay.setVariables({
                    count: relay.variables.count + PAGE_SIZE
                  })
                }
              />
            </div>
          </div>
        :
          <div className='row'>
            <div className='flex'>
              <SignInForm session={session}/>
            </div>
            <div className='flex' style={{marginLeft: '3rem'}}>
              <SignUpForm session={session}/>
            </div>
          </div>
      }
    </div>
  ),
  {
    initialVariables: {
      count: PAGE_SIZE,
    },
    fragments: {
      session: () => Relay.QL`
        fragment on Session {
          ${SignInForm.getFragment('session')}
          ${SignUpForm.getFragment('session')}
          currentUser {
            feed(last: $count) {
              ${Posts.getFragment('posts')}
            }
          }
          suggestedUsers {
            ${User.getFragment('user')}
          }
        }
      `
    }
  }
);
