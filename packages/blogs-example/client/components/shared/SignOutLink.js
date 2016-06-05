import React from 'react';
import Relay from 'react-relay';
import {browserHistory} from 'react-router';
import {SignOut} from '../../mutations';


export default Relay.createContainer(
  ({session}) =>
    <a
      onClick={() => Relay.Store.commitUpdate(
        new SignOut({session}),
        {
          onSuccess: () => browserHistory.push('/'),
        },
      )}
    >
      Sign Out
    </a>
  ,
  {
    fragments: {
      session: () => Relay.QL`
        fragment on Session {
          ${SignOut.getFragment('session')}
        }
      `
    }
  }
);
