const { Subscriber, Newsletter } = require("../model/subscribeModel");
const nodemailer = require("nodemailer");
const sanitizeHtml = require("sanitize-html");


const emailTemplates = {
  modern: {
    name: 'Modern',
    html: (subject, message, image, name) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f4f6f8;">
          <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 20px; background: #f4f6f8;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background: white; border: 1px solid #e1e1e1; max-width: 100%;">
                  <!-- Header -->
                  <tr>
                    <td style="background: #2f3e46; padding: 30px; text-align: center;">
                      <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">MyOreva Newsletter</h1>
                    </td>
                  </tr>
                  <!-- Image -->
                  ${image ? `
                  <tr>
                    <td style="padding: 20px;">
                      <img src="${image}" style="max-width: 100%; height: auto; max-height: 300px; object-fit: contain; display: block; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin: 0 auto;" alt="Newsletter Image">
                    </td>
                  </tr>
                  ` : ''}
                  <!-- Content -->
                  <tr>
                    <td style="padding: 35px 30px;">
                      <h2 style="color: #2f3e46; margin: 0 0 15px 0; font-size: 20px; font-weight: 500;">${subject}</h2>
                      <div style="color: #444; font-size: 15px; line-height: 1.6;">
                        <p>Hello ${name || 'Subscriber'},</p>
                        ${message}
                      </div>
                    </td>
                  </tr>
                  <!-- Footer -->
                  <tr>
                    <td style="background: #f8f9fa; padding: 25px; text-align: center; border-top: 1px solid #ddd;">
                      <p style="color: #666; font-size: 13px; margin: 0 0 8px 0;">Thank you for staying connected with us</p>
                      <p style="color: #aaa; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} MyOreva. All rights reserved.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `
  },
  
  classic: {
    name: 'Classic',
    html: (subject, message, image, name) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Georgia, serif; background: #f5f5f5;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background: #f5f5f5; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background: white; border: 2px solid #8b4513; max-width: 100%;">
                  <!-- Header -->
                  <tr>
                    <td style="background: #8b4513; padding: 30px; text-align: center;">
                      <h1 style="color: white; margin: 0; font-size: 26px; font-weight: normal; font-family: Georgia, serif;">MyOreva Newsletter</h1>
                    </td>
                  </tr>
                  <!-- Image -->
                  ${image ? `
                  <tr>
                    <td style="padding: 20px;">
                      <img src="${image}" style="max-width: 100%; height: auto; max-height: 300px; object-fit: contain; display: block; border-radius: 8px; border: 1px solid #8b4513; margin: 0 auto;" alt="Newsletter Image">
                    </td>
                  </tr>
                  ` : ''}
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px 30px;">
                      <h2 style="color: #8b4513; margin: 0 0 20px 0; font-size: 22px; font-weight: normal; font-family: Georgia, serif; border-bottom: 1px solid #ddd; padding-bottom: 10px;">${subject}</h2>
                      <div style="color: #333; font-size: 16px; line-height: 1.7; font-family: Georgia, serif;">
                        <p>Hello ${name || 'Subscriber'},</p>
                        ${message}
                      </div>
                    </td>
                  </tr>
                  <!-- Footer -->
                  <tr>
                    <td style="background: #f9f9f9; padding: 25px; text-align: center; border-top: 1px solid #ddd;">
                      <p style="color: #666; font-size: 14px; margin: 0 0 8px 0; font-family: Georgia, serif;">Respectfully yours,</p>
                      <p style="color: #8b4513; font-size: 16px; margin: 0 0 15px 0; font-weight: bold; font-family: Georgia, serif;">The MyOreva Team</p>
                      <p style="color: #999; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} MyOreva. All rights reserved.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `
    
  },
  minimal: {
    name: 'Minimal',
    html: (subject, message, image, name) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, sans-serif; background: #f2f2f2;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background: #f2f2f2; padding: 60px 20px;">
            <tr>
              <td align="center">
                <table width="500" cellpadding="0" cellspacing="0" style="background: white; border: 1px solid #ddd; max-width: 100%;">
                  <!-- Header -->
                  <tr>
                    <td style="text-align: center; padding: 20px 0;">
                      <h1 style="color: #333; margin: 0; font-size: 22px; font-weight: 500; letter-spacing: 1px;">MYOREVA</h1>
                    </td>
                  </tr>
                  <!-- Image -->
                  ${image ? `
                  <tr>
                    <td style="padding: 20px;">
                      <img src="${image}" style="max-width: 100%; height: auto; max-height: 250px; object-fit: contain; display: block; border-radius: 4px; margin: 0 auto;" alt="Newsletter Image">
                    </td>
                  </tr>
                  ` : ''}
                  <!-- Content -->
                  <tr>
                    <td style="padding: 0 30px 40px 30px;">
                      <h2 style="color: #222; margin: 0 0 20px 0; font-size: 18px; font-weight: 500;">${subject}</h2>
                      <div style="color: #555; font-size: 15px; line-height: 1.6; font-weight: 400;">
                        <p>Hello ${name || 'Subscriber'},</p>
                        ${message}
                      </div>
                    </td>
                  </tr>
                  <!-- Footer -->
                  <tr>
                    <td style="text-align: center; padding: 25px 0; border-top: 1px solid #eee;">
                      <p style="color: #999; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} MYOREVA</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `
  },
  vibrant: {
    name: 'Vibrant',
    html: (subject, message, image, name) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', sans-serif; background: #eaf0f6;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background: #eaf0f6; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background: white; border: 1px solid #ccc; max-width: 100%;">
                  <!-- Header -->
                  <tr>
                    <td style="background: #3b5998; padding: 30px; text-align: center;">
                      <h1 style="color: white; margin: 0; font-size: 26px; font-weight: 700;">MyOreva</h1>
                      <p style="color: #e0e0e0; margin: 5px 0 0; font-size: 13px;">Newsletter</p>
                    </td>
                  </tr>
                  <!-- Image -->
                  ${image ? `
                  <tr>
                    <td style="padding: 20px;">
                      <img src="${image}" style="max-width: 100%; height: auto; max-height: 300px; object-fit: contain; display: block; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.15); margin: 0 auto;" alt="Newsletter Image">
                    </td>
                  </tr>
                  ` : ''}
                  <!-- Content -->
                  <tr>
                    <td style="padding: 35px 30px;">
                      <h2 style="color: #2d3748; margin: 0 0 20px 0; font-size: 20px; font-weight: 600;">${subject}</h2>
                      <div style="color: #444; font-size: 15px; line-height: 1.7;">
                        <p>Hello ${name || 'Subscriber'},</p>
                        ${message}
                      </div>
                    </td>
                  </tr>
                  <!-- Footer -->
                  <tr>
                    <td style="background: #f1f1f1; padding: 25px; text-align: center; border-top: 1px solid #ddd;">
                      <p style="color: #666; font-size: 13px; margin: 0 0 8px 0;">Thanks for staying connected</p>
                      <p style="color: #aaa; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} MyOreva. All rights reserved.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `
  }
};


const subscribe = async (req, res) => {
  console.log("Request Body:", req.body);

  const { email, name } = req.body || {};

  if (!email || !name) {
    return res.status(400).json({ message: "Email and name are required." });
  }

  try {
    const existing = await Subscriber.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: "Already subscribed" });
    }

    const newSubscriber = await Subscriber.create({ email, name });
    return res.status(201).json({ message: "Subscribed successfully", data: newSubscriber });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};



const getAllSubscribers = async (req, res) => {
  try {
    const subscribers = await Subscriber.find().sort({ subscribedAt: -1 });
    res.status(200).json({ count: subscribers.length, data: subscribers });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch subscribers", error });
  }
};


const getTemplates = async (req, res) => {
  try {
    const templates = Object.keys(emailTemplates).map(key => ({
      id: key,
      name: emailTemplates[key].name
    }));
    res.status(200).json({ data: templates });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch templates", error });
  }
};


const validImageUrlPattern = /^(https?:\/\/[^\s/$.?#].[^\s]*\.(jpg|jpeg|png|gif))$/i;


const previewNewsletter = async (req, res) => {
  const { subject, message, template, image, name = "Subscriber" } = req.body;

  if (!subject || !message || !template) {
    return res.status(400).json({ message: "Subject, message, and template are required" });
  }

  if (image && !validImageUrlPattern.test(image)) {
    return res.status(400).json({ message: "Invalid image URL. Must be a valid HTTP/HTTPS URL ending in .jpg, .jpeg, .png, or .gif" });
  }

  try {
    if (!emailTemplates[template]) {
      return res.status(400).json({ message: "Invalid template" });
    }

    
    const sanitizedMessage = sanitizeHtml(message, {
      allowedTags: ['p', 'br', 'b', 'i', 'u', 'strong', 'em', 'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'div'],
      allowedAttributes: {
        'a': ['href', 'target'],
        'span': ['style'],
        'div': ['style'],
      },
      allowedStyles: {
        '*': {
          'color': [/^#(0-9a-fA-F]{6})$|^rgb\(/],
          'font-size': [/^\d+(px|em|rem)$/],
          'line-height': [/^\d+(\.\d+)?$/],
          'text-align': [/^left|center|right$/],
          'margin': [/^\d+(px|em|rem)$/],
          'padding': [/^\d+(px|em|rem)$/],
        }
      }
    });

    const html = emailTemplates[template].html(subject, sanitizedMessage, image, name);
    res.status(200).json({ data: { html } });
  } catch (error) {
    res.status(500).json({ message: "Failed to preview newsletter", error: error.message });
  }
};


const sendNewsletter = async (req, res) => {
  const { subject, message, template = 'modern', image } = req.body;

  if (!subject || !message) {
    return res.status(400).json({ message: "Subject and message are required" });
  }

  if (image && !validImageUrlPattern.test(image)) {
    return res.status(400).json({ message: "Invalid image URL. Must be a valid HTTP/HTTPS URL ending in .jpg, .jpeg, .png, or .gif" });
  }

  if (!emailTemplates[template]) {
    return res.status(400).json({ message: "Invalid template" });
  }

  try {
    const subscribers = await Subscriber.find();
    if (subscribers.length === 0) {
      return res.status(400).json({ message: "No subscribers found" });
    }

    
    const sanitizedMessage = sanitizeHtml(message, {
      allowedTags: ['p', 'br', 'b', 'i', 'u', 'strong', 'em', 'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'div'],
      allowedAttributes: {
        'a': ['href', 'target'],
        'span': ['style'],
        'div': ['style'],
      },
      allowedStyles: {
        '*': {
          'color': [/^#(0-9a-fA-F]{6})$|^rgb\(/],
          'font-size': [/^\d+(px|em|rem)$/],
          'line-height': [/^\d+(\.\d+)?$/],
          'text-align': [/^left|center|right$/],
          'margin': [/^\d+(px|em|rem)$/],
          'padding': [/^\d+(px|em|rem)$/],
        }
      }
    });

    const transporter = nodemailer.createTransport({
      host: process.env.APP_HOST,
      port: process.env.APP_PORT,
      auth: {
        user: process.env.APP_USER,
        pass: process.env.APP_PASS,
      },
    });

    let successCount = 0;
    let failedEmails = [];

    
    const batchSize = 10;
    for (let i = 0; i < subscribers.length; i += batchSize) {
      const batch = subscribers.slice(i, i + batchSize);
      const promises = batch.map(async (subscriber) => {
        try {
          const html = emailTemplates[template].html(subject, sanitizedMessage, image, subscriber.name);
          await transporter.sendMail({
            from: `"MyOreva Newsletter" <${process.env.APP_USER}>`,
            to: subscriber.email,
            subject: subject,
            html: html,
          });
          successCount++;
        } catch (error) {
          console.error(`Failed to send to ${subscriber.email}:`, error);
          failedEmails.push(subscriber.email);
        }
      });
      await Promise.allSettled(promises);
    }

    
    await Newsletter.create({
      subject,
      message: sanitizedMessage,
      template,
      image,
      sentTo: subscribers.map(sub => sub.email),
      status: failedEmails.length === 0 ? 'sent' : 'partial'
    });

    res.status(200).json({
      message: "Newsletter sent successfully",
      data: {
        totalSubscribers: subscribers.length,
        successCount,
        failedCount: failedEmails.length,
        failedEmails: failedEmails.length > 0 ? failedEmails : undefined
      }
    });
  } catch (error) {
    console.error('Newsletter send error:', error);
    res.status(500).json({ message: "Failed to send newsletter", error: error.message });
  }
};


const getNewsletterHistory = async (req, res) => {
  try {
    const newsletters = await Newsletter.find()
      .sort({ sentAt: -1 })
      .select('-message') 
      .limit(50);
    
    res.status(200).json({ count: newsletters.length, data: newsletters });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch newsletter history", error });
  }
};


const deleteSubscriber = async (req, res) => {
  const { id } = req.params;
  
  try {
    const subscriber = await Subscriber.findByIdAndDelete(id);
    if (!subscriber) {
      return res.status(404).json({ message: "Subscriber not found" });
    }
    
    res.status(200).json({ message: "Subscriber deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete subscriber", error });
  }
};

module.exports = {
  subscribe,
  getAllSubscribers,
  getTemplates,
  previewNewsletter,
  sendNewsletter,
  getNewsletterHistory,
  deleteSubscriber,
};
