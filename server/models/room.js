//* import utils

//// using relative paths here (need to find better)
import { encryptData } from "../utils/auth";

// this is my db for now
rooms = {};

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
  max_teams: 5,
  max_perTeam: 5,
  max_perRoom: 25,
  competitionTimelimit: 2700000,
  competitionMaxQues: 3,
  // should be less than number of questions , but fuck it
  vetoMaxVote: 1,
  vetoTimeLimit: 300000,
  vetoQuestionCount: 6,
};

// TODO : reconsider the limits
const ROOM_LIMITS = {
  max_teams: 25,
  max_perTeam: 10,
  max_perRoom: 250,
  competitionTimelimit: 21600000,
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

const createRoom = (config, roomState, roomCompetition, roomTeams) => {
  // TODO : @sastaachar

  // TODO : refactor casing (camel -> _ )

  // check req params

  if (!config.userName) {
    throw new Error("Admin tera baap hai kya ?");
  }

  //* Start creating a new room

  // we nee a *unique* room_id

  // ! change this fn
  const room_id = encryptData(config.userName);

  const room_obj = {
    config: {
      id: room_id,
      admin: config.userName,
      max_teams: getProperValue("max_teams", config["max_teams"]),
      max_perTeam: getProperValue("max_perTeam", config["max_perTeam"]),
      privateRoom: config.privateRoom === false,
      max_perRoom: getProperValue("max_perRoom", config["max_perRoom"]),
      createdAt: Date.now(),
    },
    state: {
      privateList: [],
      cur_memCount: 1,
      banList: [],
      bench: [config.admin],
      profilePictures: { [config.admin]: user.profilePicture },
    },
    competition: {
      questions: {},
      max_questions: getProperValue(
        "competitionMaxQues",
        config["competitionMaxQues"]
      ),
      contestStartedAt: null,
      contnetEndedAt: null,
      contestOn: false,
      timeLimit: getProperValue(
        "competitionTimelimit",
        config["competitionTimelimit"]
      ),
      veto: {
        allQuestions: {},
        votes: {},
        voted: [],
        vetoOn: false,
        max_vote: getProperValue("vetoMaxVote", config["vetoMaxVote"]),
        timeLimit: getProperValue("vetoTimeLimit", config["vetoTimeLimit"]),
        quesCount: getProperValue(
          "vetoQuestionCount",
          config["vetoQuestionCount"]
        ),
      },
      scoreboard: {},
    },
    teams: {},
  };

  //* Store the room now
  rooms[room_id] = room_obj;
  return room_obj;
};

const joinRoom = () => {};

module.exports = {
  createRoom,
};
