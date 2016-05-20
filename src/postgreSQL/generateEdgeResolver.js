// Creates a resolve function for a GraphQL schema given a source type, target
// type, and relationship information.
// @flow

import type {Edge, EdgeSegmentDescription} from '../types';

export default function generateEdgeResolver(
  segmentDescriptionsBySignature: {[key: string]: EdgeSegmentDescription},
  edge: Edge,
): () => Promise<Object> {
  return () => (new Promise(r => r({})));
}
