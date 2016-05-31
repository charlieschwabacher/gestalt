import Relay from 'react-relay';

export const session = {
  session: () => Relay.QL`
    query { session }
  `,
};

export const node = {
  node: () => Relay.QL`
    query { node(id: $id) }
  `,
};
