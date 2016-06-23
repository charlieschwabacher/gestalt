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
          nonNull: true,
          unique: true
        },
        {
          name: 'id',
          type: 'uuid',
          primaryKey: true,
          nonNull: true,
          unique: false
        },
        {
          name: 'email',
          type: 'text',
          primaryKey: false,
          nonNull: true,
          unique: true
        },
        {
          name: 'password_hash',
          type: 'text',
          primaryKey: false,
          nonNull: true,
          unique: false
        },
        {
          name: 'created_at',
          type: 'timestamp without time zone',
          primaryKey: false,
          nonNull: true,
          unique: false
        },
        {
          name: 'location',
          type: 'jsonb',
          primaryKey: false,
          nonNull: false,
          unique: false
        },
        {
          name: 'first_name',
          type: 'text',
          primaryKey: false,
          nonNull: false,
          unique: false
        },
        {
          name: 'last_name',
          type: 'text',
          primaryKey: false,
          nonNull: false,
          unique: false
        }
      ],
      constraints: []
    },
    {
      name: 'posts',
      columns: [
        {
          name: 'seq',
          type: 'SERIAL',
          primaryKey: false,
          nonNull: true,
          unique: true
        },
        {
          name: 'id',
          type: 'uuid',
          primaryKey: true,
          nonNull: true,
          unique: false
        },
        {
          name: 'title',
          type: 'text',
          primaryKey: false,
          nonNull: true,
          unique: true
        },
        {
          name: 'subtitle',
          type: 'text',
          primaryKey: false,
          nonNull: false,
          unique: false
        },
        {
          name: 'text',
          type: 'text',
          primaryKey: false,
          nonNull: false,
          unique: false
        },
        {
          name: 'images',
          type: 'jsonb',
          primaryKey: false,
          nonNull: false,
          unique: false
        },
        {
          name: 'created_at',
          type: 'timestamp without time zone',
          primaryKey: false,
          nonNull: true,
          unique: false
        },
        {
          name: 'authored_by_user_id',
          type: 'uuid',
          primaryKey: false,
          nonNull: true,
          unique: false,
          references: {
            table: 'users',
            column: 'id'
          }
        }
      ],
      constraints: []
    },
    {
      name: 'pages',
      columns: [
        {
          name: 'seq',
          type: 'SERIAL',
          primaryKey: false,
          nonNull: true,
          unique: true,
        },
        {
          name: 'id',
          type: 'uuid',
          primaryKey: true,
          nonNull: true,
          unique: false,
        },
        {
          name: 'title',
          type: 'text',
          primaryKey: false,
          nonNull: true,
          unique: false,
        },
        {
          name: 'content',
          type: 'text',
          primaryKey: false,
          nonNull: false,
          unique: false,
        },
        {
          name: 'created_by_user_id',
          type: 'uuid',
          primaryKey: false,
          nonNull: true,
          unique: false,
          references: {
            table: 'users',
            column: 'id',
          },
        }
      ],
      constraints: [],
    },
    {
      name: 'user_followed_users',
      columns: [
        {
          name: 'user_id',
          type: 'uuid',
          nonNull: true,
          primaryKey: false,
          unique: false,
          references: {
            table: 'users',
            column: 'id',
          },
        },
        {
          name: 'followed_user_id',
          type: 'uuid',
          nonNull: true,
          primaryKey: false,
          unique: false,
          references: {
            table: 'users',
            column: 'id',
          },
        },
      ],
      constraints: [
        {
          type: 'UNIQUE',
          columns: [
            'user_id',
            'followed_user_id',
          ],
        },
      ],
    },
  ],
  indices: [
    {
      table: 'users',
      columns: [
        'first_name',
      ],
    },
    {
      table: 'pages',
      columns: [
        'title',
      ],
    },
    {
      table: 'user_followed_users',
      columns: [
        'followed_user_id',
      ],
    },
    {
      table: 'posts',
      columns: [
        'authored_by_user_id',
      ],
    },
    {
      table: 'pages',
      columns: [
        'created_by_user_id',
      ],
    },
  ],
};

export default schema;
