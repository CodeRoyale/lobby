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
			console.log(userName + ' reconnected');
			users[userName].socket_id = socket_id;
			return { status: 1, userObj: users[userName] };
		}
		console.log(userName + ' added');
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

const updateUser = ({
	userName,
	socket_id,
	room_id,
	team_name,
	rank,
	profilePicture,
}) => {
	if ((socket_id || socket_id === '') && socket_id !== 'dummy') {
		users[userName].socket_id = socket_id;
	}
	if ((room_id || room_id === '') && room_id !== 'dummy') {
		users[userName].room_id = room_id;
	}
	if ((team_name || team_name === '') && team_name !== 'dummy') {
		users[userName].team_name = team_name;
	}
	if (rank && rank !== 'dummy') {
		users[userName].rank = rank;
	}
	if ((profilePicture || profilePicture === '') && profilePicture !== 'dummy') {
		users[userName].profilePicture = profilePicture;
	}
	return { status: 1, userObj: users[userName] };
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
