// @flow

import type {DatabaseSchema} from '../../src/PostgreSQL/types';

const schema: DatabaseSchema = {
  tables: [
    {
      name: 'users',
      columns: [
        {
          name: 'id',
          type: 'uuid',
          primaryKey: true,
          nonNull: true,
        },
        {
          name: 'email',
          type: 'varchar(255)',
          primaryKey: false,
          nonNull: true,
        },
        {
          name: 'password_hash',
          type: 'varchar(255)',
          primaryKey: false,
          nonNull: true,
        },
        {
          name: 'created_at',
          type: 'timestamp',
          primaryKey: false,
          nonNull: true,
        },
        {
          name: 'first_name',
          type: 'varchar(255)',
          primaryKey: false,
          nonNull: false,
        },
        {
          name: 'last_name',
          type: 'varchar(255)',
          primaryKey: false,
          nonNull: false,
        },
      ]
    },
    // {
    //   name: 'user_followed_users',
    //   columns: [
    //     {
    //       name: 'user_id',
    //       type: 'uuid',
    //       primaryKey: false,
    //       nonNull: true,
    //       references: {
    //         table: 'users',
    //         column: 'id',
    //       }
    //     },
    //     {
    //       name: 'followed_id',
    //       type: 'uuid',
    //       primaryKey: false,
    //       nonNull: true,
    //       references: {
    //         table: 'users',
    //         column: 'id',
    //       }
    //     }
    //   ],
    //   constraints: [
    //     {
    //       type: 'unique',
    //       columns: ['user_id', 'followed_id']
    //     }
    //   ]
    // },
    {
      name: 'posts',
      columns: [
        {
          name: 'id',
          type: 'uuid',
          primaryKey: true,
          nonNull: true,
        },
        {
          name: 'title',
          type: 'varchar(255)',
          primaryKey: false,
          nonNull: true,
        },
        {
          name: 'text',
          type: 'text',
          primaryKey: false,
          nonNull: true,
        },
        {
          name: 'created_at',
          type: 'timestamp',
          primaryKey: false,
          nonNull: true,
        },
        // {
        //   name: 'authored_id',
        //   type: 'uuid',
        //   primaryKey: false,
        //   nonNull: true,
        //   references: {
        //     table: 'users',
        //     column: 'id',
        //   }
        // },
      ],
    },
    {
      name: 'comments',
      columns: [
        {
          name: 'id',
          type: 'uuid',
          primaryKey: true,
          nonNull: true,
        },
        {
          name: 'text',
          type: 'text',
          primaryKey: false,
          nonNull: true,
        },
        {
          name: 'created_at',
          type: 'timestamp',
          primaryKey: false,
          nonNull: true,
        },
        // {
        //   name: 'authored_id',
        //   type: 'uuid',
        //   primaryKey: false,
        //   nonNull: true,
        //   references: {
        //     table: 'users',
        //     column: 'id',
        //   }
        // },
        // {
        //   name: 'comment_on_id',
        //   type: 'uuid',
        //   primaryKey: false,
        //   nonNull: true,
        //   references: {
        //     table: 'posts',
        //     column: 'id',
        //   }
        // },
      ],
    },
  ],
  indices: [
    {
      table: 'users',
      columns: ['id'],
    },
    // {
    //   table: 'user_followed_users',
    //   columns: ['user_id'],
    // },
    // {
    //   table: 'user_followed_users',
    //   columns: ['followed_id'],
    // },
    {
      table: 'posts',
      columns: ['id'],
    },
    // {
    //   table: 'posts',
    //   columns: ['authored_id'],
    // },
    {
      table: 'comments',
      columns: ['id'],
    },
    // {
    //   table: 'comments',
    //   columns: ['authored_id'],
    // },
    // {
    //   table: 'comments',
    //   columns: ['comment_on_id'],
    // },
  ],
};

export default schema;
