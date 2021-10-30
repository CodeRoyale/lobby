const { setRoom } = require('./userController');
const { getQuestions, getTestcase } = require('../utils/qapiConn');

const { submitCode } = require('../utils/codeExecution');

const {
  ROOM_UPDATED,
  RCV_MSG,
  JOINED_ROOM,
  JOINED_TEAM,
  LEFT_TEAM,
  LEFT_ROOM,
  TEAM_CREATED,
  ADDED_PRIVATE_MEMBER,
  VETO_START,
  VETO_STOP,
  COMPETITION_STARTED,
  COMPETITION_STOPPED,
  ROOM_CLOSED,
  CODE_SUBMITTED,
  SUCCESSFULLY_SUBMITTED,
  USER_VOTED,
} = require('../socketActions/serverActions');
const RoomModel = require('../models/room');
const UserController = require('./userController');

// cant store them in roomObj cause it causes lot of problems
// to stop comepetition
const stopTimers = {};
// resolvers
const resolvers = {};

// roomId will be admin name

const createRoom = (config, { socket }) => {
  const user = UserController.getUser(config.userName);
  if (user.roomId) {
    // please leave current room
    return false;
  }

  // createRoom function to be called by the controller.
  const roomObj = RoomModel.createRoom(config, user);
  if (roomObj.status === 0) {
    return { err: roomObj.error };
  }
  const roomId = roomObj.returnObj.config.id;

  UserController.updateUser({
    userName: config.userName,
    roomId,
  });
  socket.join(roomId);
  // created room
  // user already has an active room
  return roomObj.returnObj;
};

// users connecting to room
// TODO -> refactor this fn if should return error
const joinRoom = ({ userName, roomId, teamName }, { socket }) => {
  const user = UserController.getUser(userName);
  const roomObj = RoomModel.joinRoom(user, roomId, teamName);
  if (roomObj.status === 0) {
    return { err: roomObj.error };
  }
  UserController.updateUser({ userName, roomId, teamName });
  socket.join(roomId);
  socket.to(roomId).emit(ROOM_UPDATED, {
    type: JOINED_ROOM,
    data: { userName, profilePicture: user.profilePicture },
  });
  console.log(userName, ' joined from ', roomId);
  return roomObj.returnObj;
};

const removeUserFromRoom = ({ userName }, { socket }) => {
  const user = UserController.getUser(userName);
  const { roomId, teamName } = user;
  const roomObj = RoomModel.removeUserFromRoom(user);
  if (roomObj.status === 0) {
    return false;
  }
  if (roomObj.status === 1) {
    // user removed from the team
    socket.leave(`${roomId}/${teamName}`);
    socket.to(roomId).emit(ROOM_UPDATED, {
      type: LEFT_TEAM,
      data: { userName, teamName },
    });
  }
  // user removed from the room
  console.log(userName, ' removed from ', roomId);
  setRoom(userName, '');
  // console.log('checking the setRoom the function');
  socket.to(roomId).emit(ROOM_UPDATED, {
    type: LEFT_ROOM,
    data: { userName },
  });
  socket.leave(roomId);
  return true;
};

const createTeam = ({ userName, teamName }, { socket }) => {
  const user = UserController.getUser(userName);
  const { roomId } = user;
  const roomObj = RoomModel.createTeam(user, teamName);
  if (roomObj.status === 0) {
    return { err: roomObj.error };
  }
  socket.to(roomId).emit(ROOM_UPDATED, {
    type: TEAM_CREATED,
    data: { teamName },
  });
  console.log(roomObj.returnObj);
  return roomObj.returnObj;
};

const joinTeam = ({ userName, teamName }, { socket }) => {
  const user = UserController.getUser(userName);
  const roomObj = RoomModel.joinTeam(user, teamName);
  if (roomObj.status === 0) {
    return { err: roomObj.error };
  }
  UserController.updateUser({ userName, teamName });
  socket.join(`${user.roomId}/${teamName}`);
  socket.to(user.roomId).emit(ROOM_UPDATED, {
    type: JOINED_TEAM,
    data: { userName, teamName },
  });

  return roomObj.returnObj;
};

const leaveTeam = ({ userName }, { socket }) => {
  const user = UserController.getUser(userName);
  const { roomId, teamName } = user;
  const roomObj = RoomModel.leaveTeam(user);
  if (roomObj.status === 0) {
    return { err: roomObj.error };
  }
  UserController.updateUser({ userName, teamName: '' });
  socket.leave(`${user.roomId}/${user.teamName}`);
  socket.to(roomId).emit(ROOM_UPDATED, {
    type: LEFT_TEAM,
    data: { userName, teamName },
  });
  return roomObj.returnObj;
};

const closeRoom = ({ userName, forceCloseRoom }, { socket }) => {
  const user = UserController.getUser(userName);
  const { roomId } = user;
  const roomObj = RoomModel.closeRoom(user, forceCloseRoom);
  if (roomObj.status === 0) {
    return { err: roomObj.error };
  }

  const allMembers = roomObj.returnObj;
  // console.log(allMembers);
  // not need to change room data since we are going to delete it
  allMembers.forEach((users) => {
    // this is a server action notify all
    // TODO --> add kick all and remove functions for sockets
    UserController.updateUser({ users, roomId: '', teamName: '' });
  });

  // delete the room
  const dataToEmit = 'Room Closed';
  socket.to(roomId).emit(ROOM_CLOSED, {
    data: { dataToEmit },
  });
  socket.emit(ROOM_CLOSED);
  return true;
};

// TODO --> DELETE TEAM

// const banMember = ({ roomId }) => {
//   try {
//   } catch (err) {
//     return { error: err.message };
//   }
// };

const addPrivateList = ({ userName, privateList }, { socket }) => {
  // only private rooms can have private lists
  const user = UserController.getUser(userName);
  const roomObj = RoomModel.addPrivateList(user, privateList);

  if (roomObj.status === 0) {
    return { err: roomObj.error };
  }

  socket.to(user.roomId).emit(ROOM_UPDATED, {
    type: ADDED_PRIVATE_MEMBER,
    data: { privateList: roomObj.returnObj },
  });
  return roomObj.returnObj;
};

// const handleUserDisconnect = ({ userName }) => {
//   // need to fill this
//   try {
//   } catch (err) {
//     return { error: err.message };
//   }
// };

const forwardMsg = ({ userName, content, toTeam }, { socket }) => {
  try {
    const { roomId, teamName } = UserController.getUser(userName);

    // not in a room
    if (!roomId || !content) return false;

    let rcvrs = roomId;
    if (toTeam && teamName) {
      rcvrs += `/${teamName}`;
    }
    socket.to(rcvrs).emit(RCV_MSG, { userName, content, toTeam });
    return true;
  } catch (err) {
    return { error: err.message };
  }
};

const registerVotes = ({ userName, votes }, { socket }) => {
  const { roomId, teamName } = UserController.getUser(userName);
  const roomObj = RoomModel.registerVotes({
    roomId,
    userName,
    teamName,
    votes,
  });
  if (roomObj.status === 0) {
    return { err: roomObj.error };
  }
  socket.to(roomId).emit(USER_VOTED, { userName, votes });
  socket.emit(USER_VOTED, { userName, votes });

  if (roomObj.status === 2) {
    clearTimeout(stopTimers[roomId].vetoTimer);
    // stopping code
    // TODO --> needs refactoring
    socket.to(roomId).emit(VETO_STOP, roomObj.returnObj);
    socket.emit(VETO_STOP, roomObj.returnObj);

    // resolvers are stored here -> example of shitty coding
    resolvers[roomId](roomObj.returnObj);
  }
  return roomObj.returnObj;
};

const doVeto = async (quesIds, roomId, count, socket) => {
  return new Promise((resolve) => {
    let state = 'start';
    const roomCheck = RoomModel.doVetoRequirements({ roomId });
    const room = roomCheck.returnObj;
    RoomModel.doVeto(quesIds, roomId, count, state);
    socket.to(roomId).emit(VETO_START, quesIds);
    socket.emit(VETO_START, quesIds);

    resolvers[roomId] = resolve;
    state = 'stop';
    stopTimers[roomId].vetoTimer = setTimeout(() => {
      const roomObj2 = RoomModel.doVeto(quesIds, roomId, count, state);
      const results = roomObj2.returnObj;
      socket.to(roomId).emit(VETO_STOP, results);
      socket.emit(VETO_STOP, results);

      resolve(results);
    }, room.competition.veto.timeLimit);
  });
};

const startCompetition = async ({ userName }, { socket }) => {
  const user = UserController.getUser(userName);
  let state = 'start';
  const roomCheck = RoomModel.startCompetitionRequirements(user);
  if (roomCheck.status === 0) {
    return { err: roomCheck.error };
  }
  const room = roomCheck.returnObj;
  const roomId = room.config.id;
  console.log('Starting competition', userName);
  stopTimers[roomId] = {};
  const allQuestions = await getQuestions(room.competition.veto.quesCount);

  await doVeto(allQuestions, roomId, room.competition.maxQuestions, socket);
  let roomObj = RoomModel.startCompetition(user, state);

  socket.to(roomId).emit(COMPETITION_STARTED, roomObj);
  socket.emit(COMPETITION_STARTED, roomObj);

  state = 'stop';
  stopTimers[roomId].competitionTimer = setTimeout(() => {
    roomObj = RoomModel.startCompetition(user, state);
    socket.to(roomId).emit(COMPETITION_STOPPED, roomObj.returnObj);
    socket.emit(COMPETITION_STOPPED, roomObj.returnObj);
  }, room.competition.timeLimit);

  return roomObj.returnObj;
};

// @util function to check if all teams have atleast min_size member
// const atLeastPerTeam = (roomId, min_size = 1) => {
//   try {
//     for (const [name, memList] of Object.entries(rooms[roomId].teams)) {
//       if (memList.length < min_size) return false;
//     }
//     return true;
//   } catch (err) {
//     return { error: err.message };
//   }
// };

const getRoomData = ({ userName, roomId }) => {
  const user = UserController.getUser(userName);
  const returnObj = RoomModel.getRoomData(user, roomId);
  if (returnObj.status === 0) {
    return returnObj.error;
  }
  return returnObj.roomObj;
  // try {
  //   const user = UserController.getUser(userName);
  //   if (user.roomId !== roomId) throw new Error('User not in room');
  //   return rooms[roomId];
  // } catch (err) {
  //   return { error: err.message };
  // }
};

const getRoomsData = () => {
  const returnObj = RoomModel.getRoomsData();
  if (returnObj.status === 0) {
    return returnObj.error;
  }
  return returnObj.roomObj;
};

const codeSubmission = async (
  { userName, problemCode, code, langId },
  { socket }
) => {
  const quesId = problemCode;
  const { roomId, teamName } = UserController.getUser(userName);
  const testcase = await getTestcase(problemCode);
  const roomCheck = RoomModel.codeSubmissionRequirements(
    roomId,
    teamName,
    testcase,
    langId
  );
  if (roomCheck.status === 0) {
    return { err: roomCheck.error };
  }
  const room = roomCheck.returnObj;
  submitCode(testcase, code, langId, (dataFromSubmitCode) => {
    let allPass = true;
    dataFromSubmitCode.submissions.forEach((result) => {
      if (result.status_id !== 3) {
        allPass = false;
        return false;
      }
      return true;
    });
    // code submitted
    socket.emit(CODE_SUBMITTED, {
      data: dataFromSubmitCode,
      sucess: allPass,
      problemCode,
      teamName,
    });

    if (allPass) {
      // tell everyone except user
      let state = 'one-pass';
      RoomModel.codeSubmission(roomId, state, teamName, quesId);
      // console.log(roomObj);

      socket.to(roomId).emit(SUCCESSFULLY_SUBMITTED, { problemCode, teamName });

      // if user's team solved all questions
      // can also use Object.keys(rms.cpms.questions) and maybe <=
      if (
        room.competition.maxQuestions ===
        room.competition.scoreboard[teamName].length
      ) {
        if (stopTimers[roomId].competitionTimer)
          clearTimeout(stopTimers[roomId].competitionTimer);
        state = 'all-pass';
        const tempRoomObj = RoomModel.codeSubmission(roomId, state);
        socket.to(roomId).emit(COMPETITION_STOPPED, tempRoomObj.returnObj);
        socket.emit(COMPETITION_STOPPED, tempRoomObj.returnObj);
      }
    }
  });
  // returned this after it caused linting error to return something for the function
  return 'all-pass';
};

module.exports = {
  createRoom,
  joinRoom,
  joinTeam,
  closeRoom,
  createTeam,
  getRoomData,
  getRoomsData,
  leaveTeam,
  removeUserFromRoom,
  forwardMsg,
  addPrivateList,
  startCompetition,
  registerVotes,
  codeSubmission,
};
