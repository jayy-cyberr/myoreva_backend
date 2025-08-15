const express = require("express");
const {
  getAllOrders,
  getOrderStats,
  updateOrderStatus,
  getOrderById,
  deleteOrder,
  exportToExcel,
  exportToPDF,
  updateOrderPackageAndPrice,
  addProcessingStep,
  getProcessingSteps,
  getPackageRevenue
} = require("../controller/adminController");


const { authenticateToken } = require("../middlewares/authMiddleware");

const adminRoute = express.Router()

adminRoute.use(authenticateToken);

adminRoute.get("/orders", getAllOrders);


adminRoute.get('/package-revenue', getPackageRevenue);

adminRoute.get("/stats", getOrderStats);


adminRoute.get("/orders/:id", getOrderById);

adminRoute.put("/orders/:id/status", updateOrderStatus);
adminRoute.put('/orders/:id/package-price', updateOrderPackageAndPrice);

adminRoute.delete("/orders/:id", deleteOrder);

adminRoute.get("/export/excel", exportToExcel);
adminRoute.get("/export/pdf", exportToPDF);

adminRoute.post('/orders/:id/processing-step', addProcessingStep);
adminRoute.get('/orders/:id/processing-steps', getProcessingSteps);

module.exports = adminRoute;