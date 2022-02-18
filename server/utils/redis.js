const redis = require('redis');

const redisClient = redis.createClient();

redisClient.connect();

const USERS_KEY = 'users';
const ROOMS_KEY = 'rooms';

// checking error with redis
//! check with this module. Not working
redisClient.on('error', (error) => {
  console.error(`❗️ Redis Error: ${error}`);
});

redisClient.on('connect', async () => {
  console.log('✅ 💃 connect redis success !');

  let users = null;
  let rooms = null;

  try {
    users = await redisClient.json.get(USERS_KEY, {
      // JSON Path: .node = the element called 'node' at root level.
      path: '.',
    });

    rooms = await redisClient.json.get(ROOMS_KEY, {
      // JSON Path: .node = the element called 'node' at root level.
      path: '.',
    });

    if (!users) {
      await redisClient.json.set(USERS_KEY, '.', {});
    }

    if (!rooms) {
      await redisClient.json.set(ROOMS_KEY, '.', {});
    }
  } catch (error) {
    console.log(error);
  }
});

module.exports = redisClient;
