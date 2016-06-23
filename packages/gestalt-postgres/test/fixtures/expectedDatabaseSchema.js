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
        },
        {
          name: 'id',
          type: 'uuid',
          primaryKey: true,
          unique: false,
          nonNull: true,
        },
        {
          name: 'email',
          type: 'text',
          primaryKey: false,
          unique: true,
          nonNull: true,
        },
        {
          name: 'password_hash',
          type: 'text',
          primaryKey: false,
          unique: false,
          nonNull: true,
        },
        {
          name: 'created_at',
          type: 'timestamp without time zone',
          primaryKey: false,
          unique: false,
          nonNull: true,
        },
        {
          name: 'location',
          type: 'jsonb',
          primaryKey: false,
          unique: false,
          nonNull: false,
        },
        {
          name: 'favorite_food',
          type: 'jsonb',
          primaryKey: false,
          unique: false,
          nonNull: false,
        },
        {
          name: 'first_name',
          type: 'text',
          primaryKey: false,
          unique: false,
          nonNull: false,
        },
        {
          name: 'last_name',
          type: 'text',
          primaryKey: false,
          unique: false,
          nonNull: false,
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
        },
        {
          name: 'id',
          type: 'uuid',
          primaryKey: true,
          unique: false,
          nonNull: true,
        },
        {
          name: 'title',
          type: 'text',
          primaryKey: false,
          unique: false,
          nonNull: true,
        },
        {
          name: 'text',
          type: 'text',
          primaryKey: false,
          unique: false,
          nonNull: true,
        },
        {
          name: 'created_at',
          type: 'timestamp without time zone',
          primaryKey: false,
          unique: false,
          nonNull: true,
        },
        {
          name: 'authored_by_user_id',
          type: 'uuid',
          primaryKey: false,
          unique: false,
          nonNull: true,
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
        },
        {
          name: 'id',
          type: 'uuid',
          primaryKey: true,
          unique: false,
          nonNull: true,
        },
        {
          name: 'text',
          type: 'text',
          primaryKey: false,
          unique: false,
          nonNull: true,
        },
        {
          name: 'created_at',
          type: 'timestamp without time zone',
          primaryKey: false,
          unique: false,
          nonNull: true,
        },
        {
          name: 'authored_by_user_id',
          type: 'uuid',
          primaryKey: false,
          unique: false,
          nonNull: false,
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
