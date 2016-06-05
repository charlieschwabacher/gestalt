import React from 'react';
import Relay from 'react-relay';
import {User, Feed, FollowButton, Post} from '../shared';

export default Relay.createContainer(
  ({session, node: user}) => (
    <div>
      <div className='row'>
        <div className='flex'>
          <section>
            <h3>User:</h3>
            <User user={user}/>
            <FollowButton
              user={user}
              currentUser={session.currentUser}
            />
          </section>
          <hr/>
          <section>
            <h3>Following:</h3>
            {
              user.followedUsers.edges.map(({node: user}, i) =>
                <User key={i} user={user}/>
              )
            }
            {
              user.followedUsers.totalCount === 0 &&
              'not following anyone yet'
            }
          </section>
          <hr/>
          <section>
            <h3>Followers:</h3>
            {
              user.followers.edges.map(({node: user}, i) =>
                <User key={i} user={user}/>
              )
            }
            {
              user.followers.totalCount === 0 &&
              'no followers yet'
            }
          </section>
        </div>
        <div className='flex-2' style={{marginLeft: '3rem'}}>
          <h3>{user.firstName}'s Posts:</h3>
          <hr/>
          {
            user.posts.edges.map(({node: post}, i) =>
              <Post post={post} key={i}/>
            )
          }
          {
            user.posts.pageInfo.hasNextPage &&
            <a onClick={() => relay.setVariables({count: relay.variables.count + 10})}>
              more
            </a>
          }
        </div>
      </div>
    </div>
  ),
  {
    initialVariables: {
      count: 10,
    },
    fragments: {
      session: () => Relay.QL`
        fragment on Session {
          currentUser {
            ${FollowButton.getFragment('currentUser')}
          }
        }
      `,
      node: () => Relay.QL`
        fragment on User {
          id
          firstName
          ${User.getFragment('user')}
          ${FollowButton.getFragment('user')}
          posts(last: $count) {
            edges {
              node {
                ${Post.getFragment('post')}
              }
            }
            pageInfo {
              hasNextPage
            }
          }
          followers(last: 10) {
            edges {
              node {
                ${User.getFragment('user')}
              }
            }
            totalCount
          }
          followedUsers(last: 10) {
            edges {
              node {
                ${User.getFragment('user')}
              }
            }
            totalCount
          }
        }
      `
    }
  }
);
