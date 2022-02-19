const UserModel = require('../models/user');

// This is the controller that stores all user data in Redis

// Store new user connected through web sockets details
const addUser = async ({
  userName,
  socketId,
  profilePicture,
  rank = 1,
  roomId = '',
  teamName = '',
}) => {
  const returnObj = await UserModel.addUser({
    userName,
    socketId,
    roomId,
    teamName,
    rank,
    profilePicture,
  });
  if (returnObj.status === 0) {
    console.log(returnObj.error);
    return false;
  }
  return returnObj.userObj;
};

// Update details of user
const updateUser = async (updatedUser) => {
  // this is just for extra checking
  // can change roomId and teamName
  const check = [
    'userName',
    'socketId',
    'roomId',
    'teamName',
    'rank',
    'profilePicture',
  ];
  const newUpdated = {};
  check.forEach((field) => {
    if (updatedUser[field] !== undefined)
      newUpdated[field] = updatedUser[field];
  });
  // let newUpdatedUser = Object.keys(updatedUser).filter((ele) =>
  // 	check.includes(ele)
  // );
  // console.log(newUpdated);
  const returnObj = await UserModel.updateUser(newUpdated);
  return returnObj.userObj;
};

// Remove a user's details
const removeUser = async (userName) => {
  const returnObj = await UserModel.removeUser(userName);
  if (returnObj.status === 0) {
    return returnObj.error;
  }
  return returnObj.users;
};

// Get a single user's data
const getUser = async (userName) => {
  const returnObj = await UserModel.getUser(userName);
  if (returnObj.status === 0) {
    return returnObj.error;
  }
  return returnObj.userObj;
};

// Get all user's data
const getUsersData = async () => {
  // need proper authorizations
  const returnObj = await UserModel.getUsersData();
  if (returnObj.status === 0) {
    return returnObj.error;
  }
  return returnObj.userObj;
};

module.exports = {
  addUser,
  updateUser,
  removeUser,
  getUsersData,
  getUser,
};
