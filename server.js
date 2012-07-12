// Require dependencies
var express = require("express"),
    app = express.createServer();
var io = require('socket.io').listen(app)
, fs = require('fs')
, _ = require('underscore')._
, backbone = require('backbone');

var room_name = null;
 
//express static server
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

app.get('/room/:id', function(req, res) {
  room_name = req.params.id;
  res.redirect('/chat.html');
   
});

 
app.listen(9004);


io.sockets.on('connection', function(socket) {
 if(room_name==null){
   socket.set('room', 'room1', function() { console.log('room ' + 'room1' + ' saved'); } );
   socket.join('room1');
 } else {
  socket.set('room', room_name, function() { console.log('room ' + room_name + ' saved'); } );
  socket.join(room_name);
 }
 //io.sockets.volatile.emit('list rooms',io.sockets.manager.rooms);
 socket.on('join room', function(room){
   socket.set('room', room, function() { console.log('room ' + room + ' saved'); } );
   socket.join(room);
 });
 socket.on('set nickname', function(nickname) {
    socket.set('nickname', nickname, function() {
      console.log('Connect', nickname);
      socket.get('room', function(err, room) {
        var curr_room = room;
        var connected_msg = '<b>' + nickname + ' is now connected.</b>';
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

  socket.on('draw', function (json) {
    socket.get('room', function(err, room) {
      var curr_room = room;
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