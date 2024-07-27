const express = require("express");
const { login, profileDetails } = require("../controllers/admin");
const { verifyTokenAdmin } = require("../middlewares/auth");
const { packages, addService, editPackage } = require("../controllers/package");
const { allUsers, blockUser, unBlockUser } = require("../controllers/user");
const {
  providerList,
  blockProvider,
  unBlockProvider,
  confirmProvider,
} = require("../controllers/provider");

const multer = require("../config/multer");
const { postsList, postBann, commentList } = require("../controllers/posts");
const { getOrderLists, getOrderData } = require("../controllers/order");
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
adminRoute.patch(
  "/services",
  verifyTokenAdmin,
  upload.single("file"),
  editPackage
);

adminRoute.get("/providerList", verifyTokenAdmin, providerList);
adminRoute.patch(
  "/confirmProvider/:providerId",
  verifyTokenAdmin,
  confirmProvider
);
adminRoute.patch("/blockProvider/:providerId", verifyTokenAdmin, blockProvider);
adminRoute.patch(
  "/unBlockProvider/:providerId",
  verifyTokenAdmin,
  unBlockProvider
);

adminRoute
  .route("/post")
  .get(verifyTokenAdmin, postsList)
  .patch(verifyTokenAdmin, postBann);

adminRoute.route("/comment").get(verifyTokenAdmin, commentList);

adminRoute.get("/orders", verifyTokenAdmin, getOrderLists);
adminRoute.get("/order/:id", verifyTokenAdmin, getOrderData);

module.exports = adminRoute;
