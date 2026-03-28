const express = require("express");
const {
  signup,
  login,
  profileDetails,
  verifyMail,
  newPassword,
  forgotPassword,
  NotificationCount,
} = require("../controllers/user");
const { verifyTokenUser } = require("../middlewares/auth");
const {
  getOrderLists,
  getOrderData,
  placeOrder,
  paymentCheck,
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
  getCertificates,
  downloadCertificate,
  previewCertificate,
  verifyAccountCertificate,
  verifyPayoutCertificate
} = require("../controllers/certificate");
const { useCoupon } = require("../controllers/coupon");
const { fetchCalendar } = require("../controllers/calendar");
const {
  fetchTradingAcc,
  fetchDailyGain,
  fetchDataDaily,
  fetchTradeHistory,
  getAccountWarnings,
  acknowledgeWarnings,
} = require("../controllers/analytics/dashboard");

const userRouter = express.Router();

userRouter.post("/register", signup);
userRouter.post("/login", login);
userRouter.post("/verify-mail/:id", verifyMail);
userRouter.get("/profile", verifyTokenUser, profileDetails);
userRouter.get("/notification", verifyTokenUser, NotificationCount);

userRouter.get("/packages", packages);
userRouter.get("/order/:id", verifyTokenUser, getOrderData);
userRouter.get("/payment-check/:id", verifyTokenUser, paymentCheck);

userRouter
  .route("/orders")
  .get(verifyTokenUser, getOrderLists)
  .post(verifyTokenUser, placeOrder);

userRouter
  .route("/account/:id")
  .get(verifyTokenUser, getAccountLists)
  .post(verifyTokenUser, placeOrder);

userRouter.route("/next-stage").post(verifyTokenUser, toNextStage);

userRouter.route("/payout/:id").get(verifyTokenUser, getPayoutRequestOfUser);
userRouter.get( "/payout-account/:id", verifyTokenUser, getAccountInPayoutRequest);

// Payout Page
userRouter.post("/payout-account", verifyTokenUser, PayoutRequest);
userRouter.post("/payout-affiliate", verifyTokenUser, affiliatePayoutRequest);
userRouter.get("/payout-user", verifyTokenUser, singleUserData);

// Certificate Payout
userRouter.get("/payout-certificate/:id", verifyTokenUser, generatePayoutCertificate );

// Certificate Account Passed
userRouter.get("/certificate/:accountId/preview",verifyTokenUser,previewCertificate );
userRouter.get("/certificate/:accountId",verifyTokenUser,downloadCertificate );
userRouter.get("/certificates/:id",verifyTokenUser,getCertificates );

//Verify Certificate
userRouter.get('/certificate/verify/:accountName', verifyAccountCertificate );
userRouter.get("/certificate/payout-verify/:payoutId", verifyPayoutCertificate );

userRouter.get("/withdrawal", verifyTokenUser, getAllWithdrawals);

userRouter.post("/useCoupon", verifyTokenUser, useCoupon);
userRouter.post("/new-password" , newPassword);
userRouter.post("/forgot-password", forgotPassword);

userRouter.get("/calendar/:week", fetchCalendar);

// ------------------------Dashboard------------------------------>>
userRouter.get("/trading-acc/:id", fetchTradingAcc);
userRouter.get("/dashboard/gain/:id",    fetchDailyGain);    // ?days=90
userRouter.get("/dashboard/balance/:id", fetchDataDaily);    // ?days=90
userRouter.get("/dashboard/history/:id", fetchTradeHistory); // ?page=1&limit=20 
userRouter.get("/dashboard/warnings/:id", getAccountWarnings); 
userRouter.post("/dashboard/warnings/acknowledge/:id", acknowledgeWarnings);

module.exports = userRouter;
