const mongoose = require('mongoose');

// Message Schema
const messageSchema = new mongoose.Schema(
  {
    room: { type: String, required: true, trim: true },
    username: { type: String, required: true, trim: true, lowercase: true },
    message: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 500,
    },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true, versionKey: false }
);

// Indexes
messageSchema.index({ room: 1, timestamp: 1 });

// Models
const Message = mongoose.model('Message', messageSchema);
module.exports = Message;
