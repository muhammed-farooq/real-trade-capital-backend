const express = require("express");
const { login, profileDetails } = require("../controllers/admin");
const { verifyTokenAdmin } = require("../middlewares/auth");
const { packages, editPackage } = require("../controllers/package");
const { allUsers, blockUser, unBlockUser } = require("../controllers/user");

const {
  getOrderLists,
  getOrderData,
  ApproveOrder,
  cancelOrder,
  calculateTotalOrderAmounts,
} = require("../controllers/order");
const {
  getAllTheRequests,
  ApproveRequest,
  rejectRequest,
  getAccountLists,
} = require("../controllers/account");
const {
  getPayoutRequestAdmin,
  ApprovePayout,
  rejectPayout,
  affiliateApprovePayout,
} = require("../controllers/payout");
const {
  getAllWithdrawals,
  addWithdrawal,
  deleteWithdrawal,
} = require("../controllers/withdrawal");
const {
  addCoupon,
  getCoupons,
  getAllCoupons,
  stopCoupon,
  useCoupon,
} = require("../controllers/coupon");
const adminRoute = express.Router();

adminRoute.post("/login", login);
adminRoute.get("/userList", verifyTokenAdmin, allUsers);
adminRoute.get("/profile", verifyTokenAdmin, profileDetails);
adminRoute.patch("/blockUser/:userId", verifyTokenAdmin, blockUser);
adminRoute.patch("/unBlockUser/:userId", verifyTokenAdmin, unBlockUser);

adminRoute.get("/packages", verifyTokenAdmin, packages);
adminRoute.patch("/packages", verifyTokenAdmin, editPackage);
adminRoute.route("/account/:id").get(verifyTokenAdmin, getAccountLists);
adminRoute.get("/order", verifyTokenAdmin, getOrderLists);
adminRoute.post("/order-approve", verifyTokenAdmin, ApproveOrder);
adminRoute.post("/order-cancel", verifyTokenAdmin, cancelOrder);
adminRoute.get("/sails-details", verifyTokenAdmin, calculateTotalOrderAmounts);
adminRoute.get("/request", verifyTokenAdmin, getAllTheRequests);
adminRoute.post("/request-approve", verifyTokenAdmin, ApproveRequest);
adminRoute.post("/request-reject", verifyTokenAdmin, rejectRequest);

adminRoute.get("/payout", verifyTokenAdmin, getPayoutRequestAdmin);
adminRoute.post("/payout-approve", verifyTokenAdmin, ApprovePayout);
adminRoute.post(
  "/affiliate-payout-approve",
  verifyTokenAdmin,
  affiliateApprovePayout
);
adminRoute.post("/payout-reject", verifyTokenAdmin, rejectPayout);

adminRoute.get("/withdrawal", verifyTokenAdmin, getAllWithdrawals);

adminRoute.post("/withdrawal", addWithdrawal);

adminRoute.patch("/withdrawal/:id", verifyTokenAdmin, deleteWithdrawal);

adminRoute.post("/coupon", verifyTokenAdmin, addCoupon);
adminRoute.get("/coupon", verifyTokenAdmin, getAllCoupons);
adminRoute.patch("/coupon/:id", verifyTokenAdmin, stopCoupon);

module.exports = adminRoute;
