users={};

const addUser = ({userName, socket_id, room_id, team_name, rank, profilePicture}) => {
    try {

        if(!userName || 
        !socket_id || 
        !profilePicture || 
        !rank ){
            throw new Error("Give all parameters");
        }
        if(userName) {
           throw new Error("User already exists");
        }
      
        const newUser = { 
            socket_id : socket_id, 
            room_id : room_id , 
            team_name : team_name , 
            rank : rank , 
            userName : userName , 
            profilePicture : profilePicture 
        }
        users[userName]  = newUser;
        return newUser;
    } catch(err) {
     return err;
   }
}

const updateUser = ({userName, socket_id, room_id, team_name, rank, profilePicture}) => {
    if(socket_id){
        users[userName].socket_id = socket_id;
    }
    if(room_id){
        users[userName].room_id = room_id;
    }
    if(team_name){
        users[userName].team_name = team_name;
    }
    if(rank){
        users[userName].rank = rank;
    }
    if(profilePicture){
        users[userName].profilePicture = profilePicture;
    }
    return users[userName];
};

module.exports = {
    addUser,
    updateUser,
  };