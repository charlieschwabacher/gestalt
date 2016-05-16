// @flow
import {GraphQLObjectType, GraphQLObjectTypeConfig, GraphQLType} from 'graphql';
import {globalIdField} from 'graphql-relay';
import Gestalt from './Gestalt';
import nodeInterface from './nodeInterface';
import invariant from './util/invariant';
import resolveMaybeThunk from './util/resolveMaybeThunk';

export type ObjectTypeEdgeConfig = {
  type: GraphQLType,
  path: [
    {label: string, direction: 'in' | 'out'}
  ]
};

export type ObjectTypeEdgesConfig = {
  [key: string]: ObjectTypeEdgeConfig
};

export type ObjectTypeConfig = GraphQLObjectTypeConfig & {
  edges: ObjectTypeEdgesConfig | () => ObjectTypeEdgesConfig
};

export default class ObjectType extends GraphQLObjectType {
  constructor(config: ObjectTypeConfig) {
    const {name, interfaces, edges, fields} = config;

    // create fields for edges
    config.fields = () => {
      const resolvedFields = resolveMaybeThunk(fields);
      const resolvedEdges = resolveMaybeThunk(edges);

      if (resolvedEdges) {
        for (const edgeName in resolvedEdges) {
          invariant(
            !resolvedFields[edgeName],
            `duplicate field ${edgeName} on ${name}`
          );

          resolvedFields[edgeName] = { type: resolvedEdges[edgeName].type };
        }
      }

      // ensure global id field
      if (!fields.id) {
        resolvedFields.id = globalIdField(name);
      }

      return resolvedFields;
    };

    // add node interface
    if (!interfaces) {
      config.interfaces = [nodeInterface];
    } else if (!interfaces.includes(nodeInterface)) {
      interfaces.push(nodeInterface);
    }

    // call super with updated config
    super(config);

    Gestalt.registerObjectType(this, config);
  }
}
