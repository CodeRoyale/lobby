const usersRedis = require('../service/usersRedis');

// Store new user connected through web sockets details in Redis
const addUser = async ({
  userName,
  socketId,
  roomId,
  teamName,
  rank,
  profilePicture,
}) => {
  try {
    const users = await usersRedis.getUsersStore();

    if (!userName || !socketId || !profilePicture || !rank) {
      throw new Error('Give all parameters');
    }

    if (users[userName]) {
      console.log(`${userName} reconnected`);
      users[userName].socketId = socketId;
      await usersRedis.updateUsersStore(users);
      return { status: 1, userObj: users[userName] };
    }

    console.log(`${userName} added`);
    const newUser = {
      socketId: socketId,
      roomId: roomId,
      teamName: teamName,
      rank: rank,
      userName: userName,
      profilePicture: profilePicture,
    };
    users[userName] = newUser;
    await usersRedis.updateUsersStore(users);

    return { status: 2, userObj: users[userName] };
  } catch (error) {
    return { status: 0, error: error.message };
  }
};

// Update user details in Redis
const updateUser = async (updatedUser) => {
  try {
    const users = await usersRedis.getUsersStore();

    users[updatedUser.userName] = {
      ...users[updatedUser.userName],
      ...updatedUser,
    };
    await usersRedis.updateUsersStore(users);
    return { status: 1, userObj: users[updatedUser.userName] };
  } catch (error) {
    console.log(error);
    return { status: 0, error: error.message };
  }
};

// Remove a user's details from Redis
const removeUser = async (userName) => {
  try {
    const users = await usersRedis.getUsersStore();
    if (users[userName]) {
      console.log(`${userName} + ' removed'`);
      delete users[userName];
      await usersRedis.updateUsersStore(users);
      return { status: 1, users: users };
    }
    return { status: 0, error: 'Username doesnot exist' };
  } catch (error) {
    return { status: 0, error: error.message };
  }
};

// Get a single user's data from Redis
const getUser = async (userName) => {
  try {
    const users = await usersRedis.getUsersStore();
    return { status: 1, userObj: users[userName] };
  } catch (err) {
    return { status: 0, error: err.message || false };
  }
};

// Get all users connected data from Redis
const getUsersData = async () => {
  // need proper authorizations
  try {
    const users = await usersRedis.getUsersStore();
    return { status: 1, userObj: users };
  } catch (err) {
    return { status: 0, error: err.message || false };
  }
};

module.exports = {
  addUser,
  updateUser,
  removeUser,
  getUser,
  getUsersData,
};
