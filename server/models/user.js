//! prefer-const prettier
const users = {};

const addUser = ({
  userName,
  socketId,
  roomId,
  teamName,
  rank,
  profilePicture,
}) => {
  try {
    if (!userName || !socketId || !profilePicture || !rank) {
      throw new Error('Give all parameters');
    }
    if (users[userName]) {
      console.log(`${userName} reconnected`);
      users[userName].socketId = socketId;
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

    return { status: 2, userObj: users[userName] };
  } catch (err) {
    return { status: 0, error: err.message };
  }
};

const updateUser = (updatedUser) => {
  users[updatedUser.userName] = {
    //! needs to be checked later
    /* eslint-disable */
    ...users[updatedUser.userName],
    ...updatedUser,
    /* eslint-enable */
  };
  // // not returning anything compared to develop branch
  return { status: 1, userObj: users[updateUser.userName] };
};

const getUser = (userName) => {
  try {
    return { status: 1, userObj: users[userName] };
  } catch (err) {
    return { status: 0, error: err.message || false };
  }
};

const getUserData = () => {
  // need proper authorizations
  try {
    return { status: 1, userObj: users };
  } catch (err) {
    return { status: 0, error: err.message || false };
  }
};

module.exports = {
  addUser,
  updateUser,
  getUser,
  getUserData,
};
