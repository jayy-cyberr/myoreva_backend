const mongoose = require("mongoose");
const orderSchema = require("../model/formModel");
const client = require("../config/twillioConfig");
const nodemailer = require("nodemailer");
require("dotenv").config();


const Order = mongoose.model("Order", orderSchema);


const transporter = nodemailer.createTransport({
  host: process.env.APP_HOST,
  port: process.env.APP_PORT,
  secure: false,
  auth: {
    user: process.env.APP_USER,
    pass: process.env.APP_PASS,
  },
});
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ SMTP connection failed:", error);
  } else {
    console.log("✅ SMTP server is ready to send emails");
  }
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

   
    if (!formData.status) {
      formData.status = 'pending';
    }


    const newOrder = new Order(formData);
    await newOrder.save();

    const sendTo = Array.isArray(phone) ? phone[0] : phone;

  
    const smsBody = `Hi ${fullName}, your order for the "${packageType}" package has been received. Address: ${address}. Your order will be processed shortly for delivery. Thank you!`;


// SMS (optional, won't block order)
try {
  await client.messages.create({
    body: smsBody,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: sendTo.startsWith("+") ? sendTo : `+${sendTo}`,
  });
} catch (smsError) {
  console.error("⚠️ Failed to send SMS:", smsError.message);
}

    const adminMailOptions = {
  from: `"Order Notification" <${process.env.APP_USER}>`,
  to: process.env.ADMIN_EMAIL,
  subject: `New Order Received - ${fullName}`,
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
      <div style="background-color: #4a90e2; color: white; padding: 20px; border-radius: 10px 10px 0 0;">
        <h2 style="margin: 0; font-size: 1.6rem">📦 New Order Received</h2>
        <p style="margin: 5px 0 0;">Customer: <strong>${fullName}</strong></p>
      </div>

      <div style="background-color: #ffffff; padding: 25px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h3 style="color: #333; border-bottom: 1px solid #eee; padding-bottom: 10px;">Order Details</h3>
        
        <table style="width: 100%; border-collapse: collapse; font-size: 15px;">
          <tr>
            <td style="padding: 8px 0;"><strong>Full Name:</strong></td>
            <td style="padding: 8px 0;">${fullName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;"><strong>Address:</strong></td>
            <td style="padding: 8px 0;">${address}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;"><strong>Phone:</strong></td>
            <td style="padding: 8px 0;">${phone}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;"><strong>Package:</strong></td>
            <td style="padding: 8px 0;">${packageType}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;"><strong>Price:</strong></td>
            <td style="padding: 8px 0;">₦${formData.price?.toLocaleString()}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;"><strong>Status:</strong></td>
            <td style="padding: 8px 0;">${formData.status}</td>
          </tr>
        </table>

        <p style="margin-top: 20px; font-size: 14px; color: #777;">
          You can view and manage this order in your admin dashboard.
        </p>
      </div>

      <p style="text-align: center; font-size: 13px; color: #aaa; margin-top: 30px;">
        This is an automated message from MyOreva Orders System.
      </p>
    </div>
  `,
};


 try {
  await transporter.sendMail(adminMailOptions);
} catch (mailError) {
  console.error("⚠️ Failed to send email:", mailError.message);
}

    res.status(201).json({
      message: "Successfully added, SMS and Email sent",
      status: "Success",
      data: newOrder,
    });
  } catch (error) {
    console.error("❌ Error in addForm:", error);
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
