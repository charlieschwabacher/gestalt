// @flow
import fs from 'fs';
import session from 'express-session';
import graphqlHTTP from 'express-graphql';
import {compose} from 'compose-middleware';
import {parse} from 'graphql/language/parser';
import generateGraphQLSchema from './GraphQL';

import type {ObjectTypeFieldResolutionDefinition, GraphQLFieldConfig} from
  './types';
import type {Request, Response} from 'express';

const isProduction = process.env.NODE_ENV === 'production';


export default function gestalt(config: {
  schemaPath: string,
  objects: ObjectTypeFieldResolutionDefinition[],
  mutations: GraphQLFieldConfig[],
  secret: string,
}): (request: Request, response: Response) => void {
  const {schemaPath, objects, mutations, secret} = config;
  const schemaAST = parse(fs.readFileSync(schemaPath));
  const {schema, database} = generateGraphQLSchema(schemaAST, objects, mutations);

  return compose([
    session({
      secret,
      resave: false,
      saveUninitialized: false,
    }),
    graphqlHTTP(request => {
      const context = {
        session: request.session,
        loaders: database.generateEdgeLoaders(),
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
