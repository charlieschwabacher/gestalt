export default {
  name: 'Session',
  fields: {
    currentUser: (obj, args, context) =>
      obj.currentUserID && context.db.findBy('users', {id: obj.currentUserID}),
    suggestedUsers: (obj, args, context) =>
      context.db.query('SELECT * FROM users ORDER BY seq DESC LIMIT 10'),
  },
};
