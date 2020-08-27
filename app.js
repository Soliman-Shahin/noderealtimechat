var express = require('express');
var socket = require('socket.io');

var application = express();
var server = application.listen(5000, function() {
    console.log('Your Server Is running at http://localhost:5000');
});

application.use(express.static('public'));

var sio = socket(server);

sio.on('connection', function(visitor) {

    console.log('we have a new visitor as id=>', visitor.id);

    visitor.on('message', function(data) {
        sio.sockets.emit('new_msg', data);
    });


    visitor.on('borad', function(data) {
        visitor.broadcast.emit('new_borad', data);
    });


});