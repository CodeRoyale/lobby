// user tries to connect
// spl
const CONNECTION = 'connection';

// user tries to create a room
const CREATE_ROOM = 'CREATE_ROOM';

// user tries to join a room
const JOIN_ROOM = 'JOIN_ROOM';

// user tries to join a room
const CREATE_TEAM = 'CREATE_TEAM';

// user tries to join a room
const JOIN_TEAM = 'JOIN_TEAM';

// user submits code
const CODE_SUBMISSION = 'CODE_SUBMISSION';

// user starts the competition
const START_COMPETITION = 'START_COMPETITION';

// user starts the competition
const CLOSE_ROOM = 'CLOSE_ROOM';

// user can request for their room
const GET_ROOM = 'GET_ROOM';
// user can request for their current state
const GET_USER = 'GET_USER';

// leave team
const LEAVE_TEAM = 'LEAVE_TEAM';

// send msg to team or room
const SEND_MSG = 'SEND_MSG';

// add private list
const ADD_PRIVATE_LIST = 'ADD_PRIVATE_LIST';

// client"s votes
const VETO_VOTES = 'VETO_VOTES';

// solo match
const FIND_SOLO_MATCH = 'FIND_SOLO_MATCH';

module.exports = {
  CONNECTION,
  CREATE_ROOM,
  JOIN_ROOM,
  CREATE_TEAM,
  JOIN_TEAM,
  CODE_SUBMISSION,
  START_COMPETITION,
  CLOSE_ROOM,
  SEND_MSG,
  LEAVE_TEAM,
  GET_ROOM,
  ADD_PRIVATE_LIST,
  VETO_VOTES,
  FIND_SOLO_MATCH,
  GET_USER,
};
