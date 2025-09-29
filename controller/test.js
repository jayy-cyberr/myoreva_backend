const addForm = async (req, res) => {
  try {
    const formData = req.body;

    if (!formData) {
      return res.status(400).json({ message: "No data sent", status: "Bad Request" });
    }

    const { fullName, address, package: packageType, phone } = formData;
    if (!fullName || !address || !packageType || !phone) {
      return res.status(400).json({ message: "Missing fields", status: "Bad Request" });
    }

    if (!formData.status) formData.status = "pending";

    // Save order first
    const newOrder = new Order(formData);
    await newOrder.save();

    // ✅ Respond to frontend immediately
    res.status(201).json({
      message: "Successfully added",
      status: "Success",
      data: newOrder,
    });

    // 📩 Run notifications in background (not blocking frontend)
    const sendTo = Array.isArray(phone) ? phone[0] : phone;
    const smsBody = `Hi ${fullName}, your order for "${packageType}" has been received. Address: ${address}.`;

    // SMS
    client.messages.create({
      body: smsBody,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: sendTo.startsWith("+") ? sendTo : `+${sendTo}`,
    }).catch(err => console.error("⚠️ SMS failed:", err.message));

    // Email
    const adminMailOptions = {
      from: `"Order Notification" <${process.env.APP_USER}>`,
      to: process.env.ADMIN_EMAIL,
      subject: `New Order - ${fullName}`,
      html: `<p>New order from ${fullName}, address: ${address}, package: ${packageType}</p>`,
    };

    transporter.sendMail(adminMailOptions)
      .then(() => console.log("✅ Email sent"))
      .catch(err => console.error("⚠️ Email failed:", err.message));

  } catch (error) {
    console.error("❌ Error in addForm:", error);
    res.status(500).json({ message: "An error occurred", status: "Failed", error: error.message });
  }
};
