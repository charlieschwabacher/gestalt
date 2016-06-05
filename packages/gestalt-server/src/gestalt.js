// @flow
import fs from 'fs';
import session from 'cookie-session';
import graphqlHTTP from 'express-graphql';
import {parse} from 'graphql';
import {generateGraphQLSchema} from 'gestalt-graphql';
import type {ObjectTypeFieldResolutionDefinition, MutationDefinitionFn,
  DatabaseInterface} from 'gestalt-utils';
import type {Request, Response} from 'express';


export default function gestalt(config: {
  schemaPath: string,
  objects: ObjectTypeFieldResolutionDefinition[],
  mutations: MutationDefinitionFn[],
  secret: string,
  databaseInterface: DatabaseInterface,
  development: boolean,
}): (request: Request, response: Response, next: () => void) => void {
  const {schemaPath, objects, mutations, secret, databaseInterface,
    development} = config;
  const schema = generateGraphQLSchema(
    schemaPath,
    objects,
    mutations,
    databaseInterface,
  );

  return (req, res, next) => {
    if (req.path !== '/graphql') {
      next();
      return;
    }

    session({secret, name: 'gestalt'})(req, res, () => {
      graphqlHTTP(request => {
        return {
          schema,
          context: {
            db: databaseInterface.db,
            session: request.session,
            loaders: databaseInterface.generateRelationshipLoaders(),
          },
          graphiql: development,
          formatError: error => {
            return {
              message: error.message,
              details: development ? error.stack : null
            };
          },
        };
      })(req, res, next);
    });
  };
}
