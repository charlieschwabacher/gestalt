export default types => ({
  name: 'UnfollowUser',
  inputFields: {
    userID: types.ID,
    follow: types.Boolean,
  },
  outputFields: {
    user: types.User,
    currentUser: types.User
  },
  mutateAndGetPayload: async (input, context) => {
    const {db, session} = context;
    const {currentUserID} = session;
    const followedUserID = input.userID.split(':')[1];

    await db.deleteBy(
      'user_followed_users',
      {userId: currentUserID, followedUserID}
    );

    const currentUser = await db.findBy('users', {id: currentUserID});
    const user = await db.findBy('users', {id: followedUserID});

    return {currentUser, user};
  },
});
