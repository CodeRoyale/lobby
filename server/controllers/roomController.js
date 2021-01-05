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
const UserModel = require('../models/user');

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
	const user = UserModel.getUser(config.userName);
	if (user.room_id) {
		// please leave current room
		return false;
	}

	// createRoom function to be called by the controller.
	const room_obj = RoomModel.createRoom(config, user);
	const room_id = room_obj.config.id;

	const user_obj = UserModel.updateUser(config.userName, room_id);
	socket.join(room_id);
	// created room
	// user already has an active room
	//return { error: err.message };
};

// users connecting to room
// TODO -> refactor this fn if should return error
const joinRoom = ({ userName, room_id, team_name }, { socket }) => {
	const room_obj = RoomModel.joinRoom(userName, room_id, team_name);
	const user_obj = UserModel.updateUser(userName, room_id, team_name);
	const user = UserModel.getUser(userName);
	socket.join(room_id);
	socket.to(room_id).emit(ROOM_UPDATED, {
		type: JOINED_ROOM,
		data: { userName, profilePicture: user.profilePicture },
	});
	console.log(userName, ' joined from ', room_id);
	return true;
};

const removeUserFromRoom = ({ userName }) => {
	try {
		// remove from room
		const { room_id, team_name } = getUser(userName);

		// if user is a admin then no leave only delete possible
		// it cause of the way i am storing room_id ( == adminName)
		if (rooms[room_id].config.admin === userName) {
			return false;
		}

		if (team_name) {
			// if user has joined a team
			let newTeam = rooms[room_id].teams[team_name].filter(
				(ele) => ele !== userName
			);
			rooms[room_id].teams[team_name] = newTeam;

			// no need to send team_name as this will only be sent to
			// ppl in "same team"
			socket.leave(`${room_id}/${team_name}`);
			socket.to(room_id).emit(ROOM_UPDATED, {
				type: LEFT_TEAM,
				data: { userName, team_name },
			});
		} else {
			// if user is on a bench
			let newBench = rooms[room_id].state.bench.filter(
				(ele) => ele !== userName
			);
			rooms[room_id].state.bench = newBench;
		}

		// removed
		rooms[room_id].state.cur_memCount -= 1;

		// tell others
		console.log(userName, ' removed from ', room_id);
		setRoom(userName, '');
		socket.to(room_id).emit(ROOM_UPDATED, {
			type: LEFT_ROOM,
			data: { userName },
		});
		socket.leave(room_id);

		return true;
	} catch (err) {
		return { error: err.message };
	}
};

const createTeam = ({ userName, team_name }, { socket }) => {
	try {
		// if more teams are allowed
		//if team_name is not already used
		// and user is admin
		const { room_id } = getUser(userName);
		// if user not in room or not admin of the room
		if (!room_id || rooms[room_id].config.admin !== userName) {
			throw new Error('Only admin can do this');
		}

		if (
			Object.keys(rooms[room_id].teams).length <
				rooms[room_id].config.max_teams &&
			!rooms[room_id].teams[team_name]
		) {
			rooms[room_id].teams[team_name] = [];

			// tell everyone
			socket.to(room_id).emit(ROOM_UPDATED, {
				type: TEAM_CREATED,
				data: { team_name },
			});
			return rooms[room_id].teams;
		}
		return false;
	} catch (err) {
		return { error: err.message };
	}
};

const joinTeam = ({ userName, team_name }, { socket }) => {
	try {
		const user = getUser(userName),
			room = rooms[user.room_id];
		// only run if user and room exits and user is in that room
		// and there is space
		if (
			room &&
			room.teams[team_name] &&
			room.teams[team_name].length < room.config.max_perTeam
		) {
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
			setTeam(userName, team_name);

			// tell team-mates
			// tell team-mates
			socket.join(`${user.room_id}/${team_name}`);
			socket.to(user.room_id).emit(ROOM_UPDATED, {
				type: JOINED_TEAM,
				data: { userName, team_name },
			});

			return rooms[user.room_id].teams[team_name];
		}
		return false;
	} catch (err) {
		return { error: err.message };
	}
};

const leaveTeam = ({ userName }, { socket }) => {
	try {
		const { room_id, team_name } = getUser(userName);
		// check if in a room and in a team
		if (room_id && team_name) {
			let newTeam = rooms[room_id].teams[team_name].filter(
				(ele) => ele !== userName
			);
			rooms[room_id].teams[team_name] = newTeam;
			rooms[room_id].state.bench.push(userName);
			setTeam(userName, '');

			// tell eveyone
			socket.leave(`${room_id}/${team_name}`);
			socket.to(room_id).emit(ROOM_UPDATED, {
				type: LEFT_TEAM,
				data: { userName, team_name },
			});

			return true;
		}
		return false;
	} catch (err) {
		return { error: err.message };
	}
};

const closeRoom = ({ userName }, { socket }) => {
	try {
		const { room_id } = getUser(userName);
		if (rooms[room_id] && rooms[room_id].config.admin === userName) {
			// everyone from room bench
			let allMembers = rooms[room_id].state.bench;
			// from all teams
			Object.keys(rooms[room_id].teams).forEach((team_name) => {
				rooms[room_id].teams[team_name].forEach((user) => {
					allMembers.push(user);
				});
			});
			console.log(allMembers);
			// not need to chage room data since we are going to delete it
			allMembers.forEach((userName) => {
				// this is a server action notify all
				// TODO --> add kick all and remove functions for sockets
				setRoom(userName, '');
			});

			// delete the stupid room
			const dataToEmit = 'Room Closed';
			socket.to(room_id).emit(ROOM_CLOSED, {
				data: { dataToEmit },
			});
			socket.emit(ROOM_CLOSED);
			delete rooms[room_id];
			return true;
		}
		return false;
	} catch (err) {
		return { error: err.message };
	}
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
	let user = getUser(userName);
	room = rooms[user.room_id];
	room_id = user.room_id;

	if (room && room.config.admin === userName && room.config.privateRoom) {
		privateList.forEach((ele) => {
			if (!room.state.privateList.includes(ele)) {
				rooms[room_id].state.privateList.push(ele);
			}
		});
		socket.to(room_id).emit(ROOM_UPDATED, {
			type: ADDED_PRIVATE_MEMBER,
			data: { privateList: rooms[room_id].state.privateList },
		});
		return rooms[room_id].state.privateList;
	} else {
		return false;
	}
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
		const { room_id, team_name } = getUser(userName);

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
	try {
		const { room_id, team_name } = getUser(userName),
			room = rooms[room_id],
			{ vetoOn, voted, allQuestions, max_vote } = room.competition.veto;

		// should be in a team
		// veto should be on
		// should not have already voted
		if (!team_name || !vetoOn || voted.includes(userName)) {
			throw new Error('Not in a team or voting stopped or already voted');
		}

		// valid votes only
		votes = votes.filter((id) => allQuestions.includes(id));
		// votes should be unique
		votes = [...new Set(votes)];
		// should not excede max_votes allowed
		if (votes.length > max_vote) votes = votes.slice(0, max_vote);
		// note votes
		votes.forEach((id) => {
			rooms[room_id].competition.veto.votes[id] += 1;
		});
		rooms[room_id].competition.veto.voted.push(userName);
		socket.to(room_id).emit(USER_VOTED, { userName, votes });
		socket.emit(USER_VOTED, { userName, votes });
		// veto.votes.length == SUM(all teams.length)
		// TODO -->
		// NOW -> O(n*m)
		// store calculated in obj to make in O(n)
		let totalRequired = 0;
		Object.keys(rooms[room_id].teams).forEach((team_name) => {
			totalRequired += rooms[room_id].teams[team_name].length;
		});

		if (totalRequired === rooms[room_id].competition.veto.voted.length) {
			// stop the default timer
			clearTimeout(stopTimers[room_id].vetoTimer);

			// stoping code
			// TODO --> needs refactoring
			rooms[room_id].competition.veto.vetoOn = false;
			let results = Object.entries(rooms[room_id].competition.veto.votes);
			results = results
				.sort((a, b) => b[1] - a[1])
				.slice(0, rooms[room_id].competition.max_questions);
			// take only qids
			results = results.map((ele) => ele[0]);
			rooms[room_id].competition.questions = results;

			socket.to(room_id).emit(VETO_STOP, results);
			socket.emit(VETO_STOP, results);

			// resolvers are stored here -> example of shitty coding
			resolvers[room_id](results);
		}

		// cant return time or resolver funtions
		// they are self referencing soo max call stack error

		return rooms[room_id].competition.veto.votes;
	} catch (err) {
		return { error: err.message };
	}
};

const doVeto = async (quesIds, room_id, count, socket) => {
	return new Promise((resolve, reject) => {
		try {
			const room = rooms[room_id];
			if (
				rooms[room_id].competition.contestOn ||
				rooms[room_id].competition.veto.vetoOn
			) {
				throw new Error('Veto not allowed now');
			}

			// set the room state
			rooms[room_id].competition.veto.vetoOn = true;
			rooms[room_id].competition.veto.allQuestions = quesIds;

			// iitailize votes with 0
			rooms[room_id].competition.veto.votes = {};
			rooms[room_id].competition.veto.voted = [];
			quesIds.forEach((id) => {
				rooms[room_id].competition.veto.votes[id] = 0;
			});

			// tell every1 voting started
			socket.to(room_id).emit(VETO_START, quesIds);
			socket.emit(VETO_START, quesIds);

			// shitty code here
			resolvers[room_id] = resolve;
			stopTimers[room_id].vetoTimer = setTimeout(() => {
				// no need to remove listeners
				// all of them are volatile listners
				// calculate veto results

				rooms[room_id].competition.veto.vetoOn = false;
				let results = Object.entries(rooms[room_id].competition.veto.votes);
				results = results.sort((a, b) => b[1] - a[1]).slice(0, count);
				// take only qids
				results = results.map((ele) => ele[0]);
				rooms[room_id].competition.questions = results;

				socket.to(room_id).emit(VETO_STOP, results);
				socket.emit(VETO_STOP, results);

				resolve(results);
			}, room.competition.veto.timeLimit);
		} catch (err) {
			reject(err);
		}
	});
};

const startCompetition = async ({ userName }, { socket }) => {
	try {
		const { room_id } = getUser(userName),
			room = rooms[room_id];

		// room exists
		// user is admin
		// 2 or more members are there
		// 2 or more teams required
		// each team should hav atleast member
		// and no ongoing contest
		if (
			!room ||
			room.config.admin !== userName ||
			room.state.cur_memCount < 2 ||
			Object.keys(room.teams).length < 2 ||
			!atLeastPerTeam(room_id) ||
			room.competition.contestOn ||
			room.competition.veto.vetoOn
		) {
			throw new Error('Room does not meet requirements');
		}

		console.log('Starting competition', userName);
		// start veto now and wait for it to end
		stopTimers[room_id] = {};
		const allQuestions = await getQuestions(room.competition.veto.quesCount);
		await doVeto(allQuestions, room_id, room.competition.max_questions, socket);

		// start competition now
		rooms[room_id].competition.contestOn = true;
		rooms[room_id].competition.contestStartedAt = Date.now();
		Object.keys(rooms[room_id].teams).forEach((ele) => {
			rooms[room_id].competition.scoreboard[ele] = [];
		});

		socket.to(room_id).emit(COMPETITION_STARTED, rooms[room_id].competition);
		socket.emit(COMPETITION_STARTED, rooms[room_id].competition);

		// code for stopping competition
		stopTimers[room_id].competitionTimer = setTimeout(() => {
			rooms[room_id].competition.contestOn = false;
			rooms[room_id].competition.contnetEndedAt = Date.now();
			socket.to(room_id).emit(COMPETITION_STOPPED, rooms[room_id].competition);
			socket.emit(COMPETITION_STOPPED, rooms[room_id].competition);
		}, room.competition.timeLimit);

		return rooms[room_id].competition;
	} catch (err) {
		return { error: err.message };
	}
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
		const user = getUser(userName);
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
	try {
		const quesId = problemCode;
		const { room_id, team_name } = getUser(userName);
		const testcase = await getTestcase(problemCode);

		if (
			rooms[room_id] &&
			rooms[room_id].teams[team_name] &&
			rooms[room_id].competition.contestOn &&
			testcase !== null &&
			langId !== null
		) {
			submitCode(testcase, code, langId, (dataFromSubmitCode) => {
				let allPass = true;

				dataFromSubmitCode.submissions.forEach((result) => {
					if (result.status_id !== 3) {
						allPass = false;
						return;
					}
				});

				// code submitted
				socket.emit(CODE_SUBMITTED, {
					data: dataFromSubmitCode,
					sucess: allPass,
				});

				if (allPass) {
					// tell everyone except user
					if (
						!rooms[room_id].competition.scoreboard[team_name].includes(quesId)
					)
						rooms[room_id].competition.scoreboard[team_name].push(quesId);

					socket
						.to(room_id)
						.emit(SUCCESSFULLY_SUBMITTED, { quesId, team_name });

					// if user's team solved all questions
					// can also use Object.keys(rms.cpms.questions) and maybe <=
					if (
						rooms[room_id].competition.max_questions ===
						rooms[room_id].competition.scoreboard[team_name].length
					) {
						if (stopTimers[room_id].competitionTimer)
							clearTimeout(stopTimers[room_id].competitionTimer);
						rooms[room_id].competition.contestOn = false;
						rooms[room_id].competition.contnetEndedAt = Date.now();
						socket
							.to(room_id)
							.emit(COMPETITION_STOPPED, rooms[room_id].competition);
						socket.emit(COMPETITION_STOPPED, rooms[room_id].competition);
					}
				}
			});

			// code has been sent
			return true;
		} else {
			return false;
		}
	} catch (err) {
		return { error: err.message };
	}
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
