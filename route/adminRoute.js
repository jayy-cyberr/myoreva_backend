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
  getProcessingSteps
} = require("../controller/adminController");

const adminRoute = express.Router()


adminRoute.get("/orders", getAllOrders);


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