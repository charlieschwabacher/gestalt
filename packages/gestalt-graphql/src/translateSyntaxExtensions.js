// @flow

// the regex below matches singular or plural arrows in either direction,
// followed by typenames, repeating any number of times.
// ie:
// =FOLLOWED=>User=AUTHORED=>Post
// or:
// <-AUTHORED-User

import {invariant} from 'gestalt-utils';

const ARROW_MATCHER =
  /:[ \t]*(?:(?:<([=-])[ \t]*[A-Z_]+[ \t]*\1|([=-])[ \t]*[A-Z_]+[ \t]*\2>)[ \t]*[A-Z][a-zA-Z0-9]*!?[ \t]*)+/g;

export default function translateSyntaxExtensions(schemaText: string): string {
  const translatedSchema = schemaText.replace(
    ARROW_MATCHER,
    (arrow: string): string => {
      const normalArrow = arrow.replace(/[ \t:]/g, '');

      const match = normalArrow.match(/[A-Z][a-zA-Z0-9]+!?$/);
      invariant(match != null, 'error parsing schema');
      const finalType = match[0];

      const path = normalArrow.slice(0, normalArrow.length - finalType.length);

      return `: ${finalType} @relationship(path: "${path}")`;
    }
  );
  return translatedSchema;
}
