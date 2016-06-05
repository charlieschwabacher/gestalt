import React from 'react';
import Relay from 'react-relay';
import {CreatePost} from '../../mutations';

export default Relay.createContainer(
  ({user}) => (
    <form
      onSubmit={e => {
        e.preventDefault();
        Relay.Store.commitUpdate(
          new CreatePost({
            user,
            title: e.target.title.value,
            text: e.target.text.value,
          })
        );
      }}
      className='col align-stretch'
    >
      <input name='title' type='text' placeholder='Title'/>
      <textarea name='text' placeholder='Text'/>
      <input type='submit' value='Create Post'/>
    </form>
  ),
  {
    fragments: {
      user: () => Relay.QL`
        fragment on User {
          ${CreatePost.getFragment('user')}
        }
      `
    }
  }
);
