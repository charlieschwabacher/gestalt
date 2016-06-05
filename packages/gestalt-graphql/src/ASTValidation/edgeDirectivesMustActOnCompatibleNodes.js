// @flow
// Relationship directives cannot be used on fields with list or scalar types.
// They can only be used w/ object types that implement the Node interface.
// Non null types are allowed, union and interface types are allowed as long as
// all possible types implement Node.

import type {Document} from 'gestalt-utils';

export default function edgeDirectivesMustActOnCompatibleNodes(
  ast: Document,
): void {

}
