// @flow
// '@relationship' directives must and can only have the 'path' argument.
// '@hidden', '@virtual', '@index', and '@unique' directives may not have
// arguments.

import type {Document} from 'gestalt-utils';

export default function directivesMustHaveExpectedArguments(
  ast: Document,
): void {

}
