// @flow
import fs from 'fs';
import session from 'cookie-session';
import graphqlHTTP from 'express-graphql';
import {compose} from 'compose-middleware';
import {parse} from 'graphql/language/parser';
import generateGraphQLSchema from './GraphQL';

import type {ObjectTypeFieldResolutionDefinition, MutationDefinitionFn} from
  './types';
import type {Request, Response} from 'express';

const isProduction = process.env.NODE_ENV === 'production';


export default function gestalt(config: {
  schemaPath: string,
  objects: ObjectTypeFieldResolutionDefinition[],
  mutations: MutationDefinitionFn[],
  secret: string,
}): (request: Request, response: Response) => void {
  const {schemaPath, objects, mutations, secret} = config;
  const schemaAST = parse(fs.readFileSync(schemaPath));
  const {schema, database} = generateGraphQLSchema(schemaAST, objects, mutations);

  return compose([
    session({
      secret,
      name: 'gestalt',
      // resave: false,
      // saveUninitialized: true,
    }),
    graphqlHTTP(request => {
      const context = {
        session: request.session,
        loaders: database.generateEdgeLoaders(),
        db: database.db,
      };

      return {
        schema,
        context,
        graphiql: !isProduction,
        formatError: error => ({
          message: error.message,
          details: isProduction ? null : error.stack
        })
      };
    }),
  ]);
}
