import assert from 'assert';
import fs from 'fs';
import databaseInfoFromAST from '../src/databaseInfoFromAST';
import {parse} from 'graphql';
import expectedRelationships from './fixtures/expectedRelationships';

const schemaPath = `${__dirname}/fixtures/schema.graphql`;
const schemaText = fs.readFileSync(schemaPath, 'utf8');
const ast = parse(schemaText);
const schemaInfo = databaseInfoFromAST(ast);

describe('databaseInfoFromAST', () => {
  it('should include object mapping node types by name', () => {
    assert.deepEqual(
      Object.keys(schemaInfo.objectTypes),
      ['User', 'Post', 'Comment'],
    );
  });

  it('should include object mapping enum values by type name', () => {
    assert.deepEqual(
      schemaInfo.enumTypes,
      {
        PostType: ['ESSAY', 'REVIEW', 'STORY', 'POEM'],
      },
    );
  });

  it('should include object mapping members by polymorphic type name', () => {
    assert.deepEqual(
      schemaInfo.polymorphicTypes,
      {
        Text: ['Post', 'Comment'],
        Content: ['Post', 'Comment'],
      },
    );
  });

  it('should include array of relationships', () => {
    assert.deepEqual(
      schemaInfo.relationships,
      expectedRelationships,
    );
  });
});
