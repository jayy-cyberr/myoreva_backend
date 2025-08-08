const mongoose = require("mongoose");

const subscriberSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  subscribedAt: {
    type: Date,
    default: Date.now,
  },
});


const newsletterSchema = new mongoose.Schema({
  subject: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  template: {
    type: String,
    required: true,
    enum: ['modern', 'classic', 'minimal', 'vibrant'],
    default: 'modern'
  },
  image: {
    type: String, 
    default: null
  },
  sentTo: [{
    type: String, 
  }],
  sentAt: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['draft', 'sent', 'failed'],
    default: 'sent'
  }
});

const Subscriber = mongoose.model("Subscriber", subscriberSchema);
const Newsletter = mongoose.model("Newsletter", newsletterSchema);

module.exports = { Subscriber, Newsletter };
