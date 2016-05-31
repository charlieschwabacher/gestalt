import React from 'react';
import Relay from 'react-relay';

export default Relay.createContainer(
  ({post}) => (
    <div/>
  ),
  {
    fragments: {
      post: () => Relay.QL`
        fragment on Post {
          id
        }
      `
    }
  }
);
