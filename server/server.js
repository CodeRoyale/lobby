// basic setting up
if (process.env.NODE_ENV !== 'production') require('dotenv').config();

// importing packages
import express, { json } from 'express';
import { hostname } from 'os';
import cors from 'cors';
import { createServer } from 'http';
import socketio from 'socket.io';

const PORT = process.env.PORT || 2500;



// importing controllers
import { authUser, handleUserEvents } from './controllers/socketController';

// crearte server using http
// we need to use http here for socket.io
const app = express();
const server = createServer(app);

// HACKER BOII
const whitelist = ['http://localhost:3000', 'https://coderoyale.netlify.app'];
const corsOptions = {
  origin: function (origin, callback) {
    // the !origin is for services like postman

    if (whitelist.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      // i dont like this it prints the shit
      callback(new Error('Not allowed by CORS'));
    }
  },
  // no need for cookies
  credentials: false,
};

// middlewares
app.use(cors(corsOptions));
app.use(json());

// Routes
app.use('/', require('./routes/main'));
app.use('/users', require('./routes/users'));
app.use('/rooms', require('./routes/rooms'));

// socket io server
const io = socketio(server, {
  handlePreflightRequest: (req, res) => {
    const headers = {
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Origin':
        process.env.NODE_ENV === 'development'
          ? 'http://localhost:3000'
          : 'https://coderoyale.netlify.app', // or the specific origin you want to give access to,
      'Access-Control-Allow-Credentials': true,
    };
    res.writeHead(200, headers);
    res.end();
  },
});

try {
  // passing io(for 1v1 we need this) and socket(for general purpose)
  io.use(authUser).on('connection', (socket) =>
    handleUserEvents({ socket, io })
  );
} catch (err) {
  console.log(err.message);
}

// start listening
server.listen(PORT, () => {
  console.log(`Loby Server running at - ${hostname()} on PORT : ${PORT}`);
});

export default {
  server,
  io,
};
