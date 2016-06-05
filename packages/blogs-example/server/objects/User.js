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
      return `//www.gravatar.com/avatar/${hash}?d=mm&s=${args.size || 200}`;
    },

    following: async (obj, args, context) => {
      const follows = await context.db.queryBy('user_followed_users', {
        userID: context.session.currentUserID,
        followedUserId: obj.id,
      });
      return follows.length > 0;
    }
  },
};
