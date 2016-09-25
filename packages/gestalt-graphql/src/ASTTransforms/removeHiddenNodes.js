// @flow

import type {Document, Node} from 'gestalt-utils';

export default function removeHiddenNodes(ast: Document): void {
  // remove hidden types
  ast.definitions = ast.definitions.filter(visible);

  // remove hidden fields
  ast.definitions.forEach(definition => {
    if (definition.fields) {
      definition.fields = definition.fields.filter(visible);
    }
  });
}

function visible(node: Node): boolean {
  return node.directives && !node.directives.some(
    directive => directive.name.value === 'hidden'
  );
}
