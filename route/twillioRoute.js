const express = require("express");
const { sendMessage } = require("../controller/twillioController")

const twilioRoute =  express.Router();

twilioRoute.post("/send", sendMessage);

module.exports = twilioRoute
