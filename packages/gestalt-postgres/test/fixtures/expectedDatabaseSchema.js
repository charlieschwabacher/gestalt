// @flow

import type {DatabaseSchema} from 'gestalt-utils';

const schema: DatabaseSchema = {
  extensions: [
    'pgcrypto',
  ],
  tables: [
    {
      name: 'users',
      columns: [
        {
          name: 'seq',
          type: 'SERIAL',
          primaryKey: false,
          unique: true,
          nonNull: true,
          defaultValue: null,
          references: null,
        },
        {
          name: 'id',
          type: 'uuid',
          primaryKey: true,
          unique: false,
          nonNull: true,
          defaultValue: 'gen_random_uuid()',
          references: null,
        },
        {
          name: 'email',
          type: 'text',
          primaryKey: false,
          unique: true,
          nonNull: true,
          defaultValue: null,
          references: null,
        },
        {
          name: 'password_hash',
          type: 'text',
          primaryKey: false,
          unique: false,
          nonNull: true,
          defaultValue: null,
          references: null,
        },
        {
          name: 'created_at',
          type: 'timestamp without time zone',
          primaryKey: false,
          unique: false,
          nonNull: true,
          defaultValue: null,
          references: null,
        },
        {
          name: 'location',
          type: 'jsonb',
          primaryKey: false,
          unique: false,
          nonNull: false,
          defaultValue: null,
          references: null,
        },
        {
          name: 'favorite_food',
          type: 'jsonb',
          primaryKey: false,
          unique: false,
          nonNull: false,
          defaultValue: null,
          references: null,
        },
        {
          name: 'first_name',
          type: 'text',
          primaryKey: false,
          unique: false,
          nonNull: false,
          defaultValue: null,
          references: null,
        },
        {
          name: 'last_name',
          type: 'text',
          primaryKey: false,
          unique: false,
          nonNull: false,
          defaultValue: null,
          references: null,
        },
      ],
      constraints: [],
    },
    {
      name: 'posts',
      columns: [
        {
          name: 'seq',
          type: 'SERIAL',
          primaryKey: false,
          unique: true,
          nonNull: true,
          defaultValue: null,
          references: null,
        },
        {
          name: 'id',
          type: 'uuid',
          primaryKey: true,
          unique: false,
          nonNull: true,
          defaultValue: 'gen_random_uuid()',
          references: null,
        },
        {
          name: 'title',
          type: 'text',
          primaryKey: false,
          unique: false,
          nonNull: true,
          defaultValue: null,
          references: null,
        },
        {
          name: 'text',
          type: 'text',
          primaryKey: false,
          unique: false,
          nonNull: true,
          defaultValue: null,
          references: null,
        },
        {
          name: 'created_at',
          type: 'timestamp without time zone',
          primaryKey: false,
          unique: false,
          nonNull: true,
          defaultValue: null,
          references: null,
        },
        {
          name: 'authored_by_user_id',
          type: 'uuid',
          primaryKey: false,
          unique: false,
          nonNull: true,
          defaultValue: null,
          references: {
            table: 'users',
            column: 'id',
          }
        },
      ],
      constraints: [],
    },
    {
      name: 'comments',
      columns: [
        {
          name: 'seq',
          type: 'SERIAL',
          primaryKey: false,
          unique: true,
          nonNull: true,
          defaultValue: null,
          references: null,
        },
        {
          name: 'id',
          type: 'uuid',
          primaryKey: true,
          unique: false,
          nonNull: true,
          defaultValue: 'gen_random_uuid()',
          references: null,
        },
        {
          name: 'text',
          type: 'text',
          primaryKey: false,
          unique: false,
          nonNull: true,
          defaultValue: null,
          references: null,
        },
        {
          name: 'created_at',
          type: 'timestamp without time zone',
          primaryKey: false,
          unique: false,
          nonNull: true,
          defaultValue: null,
          references: null,
        },
        {
          name: 'authored_by_user_id',
          type: 'uuid',
          primaryKey: false,
          unique: false,
          nonNull: false,
          defaultValue: null,
          references: {
            table: 'users',
            column: 'id',
          }
        },
        {
          name: 'inspired_by_post_id',
          type: 'uuid',
          primaryKey: false,
          unique: false,
          nonNull: true,
          defaultValue: null,
          references: {
            table: 'posts',
            column: 'id',
          }
        },
      ],
      constraints: [],
    },
    {
      name: 'user_followed_users',
      columns: [
        {
          name: 'user_id',
          type: 'uuid',
          primaryKey: false,
          unique: false,
          nonNull: true,
          defaultValue: null,
          references: {
            table: 'users',
            column: 'id',
          }
        },
        {
          name: 'followed_user_id',
          type: 'uuid',
          primaryKey: false,
          unique: false,
          nonNull: true,
          defaultValue: null,
          references: {
            table: 'users',
            column: 'id',
          }
        }
      ],
      constraints: [
        {
          type: 'UNIQUE',
          columns: ['user_id', 'followed_user_id']
        }
      ]
    },
  ],
  indices: [
    {
      table: 'posts',
      columns: ['title'],
    },
    {
      table: 'user_followed_users',
      columns: ['followed_user_id'],
    },
    {
      table: 'posts',
      columns: ['authored_by_user_id'],
    },
    {
      table: 'comments',
      columns: ['authored_by_user_id'],
    },
    {
      table: 'comments',
      columns: ['inspired_by_post_id'],
    },
  ],
};

export default schema;
