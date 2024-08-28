const express = require("express");
const { signup, login, profileDetails } = require("../controllers/user");
const { verifyTokenUser } = require("../middlewares/auth");

const multer = require("../config/multer");

const {
  paymentModeHandle,
  paymentStatusHandle,
  getOrderLists,
  getOrderData,
  placeOrder,
} = require("../controllers/order");

const { packages } = require("../controllers/package");

const { getAccountLists, toNextStage } = require("../controllers/account");

const {
  getPayoutRequestOfUser,
  getAccountInPayoutRequest,
  singleUserData,
  PayoutRequest,
  affiliatePayoutRequest,
} = require("../controllers/payout");
const { getAllWithdrawals } = require("../controllers/withdrawal");
const {
  generatePayoutCertificate,
  generateAccountCertificate,
} = require("../controllers/certificate");
const { useCoupon } = require("../controllers/coupon");

const upload = multer.createMulter();

const userRouter = express.Router();

userRouter.post("/register", signup);
userRouter.post("/login", login);
userRouter.get("/profile", verifyTokenUser, profileDetails);

userRouter.get("/packages", packages);
userRouter.get("/order/:id", verifyTokenUser, getOrderData);

userRouter
  .route("/payment")
  .get(paymentStatusHandle)
  .post(verifyTokenUser, paymentModeHandle);

userRouter
  .route("/orders")
  .get(verifyTokenUser, getOrderLists)
  .post(verifyTokenUser, placeOrder);
// .patch(verifyTokenUser,cancelOrder)

userRouter
  .route("/account/:id")
  .get(verifyTokenUser, getAccountLists)
  .post(verifyTokenUser, placeOrder);
// .patch(verifyTokenUser,cancelOrder)
userRouter.route("/next-stage").post(verifyTokenUser, toNextStage);

userRouter.route("/payout/:id").get(verifyTokenUser, getPayoutRequestOfUser);
userRouter.get(
  "/payout-account/:id",
  verifyTokenUser,
  getAccountInPayoutRequest
);
userRouter.post("/payout-account", verifyTokenUser, PayoutRequest);
userRouter.post("/payout-affiliate", verifyTokenUser, affiliatePayoutRequest);
userRouter.get("/payout-user", verifyTokenUser, singleUserData);
userRouter.get(
  "/payout-certificate/:id",
  verifyTokenUser,
  generatePayoutCertificate
);
userRouter.get(
  "/account-certificate/:id",
  verifyTokenUser,
  generateAccountCertificate
);

userRouter.get("/withdrawal", verifyTokenUser, getAllWithdrawals);

userRouter.post("/useCoupon", verifyTokenUser, useCoupon);


module.exports = userRouter;
