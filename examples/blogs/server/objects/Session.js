export default {
  name: 'Session',
  fields: {
    id: () => '!',
    currentUser: (obj, args, context) =>
      obj.currentUserID && context.db.findBy('users', {id: obj.currentUserID})
    ,
  },
};
