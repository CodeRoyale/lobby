const redisClient = require('../utils/redis');

const USERS_KEY = 'users';

// Get users from Redis
const getUsersStore = async () => {
  try {
    const users = await redisClient.json.get(USERS_KEY, {
      // JSON Path: .node = the element called 'node' at root level.
      path: '.',
    });
    return users;
  } catch (error) {
    console.log(error);
    return false;
  }
};

// Update users in Redis
const updateUsersStore = async (data) => {
  try {
    return await redisClient.json.set(USERS_KEY, '.', data);
  } catch (error) {
    console.log(error);
    return false;
  }
};

module.exports = {
  getUsersStore,
  updateUsersStore,
};
