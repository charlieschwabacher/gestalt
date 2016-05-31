import React from 'react';
import Relay from 'react-relay';

export default Relay.createContainer(
  ({user}) => (
    <div/>
  ),
  {
    fragments: {
      user: () => Relay.QL`
        fragment on User {
          id
        }
      `
    }
  }
);
