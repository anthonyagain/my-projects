const express = require('express');
const path = require('path');
const ws = require('ws');
const http = require('http');

const createServer = () => {
  let expressServer = express();
  let httpServer = http.createServer(expressServer);
  let wsServer = new ws.Server({ "server": httpServer });

  // When we get a new socket connection, pass it through to the express server to handle.
  wsServer.on('connection', (socket, request) => {
    //console.log("got a new connection to the ws server");
    // 'userSocket', because 'socket' on the request object is something else
    request.userSocket = socket;
    request.isForNewSocket = true;
    request.socketHandled = false;

    let dummyResponse = new http.ServerResponse(request);
    expressServer.handle(request, dummyResponse);
    //console.log("handle:")
    //console.log(expressServer.handle.constructor.name)

    // If the socket request didn't get received by something, close it
    // this shouldn't ever be triggered normally by frontend code
    // TODO: this is definitely currently getting triggered by frontend code,
    // looks like this view is called every time a socket message is sent,
    // so if someone opens up a socket to a non "/socket" URL thats a memory
    // leak in our app (attack vector), fix this
    //if(!request.socketHandled) {
    //  socket.close();
    //}
  });

  expressServer.ws = function addWSRoute(route, ...middlewares) {
    /*
    Only pass the request through through to our 'ws' view if it's specifically
    for initializing a new socket. Also, set the socketHandled flag on socket
    requests that we actually did something for.
    */
    let wrappedMiddlewares = middlewares.map((middleware) => {
      return (request, response, next) => {
        //console.log("triggered ws middlware in request resolution")
        if(request.isForNewSocket) {
          request.socketHandled = true;
          return middleware(request, response, next);
        } else {
          return next();
        }
      }
    });
    return expressServer.get(route, ...wrappedMiddlewares);
  }

  // Override the expressServer listen with the httpServer's listen, because for
  // some reason you have to call listen on the httpServer *only* with this setup
  expressServer.listen = (...args) => httpServer.listen(...args);

  return expressServer;
};

exports.createServer = createServer;
