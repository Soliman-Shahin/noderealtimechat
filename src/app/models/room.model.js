const mongoose = require('mongoose');

// Room Schema
const roomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Room name is required'],
    unique: true,
    trim: true,
  },
  users: [String],
  // users: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // List of users in the room
});

// Models
const Room = mongoose.model('Room', roomSchema);
module.exports = Room;
