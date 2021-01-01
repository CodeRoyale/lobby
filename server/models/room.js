//* import utils

//// using relative paths here (need to find better)
import { setRoom, setTeam } from '../controllers/userController';
import { ROOM_UPDATED } from '../socketActions/serverActions';
import { encryptData } from '../utils/auth';
import { updateUser, getUser, getUserData } from 'user';

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

const createRoom = (config) => {
	// TODO : @sastaachar

	// TODO : refactor casing (camel -> _ )

	// check req params

	if (!config.userName) {
		throw new Error('Admin tera baap hai kya ?');
	}

	//* Start creating a new room

	// we nee a *unique* room_id

	// ! change this fn
	const room_id = encryptData(config.userName);

	const room_obj = {
		config: {
			id: room_id,
			admin: config.userName,
			max_teams: getProperValue('max_teams', config['max_teams']),
			max_perTeam: getProperValue('max_perTeam', config['max_perTeam']),
			privateRoom: config.privateRoom === false,
			max_perRoom: getProperValue('max_perRoom', config['max_perRoom']),
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
				'competitionMaxQues',
				config['competitionMaxQues']
			),
			contestStartedAt: null,
			contnetEndedAt: null,
			contestOn: false,
			timeLimit: getProperValue(
				'competitionTimelimit',
				config['competitionTimelimit']
			),
			veto: {
				allQuestions: {},
				votes: {},
				voted: [],
				vetoOn: false,
				max_vote: getProperValue('vetoMaxVote', config['vetoMaxVote']),
				timeLimit: getProperValue('vetoTimeLimit', config['vetoTimeLimit']),
				quesCount: getProperValue(
					'vetoQuestionCount',
					config['vetoQuestionCount']
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

const joinRoom = (user, room_id, team_name) => {
	const { userName } = user;
	if (
		!rooms[room_id] &&
		(!rooms[room_id].config.privateRoom ||
			!rooms[room_id].state.privateList.includes(userName)) &&
		rooms[room_id].state.cur_memCount > rooms[room_id].config.max_perRoom
	) {
		throw new Error("The User doesn't meet the specifications");
	}
	//(only run if room exists) and (user is allowed if private) and (space is there)

	//quit from prev room and try again
	if (user.room_id) {
		//already in a group don't allow
		throw new Error('User already in room');
	}

	//successful (user will now be added)

	if (
		team_name &&
		rooms[room_id].team[team_name] &&
		rooms[room_id].teams[team_name].length < rooms[room_id].config.max_perTeam
	) {
		//if user passes a team and that team exist and there is space in that team
		rooms[room_id].teams[team_name].push(userName);
	} else {
		//else bench the user
		team_name = '';
		rooms[room_id].state.bench.push(userName);
	}

	//user has been added to bench or a Team
	rooms[room_id].state.cur_memCount += 1;
	rooms[room_id].state.profilePicture[userName] = user.profilePicture;
	return rooms[room_id];
};

const removeUserFromRoom = (user) => {
	const { userName, room_id, team_name } = user;

	// if user is a admin then no leave only delete possible
	// it cause of the way i am storing room_id ( == adminName)
	if (rooms[room_id].config.admin === userName) {
		throw new Error("The User is admin. Can't kick admin.");
	}
	if (team_name) {
		// if user has joined a team
		let newTeam = rooms[room_id].teams[team_name].filter(
			(ele) => ele !== userName
		);
		rooms[room_id].teams[team_name] = newTeam;
		// no need to send team_name as this will only be sent to
		// ppl in "same team"
	} else {
		// if user is on a bench
		let newBench = rooms[room_id].state.bench.filter((ele) => ele !== userName);
		rooms[room_id].state.bench = newBench;
	}

	// removed
	rooms[room_id].state.cur_memCount -= 1;

	return rooms[room_id];
};

const joinTeam = (user) => {
	const { userName, team_name } = user;
	room = rooms[user.room_id];
	// only run if user and room exits and user is in that room
	// and there is space
	if (
		!room &&
		!room.teams[team_name] &&
		room.teams[team_name].length > room.config.max_perTeam
	) {
		throw new Error(
			"The User doesn't meet the specifications to join the team"
		);
	}
	if (user.team_name) {
		//ditch prev team
		throw new Error('Already in a team');
	}

	// remove from bench
	let newBench = rooms[user.room_id].state.bench.filter(
		(ele) => ele != userName
	);
	rooms[user.room_id].state.bench = newBench;

	//in new team
	rooms[user.room_id].teams[team_name].push(userName);

	return rooms[user.room_id].teams[team_name];
};

const closeRoom = (user, forceCloseRoom = false) => {
	const room = rooms[room_id];
	const { room_id, userName } = user;

	if (!room && room.config.admin !== userName) {
		throw new Error(
			"The User doesn't meet the specifications to close the room"
		);
	}
	if (!forceCloseRoom && (room.competition.contestOn || room.veto.vetoOn)) {
		throw new Error(
			'There is a ongoing competition in the room. Please finish the competition and try closing the room.'
		);
	}
	// everyone from room bench
	let allMembers = rooms[room_id].state.bench;
	// from all teams
	Object.keys(rooms[room_id].teams).forEach((team_name) => {
		rooms[room_id].teams[team_name].forEach((user) => {
			allMembers.push(user);
		});
	});
	// delete the stupid room
	delete rooms[room_id];
	return allMembers;
};

const createTeam = (user, team_name) => {
	const { userName, room_id } = user;
	const room = rooms[room_id];
	if (!room_id || room.config.admin !== userName) {
		throw new Error('Only admin can do this');
	}
	if (
		Object.keys(room.teams).length < room.config.max_teams &&
		!room.teams[team_name]
	) {
		room.teams[team_name] = [];
		return rooms[room_id].teams;
	}
	return false;
};

const leaveTeam = (user) => {
	const { room_id, team_name, userName } = user;
	const room = rooms[room_id];

	// check if in a room and in a team
	if (!room_id && !team_name) {
		throw new Error("User doesn't meet the specifications to leave the team");
	}

	let newTeam = room.teams[team_name].filter((ele) => ele !== userName);
	room.teams[team_name] = newTeam;
	room.state.bench.push(userName);

	return newTeam;
};

module.exports = {
	createRoom,
	joinRoom,
	removeUserFromRoom,
	joinTeam,
	closeRoom,
	createTeam,
	leaveTeam,
};
