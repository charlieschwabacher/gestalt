import {SchemaDefinition} from './astTypes';

const ast: SchemaDefinition = {
  typeDefinitions: [
    {
      definitionType: 'scalar',
      name: 'Date',
    },
    {
      definitionType: 'scalar',
      name: 'Text',
    },
    {
      definitionType: 'enum',
      values: [
        'MONDAY',
        'TUESDAY',
        'WEDNESDAY',
        'THURSDAY',
        'FRIDAY',
        'SATURDAY',
        'SUNDAY',
      ],
    },
    {
      definitionType: 'object',
      name: 'Session',
      interfaces: [],
      fields: [
        {
          fieldType: 'scalar',
          name: 'currentUser',
          type: 'User',
          nonNull: false,
          computed: false,
          private: false,
        },
      ],
    },
    {
      definitionType: 'object',
      name: 'User',
      interfaces: 'Node',
      fields: [
        {
          fieldType: 'scalar',
          name: 'id',
          type: 'ID',
          nonNull: true,
          computed: false,
          private: false,
        },
        {
          fieldType: 'scalar',
          name: 'email',
          type: 'String',
          nonNull: true,
          computed: false,
          private: false,
        },
        {
          fieldType: 'scalar',
          name: 'passwordHash',
          type: 'String',
          nonNull: true,
          computed: false,
          private: true,
        },
        {
          fieldType: 'scalar',
          name: 'firstName',
          type: 'String',
          nonNull: false,
          computed: false,
          private: false,
        },
        {
          fieldType: 'scalar',
          name: 'firstName',
          type: 'String',
          nonNull: false,
          computed: false,
          private: false,
        },
        {
          fieldType: 'scalar',
          name: 'lastName',
          type: 'String',
          nonNull: false,
          computed: false,
          private: false,
        },
        {
          fieldType: 'scalar',
          name: 'fullName',
          type: 'String',
          nonNull: false,
          computed: true,
          private: false,
        },
        {
          fieldType: 'scalar',
          name: 'createdAt',
          type: 'Date',
          nonNull: true,
          computed: false,
          private: false,
        },
        {
          fieldType: 'relationship',
          name: 'followedUsers',
          path: [
            {
              type: 'User',
              label: 'FOLLOWED',
              direction: 'out',
            },
          ],
          plural: true,
          nonNull: false,
        },
        {
          fieldType: 'relationship',
          name: 'followers',
          path: [
            {
              type: 'User',
              label: 'FOLLOWED',
              direction: 'in',
            },
          ],
          plural: true,
          nonNull: false,
        },
        {
          fieldType: 'relationship',
          name: 'posts',
          path: [
            {
              type: 'Post',
              label: 'AUTHORED',
              direction: 'out',
            },
          ],
          plural: true,
          nonNull: false,
        },
        {
          fieldType: 'relationship',
          name: 'comments',
          path: [
            {
              type: 'Comment',
              label: 'AUTHORED',
              direction: 'out',
            },
          ],
          plural: true,
          nonNull: false,
        },
        {
          fieldType: 'relationship',
          name: 'feed',
          path: [
            {
              type: 'User',
              label: 'FOLLOWED',
              direction: 'out',
            },
            {
              type: 'Post',
              label: 'AUTHORED',
              direction: 'out',
            },
          ],
          plural: true,
          nonNull: false,
        },
      ],
    },
    {
      definitionType: 'object',
      name: 'Post',
      interfaces: ['Node'],
      fields: [
        {
          fieldType: 'scalar',
          name: 'id',
          type: 'ID',
          nonNull: true,
          computed: false,
          private: false,
        },
        {
          fieldType: 'scalar',
          name: 'title',
          type: 'String',
          nonNull: true,
          computed: false,
          private: false,
        },
        {
          fieldType: 'scalar',
          name: 'text',
          type: 'Text',
          nonNull: true,
          computed: false,
          private: false,
        },
        {
          fieldType: 'scalar',
          name: 'createdAt',
          type: 'Date',
          nonNull: true,
          computed: false,
          private: false,
        },
        {
          fieldType: 'relationship',
          name: 'author',
          path: [
            {
              type: 'User',
              label: 'AUTHORED',
              direction: 'in',
            },
          ],
          plural: false,
          nonNull: true,
        },
        {
          fieldType: 'relationship',
          name: 'comments',
          path: [
            {
              type: 'Comment',
              label: 'COMMENT_ON',
              direction: 'in',
            },
          ],
          plural: true,
          nonNull: false,
        },
      ],
    },
    {
      definitionType: 'object',
      name: 'Comment',
      interfaces: ['Node'],
      fields: [
        {
          fieldType: 'scalar',
          name: 'id',
          type: 'ID',
          nonNull: true,
          computed: false,
          private: false,
        },
        {
          fieldType: 'scalar',
          name: 'text',
          type: 'Text',
          nonNull: true,
          computed: false,
          private: false,
        },
        {
          fieldType: 'scalar',
          name: 'createdAt',
          type: 'Date',
          nonNull: true,
          computed: false,
          private: false,
        },
        {
          fieldType: 'relationship',
          name: 'author',
          path: [
            {
              type: 'User',
              label: 'AUTHORED',
              direction: 'in',
            },
          ],
          plural: false,
          nonNull: true,
        },
        {
          fieldType: 'relationship',
          name: 'subject',
          path: [
            {
              type: 'Post',
              label: 'COMMENT_ON',
              direction: 'out',
            },
          ],
          plural: false,
          nonNull: true,
        },
      ],
    }
  ],
};

export default ast;
