// Require dependencies
var express = require("express"),
    app = express.createServer();
var io = require('socket.io').listen(app)
, fs = require('fs')
, _ = require('underscore')._
, backbone = require('backbone');


 
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
app.get('/db', function(req, res){
    res.send('Hello World '+response); 
});
 
app.listen(9004);

// creating a new websocket to keep the content updated without any AJAX request
io.sockets.on('connection', function(socket) {
 
  socket.on('set nickname', function(nickname) {
    // Save a variable 'nickname'
    socket.set('nickname', nickname, function() {
      console.log('Connect', nickname);
      var connected_msg = '<b>' + nickname + ' is now connected.</b>';
 
      io.sockets.volatile.emit('broadcast_msg', connected_msg);
    });
  });
 
  socket.on('emit_msg', function (msg) {
    // Get the variable 'nickname'
    socket.get('nickname', function (err, nickname) {
      console.log('Chat message by', nickname);
      io.sockets.volatile.emit( 'broadcast_msg' , nickname + ': ' + msg );
    });
  });

  socket.on('draw', function (json) {
      io.sockets.volatile.emit( 'update_sketch' , json);
      
  });
 
  // Handle disconnection of clients
  socket.on('disconnect', function () {
    socket.get('nickname', function (err, nickname) {
      console.log('Disconnect', nickname);
      var disconnected_msg = '<b>' + nickname + ' has disconnected.</b>'
 
      // Broadcast to all users the disconnection message
      io.sockets.volatile.emit( 'broadcast_msg' , disconnected_msg);
    });
  });
});
