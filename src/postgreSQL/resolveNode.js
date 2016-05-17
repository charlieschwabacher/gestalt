// Retreives a Node given its global ID
// @flow

export default function resolveNode(nodeId: string): () => Promise<Object> {
  return () => (new Promise(r => r({})));
}
