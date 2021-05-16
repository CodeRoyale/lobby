# CodeRoyale-Lobby

This is the lobby-backend for **CodeRoyale**

### CONNECTION

// TBD

### CREATE_ROOM - User tries to create a Room

- #### Input Params

  This function will take the **config** as a parameter in which the config should have values for **max_teams**, **max_perTeam**, **privateRoom**, **max_perRoom**, **max_questions** and **timeLimit** or **else default values** will be taken

  ```
  max_teams: config.max_teams || 2,
  max_perTeam: config.max_perTeam || 3,
  privateRoom: config.privateRoom === false,
  max_perRoom: config.max_perRoom || 10,
  max_questions: config.max_questions
  timeLimit: config.timeLimit || 2700000
  ```

- #### Return

  1. If the room is created then **return rooms[room_id]**
  2. If the user is already in an active room then **return false**

### JOIN_ROOM - User tries to join a Room

- #### Input Params

  This function will take the parameters: **room_id** and **team_name**

- #### Socket Action

  This function will emit **ROOM_UPDATED**

  ```
  (
  type: JOINED_ROOM,
  data: { userName },
  )
  ```

  If the user wants to join team while joining room, then this condition should be satisfied:

  ```
  (
      team_name &&
      rooms[room_id].teams[team_name] &&
      rooms[room_id].teams[team_name].length < rooms[room_id].config.max_perTeam
  )
  ```

  then socket action **ROOM_UPDATED** will be emited.

  ```
  (
      type: JOINED_TEAM,
      data: { userName, team_name },
  )
  ```

- #### Return

  1. If the user has joined the room, then **return rooms[room_id]**
  2. If the user is already in an active room then **return false**
  3. If this condition is not satisfied, then **return false**

  ```
  (
      rooms[room_id] &&
      !rooms[room_id].config.privateRoom ||
      rooms[room_id].state.privateList.includes(userName)) &&
      rooms[room_id].state.cur_memCount < rooms[room_id].config.max_perRoom
  )
  ```

### CREATE_TEAM - User tries to create a Team

- #### Input Params

  This function will take the parameter : **team_name**

- #### Socket Action

  This function will emit **ROOM_UPDATED**

  ```
  (
    type: TEAM_CREATED,
    data: { team_name },
  )
  ```

- #### Return

  1. If the team is created then **return rooms[room_id].teams**
  2. If this condition is not satisfied, then **return false**

  ```
  (!room_id || rooms[room_id].config.admin !== userName)
  ```

  3. If this condition is not satisfied, then **return false**

  ```
  (
      (rooms[room_id].teams).length <
      rooms[room_id].config.max_teams &&
      !rooms[room_id].teams[team_name]
  )
  ```

### JOIN_TEAM - User tries to join a Team

- #### Input Params

  This function will take the parameter : **team_name**

- #### Socket Action

  This function will emit **ROOM_UPDATED**

  ```
  (
    type: JOINED_TEAM,
    data: { userName, team_name },
  )
  ```

- #### Return

  1. If the user joined a team then **return rooms[user.room_id].teams[team_name]**
  2. If the user is already in an active room then **return false**
  3. If this condition is not satisfied, then **return false**

  ```
  (
      room &&
      room.teams[team_name] &&
      room.teams[team_name].length < room.config.max_perTeam
  )
  ```

### CODE_SUBMISSION - User tries submits the code

// TBD

### START_COMPETITION

- #### Input Params

  This function will take no parameters

- #### Socket Action

  This function will emit **COMPETITION_STARTED**

  ```
  rooms[room_id].competition
  ```

  If Timeout, it will emit **COMPETITION_STOPPED**

- #### Return

  If the competition starts then **return rooms[room_id].competition**

### CLOSE_ROOM

- #### Input Params

  This function takes **no parameter**

- #### Server Action

  This function will emit **ROOM_CLOSED**

  ```
      data: { dataToEmit }
  ```

- #### User Action

  This function will emit **CLOSE_ROOM**

- #### Return

  1. If the room is closed/deleted, then **return true**
  2. If the room does not exist, then **return false**

### SEND_MSG

- #### Input Params

  This function will take the parameters : **content** and **toTeam**

- #### Socket Action

  This function will emit **RCV_MSG**

  ```
  (
    { userName, content, toTeam },
  )
  ```

- #### Return

  1. If the message is forwarded, then it will **emit RCV_MSG** and will **return true**
  2. If the room_id is not there or content is not given, then **return false**

### LEAVE_TEAM

- #### Input Params

  This function takes **no parameter**

- #### Socket Action

  This function will emit **ROOM_UPDATED**

  ```
  (
    type: LEFT_TEAM,
    data: { userName, team_name }
  )
  ```

- #### Return

  1. If the user leaves the team, then **return true**
  2. If the room and team does not exist, then **return false**

### GET_ROOM

- #### Input Params

  This function will take the parameter : **room_id**

- #### Return

  It returns **rooms[room_id]**

### ADD_PRIVATE_LIST

- #### Input Params

  This function will take the parameter : **privateList**

- #### Socket Action

  This function will emit **ROOM_UPDATED**

  ```
  (
    type: ADDED_PRIVATE_MEMBER,
    data: { privateList: rooms[room_id].state.privateList },
  )
  ```

- #### Return

  If the user is not in the private list, then **return true**

### VETO_VOTES

- #### Input Params

  This function will take the parameter : **votes**

- #### Return

  The details of the votes are stored, then **return rooms[room_id].competition.veto**
