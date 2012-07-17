// *TODO: Add mustache template rendering and mysql to generate dynamic pages

// Require dependencies
var express = require("express"),
    app = express.createServer();
var io = require('socket.io').listen(app)
, fs = require('fs')
, _ = require('underscore')._
, backbone = require('backbone');

//set an inital value for the room name
var room_name = null;
 
//express static server configuration
app.configure(function(){    
  app.use(express.methodOverride());
  app.use(express.bodyParser());
  app.use(express.static(__dirname + '/public'));
  app.use(express.errorHandler({
    dumpExceptions: true,
    showStack: true
  }));
  app.use(app.router);
});

//the actual "serving" goes on here
// app.get() has 2 parameters:
// *access url
// *callback function that sends the file
app.get("/", function(req, res) {
  res.redirect("/index.html");
});

app.get("/css/bootstrap-responsive.css", function(req, res) {
  res.redirect("/css/bootstrap-responsive.css");
});
app.get("/js/raphael.js", function(req, res) {
  res.redirect("/js/raphael.js");
});
app.get("/js/json2.js", function(req, res) {
  res.redirect("/js/json2.js");
});
app.get("/js/raphael.sketchpad.js", function(req, res) {
  res.redirect("/js/raphael.sketchpad.js");
});

//optionally pass data through the url
// :id - placeholder for variable
app.get('/room/:id', function(req, res) {
  //access the variable with req.params.id     
  room_name = req.params.id;
  res.redirect('/chat.html');
});

//tell the server which port to listen on 
app.listen(9004);

//START SOCKET HANDLING
// 'connection' is a wrapper for all other events
// sending events uses the global io.sockets
// but incoming events are attached to socket, 
// which refers to the client's socket passed into the callback
io.sockets.on('connection', function(socket) {
 //firstly make sure there is a room name    
 if(room_name==null){
   //default room name to room1      
   socket.set('room', 'room1', function() { console.log('room ' + 'room1' + ' saved'); } );
   socket.join('room1');
 } else {
  //or set it to the value of the variable room_name     
  socket.set('room', room_name, function() { console.log('room ' + room_name + ' saved'); } );
  socket.join(room_name);
 }
 //io.sockets.manager.rooms is an array of objects containing all existing rooms
 
 //below are all the functions of the server
 // *join room
 // *set nickname
 // *emit message
 // *draw
 // *disconnect
 //these are handled by listening for events from the client, and responding
 //the functions used for communication are called socket.on() and io.socket.emit
 
 //socket.on listens for an event and invokes a callback to handle any data passed in
 //it has 2 parameters:
 // *event name
 // *callback - parameters are data passed with the event
 socket.on('join room', function(room){
   socket.set('room', room, function() { console.log('room ' + room + ' saved'); } );
   socket.join(room);
 });
 socket.on('set nickname', function(nickname) {
    //socket.set stores a named variable in the connected socket
    //it has 3 parameters:
    // *variable name
    // *variable value
    // *callback that executes on success of the operation
    socket.set('nickname', nickname, function() {
      console.log('Connect', nickname);
      //socket.get retrieves a value stored in the socket by name
      //it has 2 parameters:
      // *variable name
      // *callback with requested value as a parameter 
      socket.get('room', function(err, room) {
        var curr_room = room;
        var connected_msg = '<b>' + nickname + ' is now connected.</b>';
        //io.sockets.emit sends an event and any attached data to the client
        //io.sockets.in(*room*).emit sends the event to all users in *room*
        io.sockets.in(curr_room).emit('broadcast_msg', connected_msg);
      });
    });
  });
 
  socket.on('emit_msg', function (msg) {
    // Get the variable 'nickname'
    socket.get('room', function(err, room) {
      var curr_room = room;
      socket.get('nickname', function (err, nickname) {
        console.log('Chat message by', nickname + ': ' + curr_room);
        io.sockets.in(curr_room).emit('broadcast_msg' , nickname + ': ' + msg );
      });
    });
  });
  //get updated sketchpad data whenever anyone draws
  socket.on('draw', function (json) {
    //grab the name of the room  
    socket.get('room', function(err, room) {
      var curr_room = room;
      //and hand the new sketch data out to all the users in the room
      io.sockets.in(curr_room).emit( 'update_sketch' , json);
    });
  });
 
  // Handle disconnection of clients
  socket.on('disconnect', function () {
    socket.get('room', function(err, room) {
      var curr_room = room;
      socket.get('nickname', function (err, nickname) {
        console.log('Disconnect', nickname);
        var disconnected_msg = '<b>' + nickname + ' has disconnected.</b>'
        // Broadcast to all users the disconnection message
        io.sockets.in(curr_room).emit( 'broadcast_msg' , disconnected_msg);
      });
    });
  });
});