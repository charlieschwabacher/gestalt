// @flow
import fs from 'fs';
import {red} from 'colors/safe';
import session from 'cookie-session';
import graphqlHTTP from 'express-graphql';
import generateGraphQLSchema from 'gestalt-graphql';
import {invariant} from 'gestalt-utils';
import type {ObjectTypeFieldResolutionDefinition, MutationDefinitionFn,
  DatabaseInterfaceDefinitionFn, GestaltServerConfig} from 'gestalt-utils';
import type {Request, Response} from 'express';


export default function gestaltServer(
  config: GestaltServerConfig
): (request: Request, response: Response, next: () => void) => void {
  const {schemaPath, schemaText, objects, mutations, secret, development,
    database: databaseInterfaceDefinitionFn} = config;

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
    databaseInterfaceDefinitionFn != null,
    'Gestalt server requires a database interface to be provided in its ' +
    'configuration'
  );

  invariant(
    secret != null,
    'Gestalt server requries \'secret\' to be provided in outs configuration ' +
    'for secure sessions'
  );

  const {schema, databaseInterface} = generateGraphQLSchema(
    schemaText || (schemaPath && fs.readFileSync(schemaPath, 'utf8')),
    objects || [],
    mutations || [],
    databaseInterfaceDefinitionFn,
    config,
  );

  return (req, res, next) => {
    if (req.path !== '/graphql') {
      next();
      return;
    }

    session({secret, name: 'gestalt'})(req, res, () => {
      graphqlHTTP(request => {
        const {session} = request;
        return {
          schema,
          context: databaseInterface.prepareQueryContext({session}),
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
