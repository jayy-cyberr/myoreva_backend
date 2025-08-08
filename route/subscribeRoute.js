const express = require("express");
const {
  subscribe,
  getAllSubscribers,
  getTemplates,
  previewNewsletter,
  sendNewsletter,
  getNewsletterHistory,
  deleteSubscriber,
} = require("../controller/subscribeController");

const subscribeRoute = express.Router();


subscribeRoute.post("/subscribe", subscribe);


subscribeRoute.get("/subscribers", getAllSubscribers);
subscribeRoute.delete("/subscribers/:id", deleteSubscriber);
subscribeRoute.get("/templates", getTemplates);
subscribeRoute.post("/preview", previewNewsletter);
subscribeRoute.post("/send", sendNewsletter);
subscribeRoute.get("/history", getNewsletterHistory);

module.exports = subscribeRoute;
