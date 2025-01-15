const { Server } = require('socket.io');
const Room = require('../models/room.model');
const Message = require('../models/message.model');

const MAX_ROOM_SIZE = 5;

module.exports = (server) => {
  const io = new Server(server);
  const userSockets = new Map();

  const validateInput = (data) => {
    if (data.username && (!data.username.trim() || typeof data.username !== 'string')) {
      throw new Error('Invalid username');
    }
    if (data.room && (!data.room.trim() || typeof data.room !== 'string')) {
      throw new Error('Invalid room');
    }
    if (data.message && (!data.message.trim() || typeof data.message !== 'string')) {
      throw new Error('Invalid message');
    }
  };

  const joinRoom = async (socket, username, room) => {
    try {
      validateInput({ username, room });

      let roomData = await Room.findOne({ name: room });

      if (!roomData) {
        roomData = await Room.create({ name: room, users: [username] });
        console.log(`Created new room: ${room}`);
      } else if (
        roomData.users.length >= MAX_ROOM_SIZE &&
        !roomData.users.includes(username)
      ) {
        socket.emit('error', 'Room is full. Please join another room.');
        return;
      } else if (!roomData.users.includes(username)) {
        await Room.findOneAndUpdate(
          { name: room },
          { $addToSet: { users: username } },
          { new: true }
        );
      }

      socket.join(room);
      console.log(`${username} joined room: ${room}`);

      const pastMessages = await Message.find({ room }).sort({ timestamp: 1 });
      socket.emit('loadMessages', pastMessages);

      socket.to(room).emit('message', {
        username: 'System',
        message: `${username} has joined the room.`,
        timestamp: new Date(),
      });
    } catch (err) {
      console.error('Error joining room:', err);
      socket.emit('error', {
        code: 'ROOM_JOIN_ERROR',
        message: 'Unable to join the room. Please try again.',
      });
    }
  };

  const handleDisconnect = async (socket) => {
    const userInfo = userSockets.get(socket.id);
    if (userInfo) {
      const { username, room } = userInfo;
      console.log(`User disconnected: ${username} from room: ${room}`);

      try {
        await Room.findOneAndUpdate({ name: room }, { $pull: { users: username } });

        socket.to(room).emit('message', {
          username: 'System',
          message: `${username} has left the room.`,
          timestamp: new Date(),
        });
      } catch (err) {
        console.error('Error handling disconnect:', err);
      }

      userSockets.delete(socket.id);
    }
  };

  const handleMessage = async (socket, { room, username, message }) => {
    try {
      validateInput({ room, username, message });

      const newMessage = new Message({ room, username, message });
      await newMessage.save();

      console.log('Message saved:', newMessage); // Debugging save operation

      io.to(room).emit('message', {
        username,
        message,
        timestamp: new Date(),
      });

      console.log('Message emitted to room:', room); // Debugging emit operation
    } catch (err) {
      console.error('Error sending message:', err);
      socket.emit('error', 'Unable to send message. Please try again.');
    }
  };

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on('joinRoom', ({ username, room }) => {
      userSockets.set(socket.id, { username, room });
      joinRoom(socket, username, room);
    });

    socket.on('chatMessage', (data) => handleMessage(socket, data));

    socket.on('typing', ({ username, room }) => {
      try {
        validateInput({ username, room });
        socket.to(room).emit('typing', { username });
      } catch (err) {
        console.error('Error in typing event:', err);
      }
    });

    socket.on('stopTyping', ({ room }) => {
      try {
        validateInput({ room });
        socket.to(room).emit('stopTyping');
      } catch (err) {
        console.error('Error in stopTyping event:', err);
      }
    });

    socket.on('disconnect', () => handleDisconnect(socket));
  });
};
