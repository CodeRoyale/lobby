const UserModel = require('../models/user');

// [userID] : {     }

// all details related to a user connected to socket will be stored here

const addUser = (userName, socketId, profilePicture, rank = 10) => {
  const returnObj = UserModel.addUser({
    userName,
    socketId,
    // roomId,
    // teamName,
    rank,
    profilePicture,
  });
  if (returnObj.status === 0) {
    console.log(returnObj.error);
    return false;
  }
  if (returnObj.status === 1) {
    return returnObj.userObj;
  }
  return returnObj.userObj;
};

// const removeUser = (userName) => {
// 	try {
// 		if (users[userName]) {
// 			console.log(userName + ' removed');
// 			delete users[userName];
// 			return true;
// 		}
// 		return false;
// 	} catch (err) {
// 		return err.message || false;
// 	}
// };

// this is just for extra checking
// can change roomId and teamName

const updateUser = (updatedUser) => {
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
  const returnObj = UserModel.updateUser(newUpdated);
  return returnObj.userObj;
};

const getUser = (userName) => {
  const returnObj = UserModel.getUser(userName);
  if (returnObj.status === 0) {
    return returnObj.error;
  }
  return returnObj.userObj;
};

const getUserData = () => {
  // need proper authorizations
  const returnObj = UserModel.getUserData();
  if (returnObj.status === 0) {
    return returnObj.error;
  }
  return returnObj.userObj;
};

module.exports = {
  addUser,
  getUserData,
  getUser,
  updateUser,
};
