const users={};

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