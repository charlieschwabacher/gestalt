import bcrypt from 'bcrypt-as-promised';
import assert from 'assert';

export default types => ({
  name: 'SignUp',
  inputFields: {
    email: types.String,
    password: types.String,
    firstName: types.String,
    lastName: types.String,
  },
  outputFields: {
    session: types.Session,
  },
  mutateAndGetPayload: async (input, context) => {
    const {email, password, firstName, lastName} = input;
    const {db, session} = context;

    assert(email.match(/.+@.+?\..+/), 'Email is invalid');
    assert(password.length > 5, 'Password is invalid');

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await db.insert('users', {
      email,
      passwordHash,
      firstName,
      lastName
    });

    session.currentUserID = user.id;
    return {session};
  },
});
