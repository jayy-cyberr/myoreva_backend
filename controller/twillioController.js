const client = require("../config/twillioConfig")

const sendMessage = async (req, res) => {
  try {
    const { phone, product } = req.body;

    if (!phone || !product) {
      return res.status(400).json({
        message: "Phone number and product details are required",
      });
    }

    const messageBody = `Thank you for ordering. Your product details: ${product}. We’ll contact you shortly.`;

    const message = await client.messages.create({
      body: messageBody,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone.startsWith("+") ? phone : `+${phone}`,
    });

    res.status(200).json({
      message: "SMS sent successfully",
      sid: message.sid,
    });
  } catch (error) {
    console.error("Error sending SMS:", error);
    res.status(500).json({
      message: "Failed to send SMS",
      error: error.message,
    });
  }
};

module.exports = { sendMessage };
