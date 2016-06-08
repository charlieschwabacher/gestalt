export default types => ({
  name: 'SignOut',
  inputFields: {},
  outputFields: {
    session: types.Session,
  },
  mutateAndGetPayload: (input, context) => {
    const {session} = context;
    session.currentUserID = null;
    return {session};
  },
});
