// define seed nodes

export const nodes = {};

export const users = nodes.User = [
  // test user
  {
    firstName: 'Chester',
    lastName: 'Tester',
    email: 'test@test.com',
    id: '!',
    createdAt: (new Date).getTime(),
  },

  // following
  {
    email: 'amesingham@test.com',
    firstName: 'Ames',
    lastName: 'Ingham',
    createdAt: (new Date).getTime(),
  },
  {
    email: 'pauljohanssen@test.com',
    firstName: 'Paul',
    lastName: 'Johanssen',
    createdAt: (new Date).getTime(),
  },
  {
    email: 'karenkramer@test.com',
    firstName: 'Karen',
    lastName: 'Kramer',
    createdAt: (new Date).getTime(),
  },

  // followers
  {
    email: 'mariacastillo@test.com',
    firstName: 'Robert & Maria',
    lastName: 'Castillo',
    createdAt: (new Date).getTime(),
  },
  {
    email: 'jennifertebbs@test.com',
    firstName: 'Jennifer',
    lastName: 'Tebbs',
    createdAt: (new Date).getTime(),
  },
  {
    email: 'petersalas@test.com',
    firstName: 'Peter',
    lastName: 'Salas',
    createdAt: (new Date).getTime(),
  },
];

export const posts = nodes.Post = [
  {
    title: 'Hello',
    text: 'Hello world!',
    createdAt: (new Date).getTime(),
  },
  {
    title: 'Hello',
    text: 'Hello world!',
    createdAt: (new Date).getTime(),
  },
  {
    title: 'Hello',
    text: 'Hello world!',
    createdAt: (new Date).getTime(),
  },
  {
    title: 'Hello',
    text: 'Hello world!',
    createdAt: (new Date).getTime(),
  },
  {
    title: 'Hello',
    text: 'Hello world!',
    createdAt: (new Date).getTime(),
  },
  {
    title: 'Hello',
    text: 'Hello world!',
    createdAt: (new Date).getTime(),
  },
];

export const comments = nodes.Comment = [
  {
    text: 'Great post!',
    createdAt: (new Date).getTime(),
  },
  {
    text: 'No one!',
    createdAt: (new Date).getTime(),
  },
  {
    text: 'This is great!',
    createdAt: (new Date).getTime(),
  },
  {
    text: 'Very interesting!',
    createdAt: (new Date).getTime(),
  },
];

// assign ids to nodes

Object.keys(nodes).forEach(type =>
  nodes[type].forEach(node => {
    if (node.id == null) {
      node.id = Math.random().toString(36).slice(2);
    }
  })
);



// define seed edges

export const edges = [];

edges.push([users[0], 'FOLLOWED', users[1]]);
edges.push([users[0], 'FOLLOWED', users[2]]);
edges.push([users[0], 'FOLLOWED', users[3]]);
edges.push([users[4], 'FOLLOWED', users[0]]);
edges.push([users[5], 'FOLLOWED', users[0]]);
edges.push([users[6], 'FOLLOWED', users[0]]);

edges.push([users[0], 'AUTHORED', posts[0]]);
edges.push([users[0], 'AUTHORED', posts[1]]);
edges.push([users[1], 'AUTHORED', posts[2]]);
edges.push([users[1], 'AUTHORED', posts[3]]);
edges.push([users[2], 'AUTHORED', posts[4]]);
edges.push([users[3], 'AUTHORED', posts[5]]);

edges.push([users[0], 'LIKED', posts[2]]);
edges.push([users[0], 'LIKED', posts[4]]);
edges.push([users[1], 'LIKED', posts[5]]);

edges.push([users[4], 'AUTHORED', comments[0]]);
edges.push([users[5], 'AUTHORED', comments[1]]);
edges.push([users[0], 'AUTHORED', comments[2]]);
edges.push([users[0], 'AUTHORED', comments[3]]);

edges.push([comments[0], 'COMMENT_ON', posts[0]]);
edges.push([comments[1], 'COMMENT_ON', posts[0]]);
edges.push([comments[2], 'COMMENT_ON', posts[2]]);
edges.push([comments[3], 'COMMENT_ON', posts[3]]);
