export type SchemaDefinition = {
  typeDefinitions: [TypeDefinition],
};

export type TypeDefinition =
  ScalarTypeDefinition |
  ObjectTypeDefinition |
  InterfaceTypeDefinition |
  UnionTypeDefinition |
  EnumTypeDefinition |
  InputObjectTypeDefinition;

export type ScalarTypeDefinition = {
  definitionType: 'scalar',
  name: string,
};

export type ObjectTypeDefinition = {
  definitionType: 'object',
  name: string,
  interfaces: [string],
  fields: [ObjectFieldDefinition],
};

export type InterfaceTypeDefinition = {
  definitionType: 'interface',
  name: string,
  fields: [ObjectFieldDefinition]
};

export type UnionTypeDefintiion = {
  definitionType: 'union',
  name: string,
  members: [string]
}

export type EnumTypeDefintion = {
  definitionType: 'enum',
  name: string,
  values: [string]
}

export type InputObjectTypeDefinition = {
  definitionType: 'inputObject',
  name: string,
  fields: [{
    name: string,
    type: string
  }],
}

export type ObjectFieldDefinition =
  ObjectScalarFieldDefinition |
  ObjectRelationshipFieldDefinition;

export type ObjectScalarFieldDefinition = {
  fieldType: 'scalar',
  name: string,
  type: string,
  nonNull: boolean,
  computed: boolean,
  private: boolean,
};

export type ObjectRelationshipFieldDefinition = {
  fieldType: 'relationship',
  name: string,
  path: [{
    type: string,
    label: string,
    direction: 'in' | 'out',
  }],
  plural: boolean,
  nonNull: boolean,
};
