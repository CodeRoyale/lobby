//* import utils

/// / using relative paths here (need to find better)

const auth = require('../utils/auth');

// this is my db for now
const rooms = {};

// create room
// joinRoom
// removeUserFromRoom
// createTeam
// joinTeam
// leaveTeam
// closeRoom
// banMember
// addPrivateList
// registerVotes
// doVeto
// startCompetition
// atLeastPerTeam
// codeSubmission
// getRoomData

const ROOM_DEFAULTS = {
  maxTeams: 5,
  maxPerTeam: 5,
  maxPerRoom: 25,
  competitionTimelimit: 2700000,
  competitionMaxQues: 3,
  // should be less than number of questions
  vetoMaxVote: 1,
  vetoTimeLimit: 300000,
  vetoQuestionCount: 6,
};

// TODO : reconsider the limits
const ROOM_LIMITS = {
  maxTeams: 25,
  maxPerTeam: 10,
  maxPerRoom: 250,
  competitionTimelimit: 172800001,
  competitionMaxQues: 20,
  vetoMaxVote: 1,
  vetoTimeLimit: 18000000,
  vetoQuestionCount: 25,
};

const getProperValue = (field, passedValue) => {
  // * Helper function to get the appropriate value for the field
  // TODO : will require testing
  return Math.min(ROOM_LIMITS[field], passedValue || ROOM_DEFAULTS[field]);
};

const createRoom = (roomConfig, user) => {
  // TODO : @sastaachar

  // TODO : refactor casing (camel -> _ )

  // check req params

  if (!roomConfig.userName) {
    return {
      status: 0,
      error: 'You dont have the privilege to do',
    };
  }

  //* Start creating a new room

  // we nee a *unique* roomId

  // ! change this fn
  const roomId = auth.encryptData();

  if (rooms[roomId]) {
    return {
      status: 0,
      error: 'There is already a room present by the id given',
    };
  }
  const roomObj = {
    config: {
      id: roomId,
      admin: roomConfig.userName,
      maxTeams: getProperValue('maxTeams', roomConfig.maxTeams),
      maxPerTeam: getProperValue('maxPerTeam', roomConfig.maxPerTeam),
      privateRoom: roomConfig.privateRoom === false,
      maxPerRoom: getProperValue('maxPerRoom', roomConfig.maxPerRoom),
      createdAt: Date.now(),
    },
    state: {
      privateList: [],
      curMemCount: 1,
      banList: [],
      bench: [roomConfig.userName],
      profilePictures: { [roomConfig.userName]: user.profilePicture },
    },
    competition: {
      questions: {},
      maxQuestions: getProperValue(
        'competitionMaxQues',
        roomConfig.maxQuestions
      ),
      contestStartedAt: null,
      contnetEndedAt: null,
      contestOn: false,
      timeLimit: getProperValue('competitionTimelimit', roomConfig.timeLimit),
      veto: {
        allQuestions: {},
        votes: {},
        voted: [],
        vetoOn: false,
        maxVote: getProperValue('vetoMaxVote', roomConfig.maxVote),
        timeLimit: getProperValue('vetoTimeLimit', roomConfig.vetoTimeLimit),
        quesCount: getProperValue(
          'vetoQuestionCount',
          roomConfig.vetoQuesCount
        ),
      },
      scoreboard: {},
    },
    teams: {},
  };

  //* Store the room now
  rooms[roomId] = roomObj;
  return { status: 1, returnObj: roomObj };
};

const joinRoom = (user, roomId, teamName) => {
  const { userName, profilePicture } = user;
  if (
    !rooms[roomId] &&
    (!rooms[roomId].config.privateRoom ||
      !rooms[roomId].state.privateList.includes(userName)) &&
    rooms[roomId].state.curMemCount > rooms[roomId].config.maxPerRoom
  ) {
    return { status: 0, error: "The User doesn't meet the specifications" };
  }
  // (only run if room exists) and (user is allowed if private) and (space is there)

  // quit from prev room and try again
  if (user.roomId) {
    // already in a group don't allow
    return { status: 1, error: 'User already in room' };
  }

  // successful (user will now be added)

  if (
    teamName &&
    rooms[roomId].team[teamName] &&
    rooms[roomId].teams[teamName].length < rooms[roomId].config.maxPerTeam
  ) {
    // if user passes a team and that team exist and there is space in that team
    rooms[roomId].teams[teamName].push(userName);
  } else {
    // else bench the user
    rooms[roomId].state.bench.push(userName);
  }

  // user has been added to bench or a Team
  rooms[roomId].state.curMemCount += 1;
  rooms[roomId].state.profilePictures[userName] = profilePicture;
  return { status: 2, returnObj: rooms[roomId] };
};

/**
 *
 * @param {object} user -  { userName, roomId, teamName
 }
 * @returns {object} - { status , err }
 *                     0 - Can't kick , He's Admin
 *                     1 - if user is in a team.
 *                     2 - user is only in the bench
 * TODO : @naven @chirag test this function
 * ! Should'nt be integrated without testing
 */
const removeUserFromRoom = (user) => {
  const { userName, roomId, teamName } = user;

  // if user is a admin then no leave only delete possible
  // it cause of the way i am storing roomId ( == adminName)
  if (rooms[roomId].config.admin === userName) {
    return { status: 0, error: "The User is admin. Can't kick admin." };
  }

  let status;
  if (teamName) {
    // if user has joined a team
    const newTeam = rooms[roomId].teams[teamName].filter(
      (ele) => ele !== userName
    );
    rooms[roomId].teams[teamName] = newTeam;
    status = 1;
    // no need to send teamName as this will only be sent to
    // ppl in "same team"
  } else {
    // if user is on a bench
    const newBench = rooms[roomId].state.bench.filter(
      (ele) => ele !== userName
    );
    rooms[roomId].state.bench = newBench;
    status = 2;
  }

  // removed
  rooms[roomId].state.curMemCount -= 1;

  return { status, returnObj: rooms[roomId] };
};

const joinTeam = (user, teamName) => {
  const { userName } = user;
  const room = rooms[user.roomId];
  // only run if user and room exits and user is in that room
  // and there is space
  if (
    !room &&
    !room.teams[teamName] &&
    room.teams[teamName].length > room.config.maxPerTeam
  ) {
    return {
      status: 0,
      error: "The User doesn't meet the specifications to join the team",
    };
  }
  if (user.teamName) {
    // ditch prev team
    return { status: 0, error: 'Already in team' };
  }

  // remove from bench
  const newBench = rooms[user.roomId].state.bench.filter(
    (ele) => ele !== userName
  );
  rooms[user.roomId].state.bench = newBench;

  // in new team
  rooms[user.roomId].teams[teamName].push(userName);

  return { status: 1, returnObj: rooms[user.roomId].teams };
};

const closeRoom = (user, forceCloseRoom = false) => {
  const { roomId, userName } = user;
  const room = rooms[roomId];

  if (!room && room.config.admin !== userName) {
    return {
      status: 0,
      error: "The User doesn't meet the specifications to close the room",
    };
  }
  if (
    !forceCloseRoom &&
    (room.competition.contestOn || room.competition.veto.vetoOn)
  ) {
    return {
      status: 0,
      error: 'There is a ongoing competition. Finish it first',
    };
  }
  // everyone from room bench
  const allMembers = rooms[roomId].state.bench;
  // from all teams
  Object.keys(rooms[roomId].teams).forEach((teamName) => {
    rooms[roomId].teams[teamName].forEach((member) => {
      allMembers.push(member);
    });
  });
  // delete the stupid room
  delete rooms[roomId];
  return { status: 1, returnObj: allMembers };
};

/* status :0 -> false
status :1 -> true
*/

const createTeam = (user, teamName) => {
  // if more teams are allowed
  // if teamName is not already used
  // and user is admin
  const { userName, roomId } = user;
  // if user not in room or not admin of the room
  const room = rooms[roomId];
  console.log(roomId, 'yeh dakhhh', room.config.admin, 'dekho', userName);
  if (!roomId || room.config.admin !== userName) {
    return { status: 0, error: 'Only admin can do this' };
  }
  if (
    Object.keys(room.teams).length > room.config.maxTeams &&
    room.teams[teamName]
  ) {
    return {
      status: 0,
      error: 'The team name has already been alloted or the team is already in',
    };
  }
  room.teams[teamName] = [];
  return { status: 1, returnObj: rooms[roomId].teams };
};

const leaveTeam = (user) => {
  const { roomId, teamName, userName } = user;
  const room = rooms[roomId];

  // check if in a room and in a team
  if (!roomId && !teamName) {
    return {
      status: 0,
      error: 'User does not meet the specifications to leave the team',
    };
  }

  const newTeam = room.teams[teamName].filter((ele) => ele !== userName);
  room.teams[teamName] = newTeam;
  room.state.bench.push(userName);

  return { status: 1, returnObj: room.teams };
};

const addPrivateList = (user, privateList) => {
  const { userName, roomId } = user;
  const room = rooms[roomId];

  if (!room && room.config.admin !== userName && !room.config.privateRoom) {
    return { status: 0, error: 'Only admin can do this' };
  }
  privateList.forEach((ele) => {
    if (!room.state.privateList.includes(ele)) {
      rooms[roomId].state.privateList.push(ele);
    }
  });
  return { status: 1, returnObj: rooms[roomId].state.privateList };
};

const getRoomData = (user, roomsId) => {
  const { roomId } = user;
  if (user.roomId !== roomsId)
    return { status: 0, error: 'User not in room from room.js' };
  return { status: 1, roomObj: rooms[roomId] };
};

const getRoomsData = () => {
  // need proper authorizations
  try {
    return { status: 1, roomObj: rooms };
  } catch (err) {
    return { status: 0, error: err.message || false };
  }
};

/**
 *
 * @param {sting} userName -  user's userName
 * @param {string} roomId - user's roomId
 * @param {sting} teamName
 -  user's teamName
 (easier of pin point the updation field)
 * @param {[quesID]} votes - user's votes for the veto
 * @returns {object} - { status , err }
 *                     0 - vote not registered (err)
 *                     1 - vote registered sucessfully
 *                     2 - vote is completed (user can stop if needed)
 * ? should support for empty teamName
 be added
 * TODO : @naven @chirag test this function
 * ! Should'nt be integrated without testing
 */
const registerVotes = ({ roomId, userName, teamName, votes }) => {
  if (!roomId || !userName || !votes || !teamName) {
    return { status: 0, error: 'Required params are not passed.' };
  }

  const room = rooms[roomId];
  // * user should be in a team
  if (
    !room ||
    !room.teams[teamName] ||
    !room.teams[teamName].includes(userName)
  ) {
    return { status: 0, error: "User doesn't meet the requirements." };
  }

  const { vetoOn, voted, allQuestions, maxVote } = room.competition.veto;
  // * veto should be on
  // * user should have not voted
  if (!vetoOn || voted.includes(userName)) {
    return { status: 0, error: "Room doesn't meet the requirements." };
  }

  // for no-param-reassign linting
  let questionVotes = votes;

  // valid votes only
  questionVotes = questionVotes.filter((id) => allQuestions.includes(id));
  // questionVotes should be unique
  questionVotes = [...new Set(questionVotes)];
  // should not excede maxquestionVotes allowed
  // we will only take Min(questionVotes.length, maxVote) questionVotes
  if (questionVotes.length > maxVote)
    questionVotes = questionVotes.slice(0, maxVote);
  // note questionVotes
  questionVotes.forEach((id) => {
    rooms[roomId].competition.veto.votes[id] += 1;
  });
  rooms[roomId].competition.veto.voted.push(userName);

  // voted users = total users
  // TODO --> @naveen
  //           * NOW -> O(n*m)
  //           * store calculated in obj to make in O(n)
  let totalRequired = 0;
  Object.keys(rooms[roomId].teams).forEach((teams) => {
    totalRequired += rooms[roomId].teams[teams].length;
  });

  if (totalRequired === rooms[roomId].competition.veto.voted.length) {
    // we got all the required votes
    rooms[roomId].competition.veto.vetoOn = false;
    let results = Object.entries(rooms[roomId].competition.veto.votes);
    results = results
      .sort((a, b) => b[1] - a[1])
      .slice(0, rooms[roomId].competition.maxQuestions);
    // take only qids
    results = results.map((ele) => ele[0]);
    rooms[roomId].competition.questions = results;
    return { status: 2, returnObj: results };
  }

  return { status: 1, returnObj: rooms[roomId].competition.veto.votes };
};

/**
 *
 * @param {object} user -  user data
 * @param {string} state - start or stop competition
 * @returns {object} - { status , err }
 *                     0 - vote not registered (err)
 *                     1 - vote registered sucessfully
 *                     2 - vote is completed (user can stop if needed)
 * ? should support for empty teamName
 be added
 * TODO : @naven @chirag test this function
 * ! Should'nt be integrated without testing
 */
const startCompetition = (user, state) => {
  const { roomId } = user;
  const room = rooms[roomId];

  if (state === 'start') {
    room.competition.contestOn = true;
    room.competition.contestStartedAt = Date.now();
    Object.keys(room.teams).forEach((ele) => {
      room.competition.scoreboard[ele] = [];
    });
    return { status: 1, returnObj: room.competition };
  }
  rooms[roomId].competition.contestOn = false;
  rooms[roomId].competition.contnetEndedAt = Date.now();
  return { status: 2, roomObj: room.competition };
};

const atLeastPerTeam = (roomId, minSize = 1) => {
  // ! changed after linting
  try {
    Object.values(rooms[roomId].teams).forEach(function (memList) {
      if (memList.length < minSize) return false;
      return true;
    });

    // ! before linting:
    // for (const [, memList] of Object.entries(rooms[roomId].teams)) {
    //   if (memList.length < minSize) return false;
    // }
  } catch (err) {
    return { error: err.message };
  }
  // ! after linting
  return roomId;
};

const startCompetitionRequirements = (user) => {
  const { roomId, userName } = user;
  const room = rooms[roomId];

  // room exists
  // user is admin
  // 2 or more members are there
  // 2 or more teams required
  // each team should hav atleast member
  // and no ongoing contest
  if (
    !room ||
    room.config.admin !== userName ||
    room.state.curMemCount < 2 ||
    Object.keys(room.teams).length < 2 ||
    !atLeastPerTeam(roomId) ||
    room.competition.contestOn ||
    room.competition.veto.vetoOn
  ) {
    return { status: 0, error: "Room doesn't meet the requirements." };
  }
  return { status: 1, returnObj: room };
};

const doVetoRequirements = ({ roomId }) => {
  const room = rooms[roomId];
  if (room.competition.contestOn || room.competition.veto.vetoOn) {
    return { status: 0, error: 'Veto not allowed now.' };
  }
  return { status: 1, returnObj: room };
};

const doVeto = (quesIds, roomId, count, state) => {
  // set the room state
  const room = rooms[roomId];
  if (state === 'start') {
    rooms[roomId].competition.veto.vetoOn = true;
    rooms[roomId].competition.veto.allQuestions = quesIds;

    // iitailize votes with 0
    rooms[roomId].competition.veto.votes = {};
    rooms[roomId].competition.veto.voted = [];
    quesIds.forEach((id) => {
      rooms[roomId].competition.veto.votes[id] = 0;
    });
    return { status: 1 };
  }

  // no need to remove listeners
  // all of them are volatile listners
  // calculate veto results

  room.competition.veto.vetoOn = false;
  let results = Object.entries(room.competition.veto.votes);
  results = results.sort((a, b) => b[1] - a[1]).slice(0, count);
  // take only qids
  results = results.map((ele) => ele[0]);
  rooms[roomId].competition.questions = results;

  return { status: 1, returnObj: results };
};

const codeSubmissionRequirements = (roomId, teamName, testcase, langId) => {
  const room = rooms[roomId];
  if (
    rooms[roomId] &&
    rooms[roomId].teams[teamName] &&
    rooms[roomId].competition.contestOn &&
    testcase !== null &&
    langId !== null
  ) {
    return { status: 1, returnObj: room };
  }
  return { status: 0, error: 'Code Submission not allowed now.' };
};

const codeSubmission = (roomId, state, teamName, quesId) => {
  if (state === 'one-pass') {
    if (!rooms[roomId].competition.scoreboard[teamName].includes(quesId))
      rooms[roomId].competition.scoreboard[teamName].push(quesId);

    return { status: 1 };
  }

  rooms[roomId].competition.contestOn = false;
  rooms[roomId].competition.contnetEndedAt = Date.now();

  return { status: 1, returnObj: rooms[roomId].competition };
};
module.exports = {
  createRoom,
  joinRoom,
  removeUserFromRoom,
  joinTeam,
  closeRoom,
  createTeam,
  addPrivateList,
  leaveTeam,
  getRoomData,
  getRoomsData,
  registerVotes,
  startCompetitionRequirements,
  startCompetition,
  doVeto,
  doVetoRequirements,
  codeSubmissionRequirements,
  codeSubmission,
};
