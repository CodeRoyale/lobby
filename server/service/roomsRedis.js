const redisClient = require('../utils/redis');

const ROOMS_KEY = 'rooms';

// Get rooms from Redis
const getRoomsStore = async () => {
  try {
    const rooms = await redisClient.json.get(ROOMS_KEY, {
      // JSON Path: .node = the element called 'node' at root level.
      path: '.',
    });
    return rooms;
  } catch (error) {
    console.log(error);
    return false;
  }
};

// Update users in Redis
const updateRoomsStore = async (data) => {
  try {
    return await redisClient.json.set(ROOMS_KEY, '.', data);
  } catch (error) {
    console.log(error);
    return false;
  }
};

module.exports = {
  getRoomsStore,
  updateRoomsStore,
};
