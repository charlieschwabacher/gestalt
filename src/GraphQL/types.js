// @flow

import type {
  GraphQLFieldConfig,
  InputObjectConfigFieldMap,
  GraphQLFieldConfigMap,
  GraphQLResolveInfo
} from 'graphql';

type mutationFn =
  (object: Object, ctx: Object, info: GraphQLResolveInfo) => Object |
  (object: Object, ctx: Object, info: GraphQLResolveInfo) => Promise<Object>;

export type MutationConfig = {
  name: string,
  inputFields: InputObjectConfigFieldMap,
  outputFields: GraphQLFieldConfigMap,
  mutateAndGetPayload: mutationFn,
}
