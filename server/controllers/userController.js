const UserModel = require('../models/user');

// [userID] : {     }

// all details related to a user connected to socket will be stored here


const addUser = (userName, socket_id, profilePicture, rank = 10) => {
	const returnObj = UserModel.addUser({
		userName,
		socket_id,
		// room_id,
		// team_name,
		rank,
		profilePicture,
	});
	if (returnObj.status === 0) {
		console.log(returnObj.error);
		return false;
	}
	if (returnObj.status === 1) {
		return returnObj.userObj;
	}
	return returnObj.userObj;
};

// const removeUser = (userName) => {
// 	try {
// 		if (users[userName]) {
// 			console.log(userName + ' removed');
// 			delete users[userName];
// 			return true;
// 		}
// 		return false;
// 	} catch (err) {
// 		return err.message || false;
// 	}
// };

// this is just for extra checking
// can change room_id and team_name
const updateUser = ({
	userName = 'dummy',
	socket_id = 'dummy',
	room_id = 'dummy',
	team_name = 'dummy',
	rank = 'dummy',
	profilePicture = 'dummy',
}) => {
	const returnObj = UserModel.updateUser({
		userName,
		socket_id,
		room_id,
		team_name,
		rank,
		profilePicture,
	});
	return returnObj.userObj;
};

const getUser = (userName) => {
	const returnObj = UserModel.getUser(userName);
	if (returnObj.status === 0) {
		return returnObj.error;
	}
	return returnObj.userObj;
};

const getUserData = () => {
	// need proper authorizations
	const returnObj = UserModel.getUserData();
	if (returnObj.status === 0) {
		return returnObj.error;
	}
	return returnObj.userObj;
};

module.exports = {
	addUser,
	getUserData,
	getUser,
	updateUser,
};
