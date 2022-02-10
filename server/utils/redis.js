const redis = require('redis');

const redisClient = redis.createClient();

redisClient.connect();
// checking error with redis
//! check with this module. Not working
redisClient.on('error', function (error) {
  console.error(`❗️ Redis Error: ${error}`);
});

redisClient.on('connect', () => {
  console.log('✅ 💃 connect redis success !');
});

module.exports = redisClient;
