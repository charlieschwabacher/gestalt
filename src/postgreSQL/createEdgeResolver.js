// Creates a resolve function for a GraphQL schema given a source type, target
// type, and relationship information.
// @flow

export default function createEdgeResolver(
  from: Object,
  to: Object,
  path: Object,
): () => Promise<Object> {
  return () => (new Promise(r => r({})));
}
