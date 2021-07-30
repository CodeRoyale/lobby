// connection ack
const CONNECTION_ACK = 'CONNECTION_ACK';

// connection deny
const CONNECTION_DENY = 'CONNECTION_DENY';

// update client about updated room
// currently this will only track members updation
const ROOM_UPDATED = 'ROOM_UPDATED';

// types of ROOM_UPDATED
// 1. a user joined the room
const JOINED_ROOM = 'JOINED_ROOM';
// 2. joined a team in the room
const JOINED_TEAM = 'JOINED_TEAM';
// 3 . left the team
const LEFT_TEAM = 'LEFT_TEAM';
// 4. left the room
const LEFT_ROOM = 'LEFT_ROOM';
// 5. create a team
const TEAM_CREATED = 'TEAM_CREATED';

// 6. added private member
const ADDED_PRIVATE_MEMBER = 'ADDED_PRIVATE_MEMBER';

// to forward sent message
const RCV_MSG = 'RCV_MSG';

// veto has started
const VETO_START = 'VETO_START';
// veto has stopeed
const VETO_STOP = 'VETO_STOP';

// competiion has started
const COMPETITION_STARTED = 'COMPETITION_STARTED';

// competiion has started
const COMPETITION_STOPPED = 'COMPETITION_STOPPED';

// close room
const ROOM_CLOSED = 'ROOM_CLOSED';

// code submitted
const CODE_SUBMITTED = 'CODE_SUBMITTED';

// Successful Submission
const SUCCESSFULLY_SUBMITTED = 'SUCCESSFULLY_SUBMITTED';

// Match Found
const MATCH_FOUND = 'MATCH_FOUND';

const USER_VOTED = 'USER_VOTED';

module.exports = {
  CONNECTION_ACK,
  CONNECTION_DENY,
  ROOM_UPDATED,
  JOINED_ROOM,
  JOINED_TEAM,
  LEFT_TEAM,
  LEFT_ROOM,
  RCV_MSG,
  TEAM_CREATED,
  ADDED_PRIVATE_MEMBER,
  VETO_START,
  VETO_STOP,
  COMPETITION_STARTED,
  COMPETITION_STOPPED,
  ROOM_CLOSED,
  CODE_SUBMITTED,
  SUCCESSFULLY_SUBMITTED,
  MATCH_FOUND,
  USER_VOTED,
};
