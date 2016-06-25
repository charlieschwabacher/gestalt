export default types => ({
  name: 'FollowUser',
  inputFields: {
    userID: types.ID,
  },
  outputFields: {
    user: types.User,
    currentUser: types.User
  },
  mutateAndGetPayload: async (input, context) => {
    const {db, session} = context;
    const {currentUserID} = session;
    const followedUserID = input.userID.split(':')[1];

    await db.exec(
      'INSERT INTO user_followed_users (user_id, followed_user_id) ' +
      'VALUES ($1, $2);',
      [currentUserID, followedUserID]
    );

    const currentUser = await db.findBy('users', {id: currentUserID});
    const user = await db.findBy('users', {id: followedUserID});

    return {currentUser, user};
  },
});
