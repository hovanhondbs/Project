// models/Notification.js
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type:   { type: String, default: 'info' }, // vd: join_request_result
    title:  { type: String, required: true },
    message:{ type: String, required: true },
    link:   { type: String },                  // vd: /classes/:id
    seen:   { type: Boolean, default: false, index: true },
    meta:   { type: Object, default: {} },
  },
  { timestamps: true }
);

module.exports = mongoose.model('notifications', notificationSchema);
