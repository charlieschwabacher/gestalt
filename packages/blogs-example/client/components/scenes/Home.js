import React from 'react';
import Relay from 'react-relay';
import {SignInForm, SignUpForm, Post} from '../shared';

export default Relay.createContainer(
  ({session, relay}) => (
    <div>
      {
        (session.currentUser)
        ?
          <div>
            <hr/>
            {
              session.currentUser.feed.edges.map(({node: post}, i) =>
                <Post post={post} key={i}/>
              )
            }
            {
              session.currentUser.feed.pageInfo.hasNextPage &&
              <a onClick={() => relay.setVariables({count: relay.variables.count + 10})}>
                More
              </a>
            }
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
      count: 10,
    },
    fragments: {
      session: () => Relay.QL`
        fragment on Session {
          ${SignInForm.getFragment('session')}
          ${SignUpForm.getFragment('session')}
          currentUser {
            feed(last: $count) {
              edges {
                node {
                  ${Post.getFragment('post')}
                }
              }
              pageInfo {
                hasNextPage
              }
            }
          }
        }
      `
    }
  }
);
