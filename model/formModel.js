const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: [String], 
    required: true
  },
  whatsappPhone: {
    type: String,
    default: ""
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  city: {
    type: String,
    required: true,
    trim: true
  },
  state: {
    type: String,
    required: true,
    trim: true
  },
  package: {
    type: String,
    
    required: true
  },
  availability: {
    type: String,
    enum: ["yes", "no"],
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ["pending", "processing", "delivered", "cancelled"],
    default: "pending"
  },
   processingSteps: [{
    step: {
      type: Number,
      required: true
    },
    code: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});


orderSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = orderSchema;
