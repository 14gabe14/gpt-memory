const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ChatBackupSchema = new Schema({
  message: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('ChatBackup', ChatBackupSchema);
