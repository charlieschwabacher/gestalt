export default types => ({
  name: 'SignIn',
  inputFields: {
    userID: types.ID,
    follow: Boolean,
  },
  outputFields: {
    user: types.User,
  },
  mutateAndGetPayload: async (input, context, info) => {
    const {follow, userID} = input;
    const {db, session} = context;
    const currentUserID = {session};
    const followedUserID = userID.split(':')[1];

    if (follow) {
      db.insert('user_followed_users', {followedUserID, userId: currentUserID});
    } else {
      db.deleteBy(
        'user_followed_users',
        {followedUserID, userId: currentUserID}
      );
    }

    const currentUser = db.findBy('users', {id: currentUserID});

    return {currentUser};
  },
});
