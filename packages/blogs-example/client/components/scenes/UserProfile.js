import React from 'react';
import Relay from 'react-relay';
import {FollowButton, Posts, User, Users} from '../shared';

const PAGE_SIZE = 10;

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
            <Users users={user.followedUsers}/>
            {user.followedUsers.totalCount === 0 && 'Not following anyone'}
          </section>
          <hr/>
          <section>
            <h3>Followers:</h3>
            <Users users={user.followers}/>
            {user.followers.totalCount === 0 && 'No followers yet'}
          </section>
        </div>
        <div className='flex-2' style={{marginLeft: '3rem'}}>
          <h3>{user.firstName}'s Posts:</h3>
          <hr/>
          <Posts
            posts={user.posts}
            loadMore={
              () => relay.setVariables({
                count: relay.variables.count + PAGE_SIZE
              })
            }
          />
        </div>
      </div>
    </div>
  ),
  {
    initialVariables: {
      count: PAGE_SIZE,
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
          ${FollowButton.getFragment('user')}
          ${User.getFragment('user')}
          posts(last: $count) {
            ${Posts.getFragment('posts')}
          }
          followers(last: 5) {
            ${Users.getFragment('users')}
            totalCount
          }
          followedUsers(last: 5) {
            ${Users.getFragment('users')}
            totalCount
          }
        }
      `
    }
  }
);
