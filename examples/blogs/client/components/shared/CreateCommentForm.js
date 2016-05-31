import React from 'react';
import Relay from 'react-relay';
import {CreateComment} from '../../mutations';

export default Relay.createContainer(
  ({post}) => (
    <form
      onSubmit={e => {
        e.preventDefault();
        Relay.Store.commitUpdate(
          new CreateComment({
            post,
            text: e.target.text.value,
          })
        );
      }}
    >
      <textarea name='text' placeholder='Text'/>
      <input type='submit' value='Create Comment'/>
    </form>
  ),
  {
    fragments: {
      post: () => Relay.QL`
        fragment on Post {
          ${CreateComment.getFragment('post')}
        }
      `
    }
  }
);
