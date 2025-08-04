const express = require("express");
const router = express.Router();
const {
  subscribe,
  getAllSubscribers,
  sendNewsletter,
} = require("../controller/subscribeController");

const subscribeRoute = express.Router()

// Subscribe a new email
subscribeRoute.post("/subscribe", subscribe);


subscribeRoute.get("/subscribers", getAllSubscribers);


subscribeRoute.post("/send", sendNewsletter);

module.exports = subscribeRoute;
