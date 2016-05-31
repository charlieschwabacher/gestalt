import React from 'react';
import Relay from 'react-relay';

export default Relay.createContainer(
  ({node: post}) => (
    <div/>
  ),
  {
    fragments: {
      node: () => Relay.QL`
        fragment on Post {
          id
        }
      `
    }
  }
);
