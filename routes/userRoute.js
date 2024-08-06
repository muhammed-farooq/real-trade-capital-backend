const express = require("express");
const {
  signup,
  login,
  profileDetails,
  editUser,
} = require("../controllers/user");
const { verifyTokenUser } = require("../middlewares/auth");

const multer = require("../config/multer");

const {
  paymentModeHandle,
  paymentStatusHandle,
  getOrderLists,
  getOrderData,
  cancelOrder,
  placeOrder,
} = require("../controllers/order");
const { packages } = require("../controllers/package");
const { getAccountLists, toNextStage } = require("../controllers/account");
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
userRouter
  .route("/next-stage")
  .post(verifyTokenUser, toNextStage)

module.exports = userRouter;
