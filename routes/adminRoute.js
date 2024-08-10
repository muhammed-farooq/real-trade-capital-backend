const express = require("express");
const { login, profileDetails } = require("../controllers/admin");
const { verifyTokenAdmin } = require("../middlewares/auth");
const { packages, addService, editPackage } = require("../controllers/package");
const { allUsers, blockUser, unBlockUser } = require("../controllers/user");

const multer = require("../config/multer");
const {
  getOrderLists,
  getOrderData,
  ApproveOrder,
  cancelOrder,
} = require("../controllers/order");
const {
  getAllTheRequests,
  ApproveRequest,
  rejectRequest,
} = require("../controllers/account");
const upload = multer.createMulter();
const adminRoute = express.Router();

adminRoute.post("/login", login);
adminRoute.get("/userList", verifyTokenAdmin, allUsers);
adminRoute.get("/profile", verifyTokenAdmin, profileDetails);
adminRoute.patch("/blockUser/:userId", verifyTokenAdmin, blockUser);
adminRoute.patch("/unBlockUser/:userId", verifyTokenAdmin, unBlockUser);

adminRoute.get("/packages", verifyTokenAdmin, packages);
adminRoute.post(
  "/addService",
  verifyTokenAdmin,
  upload.single("file"),
  addService
);
adminRoute.patch("/packages", verifyTokenAdmin, editPackage);

adminRoute.get("/order", verifyTokenAdmin, getOrderLists);
adminRoute.get("/order/:id", verifyTokenAdmin, getOrderData);
adminRoute.post("/order-approve", verifyTokenAdmin, ApproveOrder);
adminRoute.post("/order-cancel", verifyTokenAdmin, cancelOrder);
adminRoute.get("/request", verifyTokenAdmin, getAllTheRequests);
adminRoute.post("/request-approve", verifyTokenAdmin, ApproveRequest);
adminRoute.post("/request-reject", verifyTokenAdmin, rejectRequest);

module.exports = adminRoute;
