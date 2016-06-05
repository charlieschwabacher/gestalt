export default types => ({
  name: 'FollowUser',
  inputFields: {
    userID: types.ID,
    follow: types.Boolean,
  },
  outputFields: {
    user: types.User,
    currentUser: types.User
  },
  mutateAndGetPayload: async (input, context, info) => {
    const {follow, userID} = input;
    const {db, session} = context;
    const {currentUserID} = session;
    const followedUserID = userID.split(':')[1];

    if (follow) {
      await db.exec(
        'INSERT INTO user_followed_users (user_id, followed_user_id) ' +
        'VALUES ($1, $2);',
        [currentUserID, followedUserID]
      );
    } else {
      await db.deleteBy(
        'user_followed_users',
        {userId: currentUserID, followedUserID}
      );
    }

    const currentUser = await db.findBy('users', {id: currentUserID});
    const user = await db.findBy('users', {id: followedUserID});

    return {currentUser, user};
  },
});
