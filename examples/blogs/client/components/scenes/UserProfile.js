import React from 'react';
import Relay from 'react-relay';
import {User, Feed} from '../shared';

export default Relay.createContainer(
  ({node: user}) => (
    <div>
      <div className='row'>
        <div className='flex'>
          <User user={user}/>
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
        <div className='flex-2 ml1'>
          <h3 className='m0 mb1'>{user.firstName}'s Posts:</h3>
          <Feed posts={user.posts}/>
        </div>
      </div>
    </div>
  ),
  {
    fragments: {
      node: () => Relay.QL`
        fragment on User {
          id
          firstName
          ${User.getFragment('user')}
          posts {
            ${Feed.getFragment('posts')}
          }
          followers {
            edges {
              node {
                ${User.getFragment('user')}
              }
            }
            totalCount
          }
          followedUsers {
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
