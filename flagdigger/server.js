const buddha = require('./server/enlightenment');

// Core game logic
const gameLoop = require('./server/gameLoop.js').gameLoop;
const roomUtils = require('./server/room.js');

let rooms = {};

gameLoop(rooms);


/*
Run this file by passing in the command line argument 'dev' or 'mode=dev' to
run it in dev mode, to make it so that React can hit the server whilst running
on a different port.
*/
let DEV_MODE = false;
if(process.argv[2] && process.argv[2].toLowerCase().indexOf("dev") !== -1) {
  DEV_MODE = true;
}

// Server router
const express = require('express');
const path = require('path');

const expressServer = require('./server/cust-express-ws').createServer();
let port = 8080;

const redis = require('redis');
const session = require('express-session');
let RedisStore = require('connect-redis')(session);
let redisClient = redis.createClient({
  host: 'localhost',
  port: 6379
});
// Flush redis each time we restart server, or else sessions will be in an
// unexpected state from past runs
redisClient.flushall();


if(DEV_MODE) {
  expressServer.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  });
  const cors = require('cors');
  expressServer.use(cors({
    credentials: true,
    origin: "http://localhost:3000",
  }));
  port = 5000;
}

// Add middleware that checks for cookie and associates request with session obj.
// If you're getting an issue with one tab having multiple sessions, just clear cache.
expressServer.use(session({
  secret: 'secret',
  store: new RedisStore({ client: redisClient }),
  resave: false,
  saveUninitialized: false
}));

expressServer.ws('/socket', (request) => {
  /*
  When the user opens a socket, that means they are requesting to be added to
  and start a new game.
  */
  console.log("call to expressServer ws /socket");
  console.log(`session id: ${request.session.id}`);

  // if user left the game but their session roomID hasn't been updated to be empty, update it
  if(request.session.roomID && !rooms[request.session.roomID].players[request.session.id])
    request.session.roomID = undefined;

  if(!request.session.roomID) {
    roomUtils.addSocketToGame(request, rooms);
  }
  else
    // TODO will this instantly close every socket? how often does this method
    // get called? if it only gets called upon socket instantiation, this is fine
    request.userSocket.close();

  // this is required because this view doesn't send any response (it can't, since
  // the other server for sockets already handled it)
  request.session.save()
});

if(DEV_MODE) {
  // Static files are served differently in production.
  expressServer.use('/static', express.static(__dirname + "/frontend_react/build/static/"));
}

expressServer.get('/set_name', (request, response) => {
  let name = request.query["name"];
  if(!name)
    name = `Guest${Math.floor(1000 + Math.random() * 9000)}`;
  request.session.name = name;
  response.json({"result": "OK"});
});

expressServer.get('*', (request, response) => {
  if(request.originalUrl == "/") {
    console.log(`call to *, original url: ${request.originalUrl}`);
    console.log(`session id: ${request.session.id}`);
  }
  response.sendFile(path.join(__dirname, './frontend_react/build/index.html'))
});

expressServer.use((err, req, res, next) => {
  // TODO: this is meant to log errors in URLs. does this work?
  if(err) console.log('Error', err);
});


expressServer.listen(port, () => console.log(`Server started on port ${port}`));
