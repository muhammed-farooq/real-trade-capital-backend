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
} = require("../controllers/order");
const { packages } = require("../controllers/package");
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
  .post(verifyTokenUser, paymentModeHandle);
// .patch(verifyTokenUser,cancelOrder)

module.exports = userRouter;
