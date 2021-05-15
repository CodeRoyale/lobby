const { encryptData } = require('../utils/auth');
//const { setRoom, getUser, setTeam, mapNameToId } = require('./userController');
const { getQuestions, getTestcase } = require('../utils/qapiConn');
const { ROOM_DEFAULTS, ROOM_LIMITS } = require('./config');
const { submitCode } = require('../utils/codeExecution');

console.log(ROOM_DEFAULTS, ROOM_LIMITS);
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

const { io } = require('../server');
const { CLOSE_ROOM } = require('../socketActions/userActions');

// this is my db for now
rooms = {};

// cant store them in room_obj cause it causes lot of problems
// to stop comepetition
stopTimers = {};
// resolvers
resolvers = {};

// room_id will be admin name

const createRoom = (config, { socket }) => {
	const user = UserController.getUser(config.userName);
	if (user.room_id) {
		// please leave current room
		return false;
	}

	// createRoom function to be called by the controller.
	const room_obj = RoomModel.createRoom(config, user);
	if (room_obj.status === 0) {
		return { err: room_obj.error };
	}
	const room_id = room_obj.returnObj.config.id;
	console.log(room_id);
	const user_obj = UserController.updateUser({
		userName: config.userName,
		room_id,
	});
	socket.join(room_id);
	// created room
	// user already has an active room
	return room_obj.returnObj;
};

// users connecting to room
// TODO -> refactor this fn if should return error
const joinRoom = ({ userName, room_id, team_name }, { socket }) => {
	const user = UserController.getUser(userName);
	const room_obj = RoomModel.joinRoom(user, room_id, team_name);
	if (room_obj.status === 0) {
		return { err: room_obj.error };
	}
	const user_obj = UserController.updateUser({ userName, room_id, team_name });
	socket.join(room_id);
	socket.to(room_id).emit(ROOM_UPDATED, {
		type: JOINED_ROOM,
		data: { userName, profilePicture: user.profilePicture },
	});
	console.log(userName, ' joined from ', room_id);
	return room_obj.returnObj;
};

const removeUserFromRoom = ({ userName }) => {
	const user = UserController.getUser(userName);
	const { room_id, team_name } = user;
	const room_obj = RoomModel.removeUserFromRoom(user);
	if (room_obj.status === 0) {
		return false;
	}
	if (room_obj.status === 1) {
		// user removed from the team
		socket.leave(`${room_id}/${team_name}`);
		socket.to(room_id).emit(ROOM_UPDATED, {
			type: LEFT_TEAM,
			data: { userName, team_name },
		});
	}
	// user removed from the room
	console.log(userName, ' removed from ', room_id);
	setRoom(userName, '');
	socket.to(room_id).emit(ROOM_UPDATED, {
		type: LEFT_ROOM,
		data: { userName },
	});
	socket.leave(room_id);
	return true;
};

const createTeam = ({ userName, team_name }, { socket }) => {
	const user = UserController.getUser(userName);
	const { room_id } = user;
	console.log(user);
	const room_obj = RoomModel.createTeam(user, team_name);
	if (room_obj.status === 0) {
		return { err: room_obj.error };
	}
	socket.to(room_id).emit(ROOM_UPDATED, {
		type: TEAM_CREATED,
		data: { team_name },
	});
	return room_obj.returnObj;
};

const joinTeam = ({ userName, team_name }, { socket }) => {
	const user = UserController.getUser(userName);
	const room_obj = RoomModel.joinTeam(user, team_name);
	if (room_obj.status === 0) {
		return { err: room_obj.error };
	}
	const user_obj = UserController.updateUser({ userName, team_name });
	socket.join(`${user.room_id}/${team_name}`);
	socket.to(user.room_id).emit(ROOM_UPDATED, {
		type: JOINED_TEAM,
		data: { userName, team_name },
	});

	return room_obj.returnObj;
};

const leaveTeam = ({ userName }, { socket }) => {
	const user = UserController.getUser(userName);
	const { room_id, team_name } = user;
	const room_obj = RoomModel.leaveTeam(user);
	if (room_obj.status === 0) {
		return { err: returnObj.error };
	}
	const user_obj = UserController.updateUser({ userName, team_name: '' });
	socket.leave(`${user.room_id}/${user.team_name}`);
	socket.to(room_id).emit(ROOM_UPDATED, {
		type: LEFT_TEAM,
		data: { userName, team_name },
	});
	return room_obj.returnObj;
};

const closeRoom = ({ userName, forceCloseRoom }, { socket }) => {
	const user = UserController.getUser(userName);
	const { room_id } = user;
	const room_obj = RoomModel.closeRoom(user, forceCloseRoom);
	if (room_obj.status === 0) {
		return { err: returnObj.error };
	}

	let allMembers = room_obj.returnObj;
	console.log(allMembers);
	// not need to chage room data since we are going to delete it
	allMembers.forEach((userName) => {
		// this is a server action notify all
		// TODO --> add kick all and remove functions for sockets
		UserController.updateUser({ userName, room_id: '', team_name: '' });
	});

	// delete the stupid room
	const dataToEmit = 'Room Closed';
	socket.to(room_id).emit(ROOM_CLOSED, {
		data: { dataToEmit },
	});
	socket.emit(ROOM_CLOSED);
	return true;
};

//TODO --> DELETE TEAM

const banMember = ({ room_id }) => {
	try {
	} catch (err) {
		return { error: err.message };
	}
};

const addPrivateList = ({ userName, privateList }, { socket }) => {
	// only private rooms can have private lists
	const user = UserController.getUser(userName);
	const room_obj = RoomModel.addPrivateList(user, privateList);

	if (room_obj.status === 0) {
		return { err: returnObj.error };
	}

	socket.to(user.room_id).emit(ROOM_UPDATED, {
		type: ADDED_PRIVATE_MEMBER,
		data: { privateList: room_obj.returnObj },
	});
	return room_obj.returnObj;
};

const handleUserDisconnect = ({ userName }) => {
	// need to fill this
	try {
	} catch (err) {
		return { error: err.message };
	}
};

const forwardMsg = ({ userName, content, toTeam }, { socket }) => {
	try {
		const { room_id, team_name } = UserController.getUser(userName);

		// not in a room
		if (!room_id || !content) return false;

		let rcvrs = room_id;
		if (toTeam && team_name) {
			rcvrs += `/${team_name}`;
		}
		socket.to(rcvrs).emit(RCV_MSG, { userName, content, toTeam });
		return true;
	} catch (err) {
		return { error: err.message };
	}
};

const registerVotes = ({ userName, votes }, { socket }) => {
	const { room_id, team_name } = UserController.getUser(userName);
	const room_obj = RoomModel.registerVotes({
		room_id,
		userName,
		team_name,
		votes,
	});
	if (room_obj.status === 0) {
		return { err: returnObj.error };
	}
	socket.to(room_id).emit(USER_VOTED, { userName, votes });
	socket.emit(USER_VOTED, { userName, votes });

	if (room_obj.status === 2) {
		clearTimeout(stopTimers[room_id].vetoTimer);
		// stoping code
		// TODO --> needs refactoring
		socket.to(room_id).emit(VETO_STOP, room_obj.returnObj);
		socket.emit(VETO_STOP, room_obj.returnObj);

		// resolvers are stored here -> example of shitty coding
		resolvers[room_id](room_obj.returnObj);
	}
	return room_obj.returnObj;
};

const doVeto = async (quesIds, room_id, count, socket) => {
	return new Promise((resolve, reject) => {
		let state = 'start';
		const room_check = RoomModel.doVetoRequirements({ room_id });
		const room = room_check.returnObj;

		const room_obj = RoomModel.doVeto(quesIds, room_id, count, state);
		socket.to(room_id).emit(VETO_START, quesIds);
		socket.emit(VETO_START, quesIds);

		resolvers[room_id] = resolve;
		state = 'stop';
		stopTimers[room_id].vetoTimer = setTimeout(() => {
			room_obj = RoomModel.doVeto(quesIds, room_id, count, state);
			const results = room_obj.returnObj;
			socket.to(room_id).emit(VETO_STOP, results);
			socket.emit(VETO_STOP, results);

			resolve(results);
		}, room.competition.veto.timeLimit);
	});
};

const startCompetition = async ({ userName }, { socket }) => {
	const user = UserController.getUser(userName);
	let state = 'start';
	const room_check = RoomModel.startCompetitionRequirements(user);
	if (room_check.status === 0) {
		return { err: returnObj.error };
	}
	const room = room_check.returnObj;
	const room_id = room.config.id;
	console.log('Starting competition', userName);
	stopTimers[room_id] = {};
	const allQuestions = await getQuestions(room.competition.veto.quesCount);
	await doVeto(allQuestions, room_id, room.competition.max_questions, socket);

	const room_obj = RoomModel.startCompetition(user, state);
	socket.to(room_id).emit(COMPETITION_STARTED, room_obj);
	socket.emit(COMPETITION_STARTED, room_obj);

	state = 'stop';
	stopTimers[room_id].competitionTimer = setTimeout(() => {
		room_obj = RoomModel.startCompetition(user, state);
		socket.to(room_id).emit(COMPETITION_STOPPED, room_obj.returnObj);
		socket.emit(COMPETITION_STOPPED, room_obj.returnObj);
	}, room.competition.timeLimit);

	return room_obj.returnObj;
};

// @util function to check if all teams have atleast min_size member
const atLeastPerTeam = (room_id, min_size = 1) => {
	try {
		for (const [name, memList] of Object.entries(rooms[room_id].teams)) {
			if (memList.length < min_size) return false;
		}
		return true;
	} catch (err) {
		return { error: err.message };
	}
};

const getRoomData = ({ userName, room_id }) => {
	try {
		const user = UserController.getUser(userName);
		if (user.room_id !== room_id) throw new Error('User not in room');
		return rooms[room_id];
	} catch (err) {
		return { error: err.message };
	}
};

const getRoomsData = () => {
	try {
		return rooms;
	} catch (err) {
		return { error: err.message };
	}
};

const codeSubmission = async (
	{ userName, problemCode, code, langId },
	{ socket }
) => {
	const quesId = problemCode;
	const { room_id, team_name } = UserController.getUser(userName);
	const testcase = await getTestcase(problemCode);
	const room_check = RoomModel.codeSubmissionRequirements(
		room_id,
		team_name,
		testcase,
		langId
	);
	if (room_check.status === 0) {
		return { err: returnObj.error };
	}
	const room = room_check.returnObj;
	submitCode(testcase, code, langId, (dataFromSubmitCode) => {
		let allPass = true;
		dataFromSubmitCode.submissions.forEach((result) => {
			if (result.status_id !== 3) {
				allPass = false;
				return false;
			}
		});
		// code submitted
		socket.emit(CODE_SUBMITTED, {
			data: dataFromSubmitCode,
			sucess: allPass,
			problemCode,
			team_name,
		});

		if (allPass) {
			// tell everyone except user
			let state = 'one-pass';
			const room_obj = RoomModel.codeSubmission(
				room_id,
				state,
				team_name,
				quesId
			);
			console.log(room_obj);

			socket
				.to(room_id)
				.emit(SUCCESSFULLY_SUBMITTED, { problemCode, team_name });

			// if user's team solved all questions
			// can also use Object.keys(rms.cpms.questions) and maybe <=
			if (
				room.competition.max_questions ===
				room.competition.scoreboard[team_name].length
			) {
				if (stopTimers[room_id].competitionTimer)
					clearTimeout(stopTimers[room_id].competitionTimer);
				state = 'all-pass';
				const room_obj = RoomModel.codeSubmission(room_id, state);
				socket.to(room_id).emit(COMPETITION_STOPPED, room_obj.returnObj);
				socket.emit(COMPETITION_STOPPED, room_obj.returnObj);
			}
		}
	});
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
	handleUserDisconnect,
	addPrivateList,
	startCompetition,
	registerVotes,
	codeSubmission,
};
