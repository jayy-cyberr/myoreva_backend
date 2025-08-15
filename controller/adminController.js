const mongoose = require("mongoose");
const orderSchema = require("../model/formModel");
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
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
const sendSMSNotification = async (order, updateType) => {
  try {
    const sendTo = Array.isArray(order.phone) ? order.phone[0] : order.phone;
    const formattedPhone = sendTo.startsWith("+") ? sendTo : `+${sendTo}`;
    
    let smsMessage = "";
    
    if (updateType === 'processing') {
      smsMessage = `Hi ${order.fullName}, great news! Your "${order.package}" package order is now being processed and will be delivered to ${order.address} soon. We'll keep you updated on the delivery progress. Thank you for choosing MyOreva!`;
    } else if (updateType === 'cancelled') {
      smsMessage = `Hello ${order.fullName}, we're sorry to inform you that your order for the "${order.package}" package has been cancelled. If you believe this was a mistake or need assistance, please contact our support team at support@myoreva.com or WhatsApp +234. Thank you for choosing MyOreva.`;
    } else if (updateType === 'delivered') {
      smsMessage = `Hi ${order.fullName}, your "${order.package}" package has been successfully delivered to ${order.address}. Thank you for choosing MyOreva! Contact us at support@myoreva.com or WhatsApp +234 if you have any questions.`;
    } else if (updateType === 'packageAndPrice') {
      smsMessage = `Hi ${order.fullName}, your order has been updated! You have changed to the "${order.package}" package with a new price of ₦${order.price.toLocaleString()}. It will be delivered to ${order.address}. Thank you for choosing MyOreva!`;
    }
    
    if (smsMessage) {
      await client.messages.create({
        body: smsMessage,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: formattedPhone,
      });
      
      console.log(`SMS sent successfully to ${formattedPhone} for order ${order._id}`);
      return { success: true, message: "SMS sent successfully" };
    }
    
    return { success: false, message: "No SMS needed for this update type" };
  } catch (error) {
    console.error("Error sending SMS:", error.message);
    return { success: false, message: `SMS failed: ${error.message}` };
  }
};

const sendEmailNotification = async (order, newStatus) => {
  try {
    let emailOptions = null;
    
    if (newStatus === 'delivered') {
      emailOptions = {
        from: `"MyOreva Delivery Team" <${process.env.APP_USER}>`,
        to: process.env.ADMIN_EMAIL, 
        subject: `Order Delivered - ${order.fullName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
            <div style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
              <h2 style="margin: 0;">📦 Order Delivered Notification</h2>
            </div>
            
            <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <p style="font-size: 16px; color: #333; line-height: 1.6;">
                The order for <strong>${order.fullName}</strong> has been successfully delivered.
              </p>
              
              <div style="background: #f8f9fa; padding: 15px; border-left: 4px solid #667eea; margin: 20px 0;">
                <p style="margin: 0; color: #555;"><strong>Delivery Address:</strong><br>
                ${order.address}<br>
                ${order.city}, ${order.state}</p>
              </div>
              
              <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #2f855a; margin: 0 0 10px 0;">Order Summary:</h3>
                <p style="margin: 5px 0; color: #333;"><strong>Package:</strong> ${order.package.toUpperCase()}</p>
                <p style="margin: 5px 0; color: #333;"><strong>Order Value:</strong> ₦${order.price?.toLocaleString() || 'N/A'}</p>
                <p style="margin: 5px 0; color: #333;"><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
                <p style="margin: 5px 0; color: #333;"><strong>Delivery Date:</strong> ${new Date().toLocaleDateString()}</p>
                <p style="margin: 5px 0; color: #333;"><strong>Customer Phone:</strong> ${Array.isArray(order.phone) ? order.phone.join(', ') : order.phone}</p>
              </div>
              
              <p style="font-size: 16px; color: #333; line-height: 1.6;">
                This is an automated notification to inform you of the delivery. You can view and manage this order in the admin dashboard.
              </p>
              
              <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
              
              <p style="font-size: 14px; color: #777; text-align: center; margin: 0;">
                Best regards,<br>
                <strong>The MyOreva Team</strong>
              </p>
            </div>
          </div>
        `,
      };
    }
    
    if (emailOptions) {
      await transporter.sendMail(emailOptions);
      console.log(`Email sent successfully for order ${order._id}`);
      return { success: true, message: "Email sent successfully" };
    }
    
    return { success: false, message: "No email needed for this status" };
  } catch (error) {
    console.error("Error sending email:", error.message);
    return { success: false, message: `Email failed: ${error.message}` };
  }
};
const getAllOrders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      package: packageFilter,
      startDate,
      endDate,
      search
    } = req.query;


    const filter = {};
    
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    if (packageFilter && packageFilter !== 'all') {
      filter.package = packageFilter;
    }
    
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.createdAt.$lte = new Date(endDate);
      }
    }
    
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } }
      ];
    }


    const skip = (page - 1) * limit;
    

    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    

    const totalOrders = await Order.countDocuments(filter);
    const totalPages = Math.ceil(totalOrders / limit);

    res.status(200).json({
      message: "Orders retrieved successfully",
      data: orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalOrders,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error("Error retrieving orders:", error);
    res.status(500).json({
      message: "Failed to retrieve orders",
      error: error.message
    });
  }
};

const getOrderStats = async (req, res) => {
  try {
    const { dateFilter, startDate, endDate } = req.query;
    
    
    let dateQuery = {};
    const now = new Date();
    
    if (dateFilter && dateFilter !== 'all') {
      switch (dateFilter) {
        case 'today':
          const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
          dateQuery = { createdAt: { $gte: todayStart, $lt: todayEnd } };
          break;
          
        case 'yesterday':
          const yesterdayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
          const yesterdayEnd = new Date(yesterdayStart.getTime() + 24 * 60 * 60 * 1000);
          dateQuery = { createdAt: { $gte: yesterdayStart, $lt: yesterdayEnd } };
          break;
          
        case 'last7days':
          const last7Start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          dateQuery = { createdAt: { $gte: last7Start } };
          break;
          
        case 'last14days':
          const last14Start = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
          dateQuery = { createdAt: { $gte: last14Start } };
          break;
          
        case 'last28days':
          const last28Start = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
          dateQuery = { createdAt: { $gte: last28Start } };
          break;
          
        case 'last30days':
          const last30Start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          dateQuery = { createdAt: { $gte: last30Start } };
          break;
          
        case 'thisweek':
          const weekStart = new Date(now);
          weekStart.setDate(now.getDate() - now.getDay()); 
          weekStart.setHours(0, 0, 0, 0);
          dateQuery = { createdAt: { $gte: weekStart } };
          break;
          
        case 'thismonth':
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
          dateQuery = { createdAt: { $gte: monthStart } };
          break;
          
        case 'lastmonth':
          const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 1);
          dateQuery = { createdAt: { $gte: lastMonthStart, $lt: lastMonthEnd } };
          break;
          
        case 'custom':
          if (startDate) {
            const start = new Date(startDate);
            const end = new Date(startDate);
            start.setHours(0, 0, 0, 0);    
            end.setHours(23, 59, 59, 999); 
            dateQuery = { createdAt: { $gte: start, $lte: end } };
          }
          break;
          
        default:
          
          dateQuery = {};
      }
    } else if (startDate) {
      
      const start = new Date(startDate);
      const end = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      dateQuery = { createdAt: { $gte: start, $lte: end } };
    }
    
    console.log('Date filter applied:', dateFilter);
    console.log('Date query:', dateQuery);
    
    
    const totalOrders = await Order.countDocuments(dateQuery);
    
    
    const revenueQuery = { 
      status: 'delivered',
      ...dateQuery 
    };
    
    const revenueResult = await Order.aggregate([
      { $match: revenueQuery },
      { $group: { _id: null, total: { $sum: "$price" } } }
    ]);
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;
    
    
    const statusStats = await Order.aggregate([
      { $match: dateQuery },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);
    
    
    const packageStats = await Order.aggregate([
      { $match: dateQuery },
      { $group: { _id: "$package", count: { $sum: 1 } } }
    ]);
    
    
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    const recentOrders = await Order.countDocuments({
      createdAt: { $gte: lastWeek }
    });

    console.log('Stats result:', {
      totalOrders,
      totalRevenue, 
      statusStats,
      packageStats
    });

    res.status(200).json({
      message: "Statistics retrieved successfully",
      data: {
        totalOrders,
        totalRevenue,
        recentOrders,
        statusBreakdown: statusStats,
        packageBreakdown: packageStats,
        dateRange: dateFilter || 'all',
        appliedFilter: {
          dateFilter,
          startDate,
          endDate,
          query: dateQuery
        }
      }
    });
  } catch (error) {
    console.error("Error retrieving statistics:", error);
    res.status(500).json({
      message: "Failed to retrieve statistics",
      error: error.message
    });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['pending', 'processing', 'delivered', 'cancelled'].includes(status)) {
      return res.status(400).json({
        message: "Invalid status. Must be: pending, processing, delivered, or cancelled"
      });
    }

    const currentOrder = await Order.findById(id);
    if (!currentOrder) {
      return res.status(404).json({
        message: "Order not found"
      });
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { status, updatedAt: new Date() },
      { new: true }
    );

    let smsResult = { success: false, message: "No SMS sent" };
    let emailResult = { success: false, message: "No email sent" };

    if (status === 'processing' && currentOrder.status !== 'processing') {
      smsResult = await sendSMSNotification(updatedOrder, status);
    }

    if (status === 'delivered' && currentOrder.status !== 'delivered') {
      smsResult = await sendSMSNotification(updatedOrder, status); 
      emailResult = await sendEmailNotification(updatedOrder, status); 
    }
    
    if (status === 'cancelled' && currentOrder.status !== 'cancelled') {
      smsResult = await sendSMSNotification(updatedOrder, status);
    }

    const responseMessage = `Order status updated successfully. ${smsResult.message}. ${emailResult.message}`;

    res.status(200).json({
      message: responseMessage,
      data: updatedOrder,
      notifications: {
        sms: smsResult,
        email: emailResult
      }
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({
      message: "Failed to update order status",
      error: error.message
    });
  }
};


const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        message: "Order not found"
      });
    }

    res.status(200).json({
      message: "Order retrieved successfully",
      data: order
    });
  } catch (error) {
    console.error("Error retrieving order:", error);
    res.status(500).json({
      message: "Failed to retrieve order",
      error: error.message
    });
  }
};


const addProcessingStep = async (req, res) => {
  try {
    const { id } = req.params;
    const { code } = req.body;

    
    const processingCodes = {
      'N.A': 'Not Available',
      'N.P': 'Not Picking',
      'N.R': 'Not reachable',
      'N.B': 'Number Busy',
      'S.O': 'Switch Off',
      'I.N': 'Incorrect Number',
      'N. L. B': 'No longer Buying',
    };

    if (!code || !processingCodes[code]) {
      return res.status(400).json({
        message: "Invalid processing code"
      });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        message: "Order not found"
      });
    }

    
    if (order.status !== 'pending') {
      return res.status(400).json({
        message: "Processing steps can only be added to pending orders"
      });
    }

    
    const nextStepNumber = order.processingSteps.length + 1;

    
    const newStep = {
      step: nextStepNumber,
      code: code,
      description: processingCodes[code]
    };

    order.processingSteps.push(newStep);
    await order.save();

    res.status(200).json({
      message: "Processing step added successfully",
      data: order,
      newStep: newStep
    });
  } catch (error) {
    console.error("Error adding processing step:", error);
    res.status(500).json({
      message: "Failed to add processing step",
      error: error.message
    });
  }
};


const getProcessingSteps = async (req, res) => {
  try {
    const { id } = req.params;
    
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        message: "Order not found"
      });
    }

    res.status(200).json({
      message: "Processing steps retrieved successfully",
      data: {
        orderId: order._id,
        status: order.status,
        processingSteps: order.processingSteps
      }
    });
  } catch (error) {
    console.error("Error retrieving processing steps:", error);
    res.status(500).json({
      message: "Failed to retrieve processing steps",
      error: error.message
    });
  }
};


const getPackageRevenue = async (req, res) => {
  try {
    const { package: packageName } = req.query;
    
    if (!packageName) {
      return res.status(400).json({
        message: "Package name is required"
      });
    }
    
    
    let query = { 
      package: packageName,
      status: 'delivered' 
    };
    
    console.log('Package revenue query:', query);
    
    
    const revenueResult = await Order.aggregate([
      { $match: query },
      { 
        $group: { 
          _id: null, 
          revenue: { $sum: "$price" },
          totalOrders: { $sum: 1 },
          averageOrderValue: { $avg: "$price" }
        } 
      }
    ]);
    
    const revenue = revenueResult.length > 0 ? revenueResult[0].revenue : 0;
    const totalOrders = revenueResult.length > 0 ? revenueResult[0].totalOrders : 0;
    const averageOrderValue = revenueResult.length > 0 ? revenueResult[0].averageOrderValue : 0;
    
    res.status(200).json({
      message: "Package revenue retrieved successfully",
      data: {
        package: packageName,
        revenue,
        totalOrders,
        averageOrderValue: Math.round(averageOrderValue || 0)
      }
    });
    
  } catch (error) {
    console.error("Error retrieving package revenue:", error);
    res.status(500).json({
      message: "Failed to retrieve package revenue",
      error: error.message
    });
  }
};
const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedOrder = await Order.findByIdAndDelete(id);

    if (!deletedOrder) {
      return res.status(404).json({
        message: "Order not found"
      });
    }

    res.status(200).json({
      message: "Order deleted successfully",
      data: deletedOrder
    });
  } catch (error) {
    console.error("Error deleting order:", error);
    res.status(500).json({
      message: "Failed to delete order",
      error: error.message
    });
  }
};

const updateOrderPackageAndPrice = async (req, res) => {
  try {
    const { id } = req.params;
    const { package: packageName, price } = req.body;

    if (!packageName || !price) {
      return res.status(400).json({
        message: "Package name and price are required"
      });
    }

    if (isNaN(price) || price <= 0) {
      return res.status(400).json({
        message: "Price must be a valid positive number"
      });
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { 
        package: packageName,
        price: parseFloat(price),
        updatedAt: new Date() 
      },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({
        message: "Order not found"
      });
    }

    
    const smsResult = await sendSMSNotification(updatedOrder, 'packageAndPrice');

    res.status(200).json({
      message: `Order package and price updated successfully. ${smsResult.message}`,
      data: updatedOrder,
      notifications: {
        sms: smsResult
      }
    });
  } catch (error) {
    console.error("Error updating order package and price:", error);
    res.status(500).json({
      message: "Failed to update order package and price",
      error: error.message
    });
  }
};


const exportToExcel = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Orders');
    
    
    worksheet.columns = [
      { header: 'Full Name', key: 'fullName', width: 20 },
      { header: 'Phone', key: 'phone', width: 15 },
      { header: 'Package', key: 'package', width: 12 },
      { header: 'Address', key: 'address', width: 30 },
      { header: 'City', key: 'city', width: 15 },
      { header: 'State', key: 'state', width: 15 },
      { header: 'Price', key: 'price', width: 12 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Date', key: 'createdAt', width: 15 }
    ];
    
    
    orders.forEach(order => {
      worksheet.addRow({
        fullName: order.fullName,
        phone: Array.isArray(order.phone) ? order.phone.join(', ') : order.phone,
        package: order.package,
        address: order.address,
        city: order.city,
        state: order.state,
        price: order.price,
        status: order.status,
        createdAt: order.createdAt.toDateString()
      });
    });
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=orders.xlsx');
    
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Error exporting to Excel:", error);
    res.status(500).json({
      message: "Failed to export to Excel",
      error: error.message
    });
  }
};


const exportToPDF = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    
    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=orders.pdf');
    
    doc.pipe(res);
    
    
    doc.fontSize(20).text('Orders Report', 50, 50);
    doc.moveDown();
    
    
    orders.forEach((order, index) => {
      if (doc.y > 700) {
        doc.addPage();
      }
      
      doc.fontSize(12)
         .text(`Order ${index + 1}:`, 50, doc.y)
         .text(`Name: ${order.fullName}`, 50, doc.y + 5)
         .text(`Phone: ${Array.isArray(order.phone) ? order.phone.join(', ') : order.phone}`, 50, doc.y + 5)
         .text(`Package: ${order.package}`, 50, doc.y + 5)
         .text(`Address: ${order.address}`, 50, doc.y + 5)
         .text(`Status: ${order.status}`, 50, doc.y + 5)
         .text(`Price: ₦${order.price}`, 50, doc.y + 5)
         .text(`Date: ${order.createdAt.toDateString()}`, 50, doc.y + 5);
      
      doc.moveDown();
    });
    
    doc.end();
  } catch (error) {
    console.error("Error exporting to PDF:", error);
    res.status(500).json({
      message: "Failed to export to PDF",
      error: error.message
    });
  }
};

module.exports = {
  getAllOrders,
  getOrderStats,
  updateOrderStatus, 
  getOrderById,
  deleteOrder,
  exportToExcel,
  exportToPDF,
   addProcessingStep,
  getProcessingSteps,
  updateOrderPackageAndPrice,
  getPackageRevenue 
};
