const users={};

const addUser = (userData) => {
    try {
      if(userData.userName) {
           throw new Error("User already exists");
      }
      const newUser = { socket_id : userData.socket_id, room_id : userData.room_id  }
      users[ userData.userName]  = newUser;
      return newUser;
    } catch(err) {
     return err;
   }
}