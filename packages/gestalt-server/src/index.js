// @flow
import fs from 'fs';
import session from 'cookie-session';
import graphqlHTTP from 'express-graphql';
import {parse} from 'graphql';
import generateGraphQLSchema from 'gestalt-graphql';
import {invariant} from 'gestalt-utils';
import type {ObjectTypeFieldResolutionDefinition, MutationDefinitionFn,
  DatabaseInterface} from 'gestalt-utils';
import type {Request, Response} from 'express';


export default function gestaltServer(config: {
  schemaPath?: string,
  schemaText?: string,
  objects?: ObjectTypeFieldResolutionDefinition[],
  mutations?: MutationDefinitionFn[],
  secret: string,
  databaseInterface: DatabaseInterface,
  development?: boolean,
}): (request: Request, response: Response, next: () => void) => void {
  const {schemaPath, schemaText, objects, mutations, secret, databaseInterface,
    development} = config;

  invariant(
    schemaPath == null || schemaText == null,
    'Configuration including both \'schemaPath\' and \'schemaText\' was ' +
    'provided to gestalt server.  Please use only one.'
  );

  invariant(
    schemaPath != null || schemaText != null,
    'Gestalt server requires either schemaPath or schemaText to be provided ' +
    'in its configuration'
  );

  invariant(
    databaseInterface != null,
    'Gestalt server requires a database interface to be provided in its ' +
    'configuration'
  );

  invariant(
    secret != null,
    'Gestalt server requries \'secret\' to be provided in outs configuration ' +
    'for secure sessions'
  );

  const schema = generateGraphQLSchema(
    schemaText || schemaPath && fs.readFileSync(schemaPath, 'utf8'),
    objects || [],
    mutations || [],
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
