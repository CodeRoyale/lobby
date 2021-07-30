users = {};

const addUser = ({
  userName,
  socket_id,
  room_id,
  team_name,
  rank,
  profilePicture,
}) => {
  try {
    if (!userName || !socket_id || !profilePicture || !rank) {
      throw new Error('Give all parameters');
    }
    if (users[userName]) {
      console.log(`${userName} reconnected`);
      users[userName].socket_id = socket_id;
      return { status: 1, userObj: users[userName] };
    }
    console.log(`${userName} added`);
    const newUser = {
      socket_id: socket_id,
      room_id: room_id,
      team_name: team_name,
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
    ...users[updatedUser.userName],
    ...updatedUser,
  };
  return { status: 1, userObj: users[updatedUser.userName] };
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
