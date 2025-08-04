const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: [String], // for multiple numbers separated by comma
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
    enum: ["regular", "silver", "family"],
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
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports =  orderSchema
