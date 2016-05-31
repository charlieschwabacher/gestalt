export default types => ({
  name: 'SignOut',
  inputFields: {},
  outputFields: {
    session: types.Session,
  },
  mutateAndGetPayload: (input, context, info) => {
    const {session} = context;
    session.currentUserId = null;
    return {session};
  },
});
