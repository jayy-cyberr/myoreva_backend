const mongoose = require("mongoose");
const orderSchema = require("../model/formModel");
const client = require("../config/twillioConfig");
const nodemailer = require("nodemailer");
require("dotenv").config();

// Define the model using the schema
const Order = mongoose.model("Order", orderSchema);

// Set up email transporter
const transporter = nodemailer.createTransport({
  host: process.env.APP_HOST,
  port: process.env.APP_PORT,
  secure: false,
  auth: {
    user: process.env.APP_USER,
    pass: process.env.APP_PASS,
  },
});

const addForm = async (req, res) => {
  try {
    const formData = req.body;

    if (!formData) {
      return res.status(400).json({
        message: "No data sent from form",
        status: "Bad Request",
      });
    }

    const { fullName, address, package: packageType, phone } = formData;

    if (!fullName || !address || !packageType || !phone) {
      return res.status(400).json({
        message: "Missing one or more required fields",
        status: "Bad Request",
      });
    }

    // Save to MongoDB
    const newOrder = new Order(formData);
    await newOrder.save();

    // Format phone number
    const sendTo = Array.isArray(phone) ? phone[0] : phone;

    // Format message content for SMS
    const smsBody = `Hi ${fullName}, your order for the "${packageType}" package has been received. Address: ${address}. Your order will be processed shortly for delivery. Thank you!`;

    // Send SMS via Twilio
    await client.messages.create({
      body: smsBody,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: sendTo.startsWith("+") ? sendTo : `+${sendTo}`,
    });

    // Format email content for Admin
    const adminMailOptions = {
      from: `"Order Notification" <${process.env.APP_USER}>`,
      to: process.env.ADMIN_EMAIL, // ensure this is set in .env
      subject: `New Order Received - ${fullName}`,
      html: `
        <h3>New Order Details</h3>
        <p><strong>Name:</strong> ${fullName}</p>
        <p><strong>Address:</strong> ${address}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Package:</strong> ${packageType}</p>
      `,
    };

    // Send email to admin
    await transporter.sendMail(adminMailOptions);

    res.status(201).json({
      message: "Successfully added, SMS and Email sent",
      status: "Success",
      data: newOrder,
    });
  } catch (error) {
    console.error("Error in addForm:", error);
    res.status(500).json({
      message: "An error occurred",
      status: "Failed",
      error: error.message,
    });
  }
};

module.exports = {
  addForm,
};
