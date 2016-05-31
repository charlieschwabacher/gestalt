export default {
  name: 'Session',
  fields: {
    id: () => '!',
    currentUser: (obj, args, context) =>
      obj.currentUserId && context.db.findBy('users', {id: obj.currentUserId})
    ,
  },
};
