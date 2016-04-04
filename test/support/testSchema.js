import './types/CommentType';
import './types/PostType';
import './types/UserType';

import Gestalt from '../../src/Gestalt';
import GestaltSchema from '../../src/GestaltSchema';
import UserType from './types/UserType';

export default new GestaltSchema(() => ({
  currentUser: {
    type: UserType,
    resolve: (obj, args, plan) => {
      const {currentUserId} = obj;
      return Gestalt.resolve(UserType, currentUserId, plan);
    },
  },
}));
