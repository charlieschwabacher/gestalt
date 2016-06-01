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
      className='row align-stretch my1'
    >
      <input type='text' name='text' placeholder='Text' className='flex'/>
      <input type='submit' value='Comment'/>
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
