import bcrypt from 'bcrypt-as-promised';

export default types => ({
  name: 'SignIn',
  inputFields: {
    email: types.String,
    password: types.String,
  },
  outputFields: {
    session: types.Session,
  },
  mutateAndGetPayload: async (input, context) => {
    const {email, password} = input;
    const {db, session} = context;

    try {
      const user = await db.findBy('users', {email});
      await bcrypt.compare(password, user.passwordHash);
      session.currentUserID = user.id;
      return {session};
    } catch (e) {
      throw 'Email or password is invalid';
    }
  },
});
