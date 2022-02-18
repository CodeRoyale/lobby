const redisClient = require('../utils/redis');

const USERS_KEY = 'users';

const getUsersStore = async () => {
  try {
    let users = null;
    users = await redisClient.json.get(USERS_KEY, {
      // JSON Path: .node = the element called 'node' at root level.
      path: '.',
    });
    return users;
  } catch (error) {
    console.log(error);
    return false;
  }
};

const updateUsersStore = async () => {};

module.exports = {
  getUsersStore,
  updateUsersStore,
};
