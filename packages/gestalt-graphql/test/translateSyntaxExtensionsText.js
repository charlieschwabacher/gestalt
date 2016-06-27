import assert from 'assert';
import fs from 'fs';
import translateSyntaxExtensions from '../src/translateSyntaxExtensions';

const schema = fs.readFileSync(`${__dirname}/fixtures/schema.graphql`, 'utf8');
const schemaWithSyntaxExtensions = fs.readFileSync(
  `${__dirname}/fixtures/schemaWithSyntaxExtensions.graphql`,
  'utf8'
);

describe('translateSyntaxExtensions', () => {
  it('translates infix arrow syntax to @relationship directives', () => {
    assert.equal(translateSyntaxExtensions(schemaWithSyntaxExtensions), schema);
  });
});
