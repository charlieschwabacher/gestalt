import crypto from 'crypto';

export default {
  name: 'User',
  fields: {
    // calculate user's first name from first and last names
    fullName: obj => [obj.firstName, obj.lastName].filter(n => n).join(' '),

    // get a user's gravatar image url using their email address
    profileImage: (obj, args) => {
      const email = obj.email.toLowerCase();
      const hash = crypto.createHash('md5').update(email).digest('hex');
      return `//www.gravatar.com/avatar/${hash}?d=retro&s=${args.size || 200}`;
    },
  },
};
