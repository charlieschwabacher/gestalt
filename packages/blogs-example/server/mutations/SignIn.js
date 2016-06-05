import assert from 'assert';
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

    const user = await db.findBy('users', {email});
    await bcrypt.compare(password, user.passwordHash);

    session.currentUserID = user.id;
    return {session};
  },
});
