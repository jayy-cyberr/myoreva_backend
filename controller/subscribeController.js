const Subscriber = require("../model/subscribeModel");
const nodemailer = require("nodemailer");

// 1. Subscribe a new email
const subscribe = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  const exists = await Subscriber.findOne({ email });
  if (exists) {
    return res.status(409).json({ message: "Email already subscribed" });
  }

  const newSub = await Subscriber.create({ email });
  res.status(201).json({ message: "Subscribed successfully", data: newSub });
};

// 2. Get all subscribers
const getAllSubscribers = async (req, res) => {
  try {
    const subscribers = await Subscriber.find();
    res.status(200).json({ count: subscribers.length, data: subscribers });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch subscribers", error });
  }
};

// 3. Send newsletter to all
const sendNewsletter = async (req, res) => {
  const { subject, message } = req.body;

  if (!subject || !message) {
    return res.status(400).json({ message: "Subject and message are required" });
  }

  try {
    const subscribers = await Subscriber.find();
    const emails = subscribers.map(sub => sub.email);

    const transporter = nodemailer.createTransport({
      host: process.env.APP_HOST,
      port: process.env.APP_PORT,
      auth: {
        user: process.env.APP_USER,
        pass: process.env.APP_PASS,
      },
    });

    for (const email of emails) {
      await transporter.sendMail({
        from: `"Newsletter" <${process.env.APP_USER}>`,
        to: email,
        subject: subject,
        html: `<p>${message}</p>`,
      });
    }

    res.status(200).json({ message: "Newsletter sent successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to send newsletter", error: error.message });
  }
};


module.exports = {
  subscribe,
  getAllSubscribers,
  sendNewsletter,
};
