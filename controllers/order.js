const Stripe = require("stripe");
const Order = require("../models/order");
const User = require("../models/user");
const Account = require("../models/account");
const CryptoJS = require("crypto-js");
const Package = require("../models/package");
const { notification } = require("./common");
const TronWeb = require("tronweb");
const USDT_CONTRACT_ADDRESS = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";
const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_SECRET_KEY);

// // Function to create a new TronWeb instance
const createTronWebInstance = (privateKey) => {
  return new TronWeb({
    fullHost: "https://api.trongrid.io",
    privateKey: privateKey,
  });
};

// Function to initialize USDT contract
const initializeUsdtContract = async (tronWebInstance) => {
  return await tronWebInstance.contract().at(USDT_CONTRACT_ADDRESS);
};

const encryptPassword = (password) => {
  const secretKey = process.env.PASSWORD_SALT;
  return CryptoJS.AES.encrypt(password, secretKey).toString();
};

const generateUniqueAccountName = async () => {
  let uniqueName;
  let isUnique = false;
  while (!isUnique) {
    uniqueName = `acc_${Math.random().toString(36).substr(2, 9)}`;
    const existingAccount = await Account.findOne({ accountName: uniqueName });
    if (!existingAccount) {
      isUnique = true;
    }
  }
  return uniqueName;
};

const placeOrder = async (req, res) => {
  try {
    const { configureAccount, billingDetails, payment, user, package } =
      req.body;

    // Validate required fields
    if (!configureAccount || !billingDetails || !payment || !user || !package) {
      return res
        .status(400)
        .send({ errMsg: "All required fields must be provided" });
    }

    // Validate configureAccount fields
    if (
      !configureAccount.price ||
      !configureAccount.platform ||
      !configureAccount.accountType ||
      !configureAccount.accountSize
    ) {
      return res
        .status(400)
        .send({ errMsg: "Configuration account details are incomplete" });
    }

    // Validate billingDetails fields
    if (
      !billingDetails.firstName ||
      !billingDetails.lastName ||
      !billingDetails.phone ||
      !billingDetails.mail ||
      !billingDetails.street ||
      !billingDetails.city ||
      !billingDetails.postalCode ||
      !billingDetails.dateOfBirth
    ) {
      return res.status(400).send({ errMsg: "Billing details are incomplete" });
    }

    // Validate payment method
    if (!payment) {
      return res.status(400).send({ errMsg: "Payment method is required" });
    }
    // Check if user exists
    const userData = await User.findById(user);
    if (!userData) {
      return res.status(404).send({ errMsg: "User not found" });
    }
    const packageData = await Package.findById({ _id: package });
    if (!packageData) {
      return res.status(404).send({ errMsg: "Package not found" });
    }
    const tronWebInstance = createTronWebInstance(process.env.PRIVATE_KEY);
    const account = await tronWebInstance.createAccount(); // Create a new TRX account for this payment
    const paymentAddress = account.address.base58;
    const privateKey = account.privateKey;
    // const address =await
    // Update user details if necessary
    if (!userData.phone) userData.phone = billingDetails.phone;
    if (!userData.address) userData.address = {};
    if (!userData.address.street)
      userData.address.street = billingDetails.street;
    if (!userData.address.city) userData.address.city = billingDetails.city;
    if (!userData.address.postalCode)
      userData.address.postalCode = billingDetails.postalCode;
    if (!userData.address.country)
      userData.address.country = billingDetails.country;
    if (!userData.dateOfBirth)
      userData.dateOfBirth = billingDetails.dateOfBirth;
    await userData.save();

    // Fetch package details

    // Create a new order
    const newOrderData = {
      name: `${billingDetails.firstName} ${billingDetails.lastName}`,
      userId: user,
      package,
      privateKey,
      paymentAddress,
      price: configureAccount.price,
      platform: configureAccount.platform,
      step: configureAccount.accountType,
      amountSize: configureAccount.accountSize,
      paymentMethod: payment,
      country: billingDetails.country,
      phone: billingDetails.phone,
      mail: billingDetails.mail,
      isCouponApplied: !!configureAccount.coupon, // double exclamation marks to ensure it's a boolean
      couponRedusedAmount: configureAccount.couponRedusedAmount, // can remain as is
      billingDetails: {
        title: billingDetails.title,
        postalCode: billingDetails.postalCode,
        country: billingDetails.country,
        city: billingDetails.city,
        street: billingDetails.street,
        dateOfBirth: billingDetails.dateOfBirth,
      },
    };

    // Conditionally add the coupon field if it exists
    if (configureAccount.coupon) {
      newOrderData.coupon = configureAccount.coupon;
    }
    const newOrder = new Order(newOrderData);
    const savedOrder = await newOrder.save();

    // Create a new account
    const MinimumTrading = {
      PhaseOne: packageData.evaluationStage.PhaseOne.MinimumTradingDays,
      Funded: packageData.fundedStage.MinimumTradingDays,
      ...(packageData.evaluationStage.PhaseTwo && {
        PhaseTwo: packageData.evaluationStage.PhaseTwo.MinimumTradingDays,
      }),
    };
    const uniqueAccountName = await generateUniqueAccountName();
    const newAccount = new Account({
      userId: user,
      name: `${billingDetails.firstName} ${billingDetails.lastName}`,
      order: savedOrder._id,
      package,
      amountSize: configureAccount.accountSize,
      platform: configureAccount.platform,
      step: configureAccount.accountType,
      mail: billingDetails.mail,
      paymentMethod: payment,
      MinimumTrading,
      accountName: uniqueAccountName,
    });
    await newAccount.save();

    res.status(201).send({
      msg: "Order placed successfully",
      orderId: newOrder._id,
      paymentAddress,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send({ errMsg: "Internal server error" });
  }
};

const getOrderLists = async (req, res) => {
  try {
    const { filter, skip, path, role } = req.query;
    console.log(skip, path, role);
    let { id } = req.payload;
    let orderList = [];
    let limit = 10;
    if (path == "/profile" || path == "/dashboard") limit = 5;

    if (role == "user") {
    } else if (role == "admin") {
      orderList = await Order.find({})
        // .skip(parseInt(skip))
        // .limit(limit)
        .populate({
          path: "userId",
          select: "first_name last_name email phone",
        })
        .populate({
          path: "coupon", // The field name in Order schema
          select: "couponCode discountAmount expiryDate", // Specify fields from Coupon schema
        })
        .sort({ orderCreatedAt: -1 });
    }

    console.log("Order List:", orderList);
    res.status(200).json({ orderList });
  } catch (error) {
    console.log("Error:", error);
    res.status(504).json({ errMsg: "Gateway time-out" });
  }
};

const getOrderData = async (req, res) => {
  try {
    const { id } = req.params;
    if (id) {
      const orderData = await Order.findOne({ _id: id })
        .populate({
          path: "providerId",
          select: "name phone email location feedback",
        })
        .populate({
          path: "options.optionId",
          populate: {
            path: "serviceId",
            select: "serviceName",
          },
        });
      // console.log(orderData);
      orderData
        ? res.status(200).json({ orderData })
        : res.status(504).json({ errMsg: "Somthig wrong" });
    }
  } catch (error) {
    console.log(error);

    res.status(504).json({ errMsg: "Invalid Id Check the path" });
  }
};

const paymentCheck = async (req, res) => {
  try {
    const { id } = req.params;
    if (id) {
      const orderData = await Order.findById(id);
      // console.log(orderData);
      if (orderData && orderData.paymentAddress) {
        const result = await checkAndTransferPayment(orderData);
        if (result) {
          orderData.txnStatus = "Completed";
          await orderData.save();

          // Send verification email after user is created
          const verificationLink = `${process.env.API_URL}/verify/`;
          const htmlContent = ` <html>
      <body style="font-family: Arial, sans-serif; background-color: #f7f7f7; padding: 20px; margin: 0;">
        <div style="max-width: 600px; margin: auto; background-color: #ffffff; padding: 20px; border-radius: 8px;">
          <h2 style="color: #333333; text-align: center;">Welcome to Our Service,   !</h2>
          <p style="color: #555555; text-align: center;">Thank you for signing up. Please confirm your email address by clicking the button below:</p>
          <div style="text-align: center; margin: 20px 0;">
            <a href="${verificationLink}" style="display: inline-block; padding: 10px 20px; color: white; background-color: #007bff; border-radius: 5px; text-decoration: none;">Confirm Email</a>
          </div>
          <p style="color: #555555; text-align: center;">If you did not sign up for this account, you can safely ignore this email.</p>
          <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 20px 0;"/>
          <footer style="color: #999999; text-align: center;">
            <p>&copy; ${new Date().getFullYear()} Your Company. All rights reserved.</p>
            <p>
              <a href="${
                process.env.API_URL
              }" style="color: #007bff; text-decoration: none;">Visit our website</a> | 
              <a href="${
                process.env.API_URL
              }/new-challenge" style="color: #007bff; text-decoration: none;">new-challenge</a>
            </p>
          </footer>
        </div>
      </body>
      </html>
    `;

          try {
            await resend.emails.send({
              from: process.env.WEBSITE_MAIL,
              to: process.env.ADMIN_OFFICIAL,
              subject: "Verification mail from REAL TRADE CAPITAL",
              html: htmlContent,
            });
            console.log("Verification email sent successfully.");
          } catch (emailError) {
            console.error("Error sending email:", emailError);
            return res
              .status(500)
              .json({ errMsg: "Failed to send verification email." });
          }
          console.log("Transferred successfully");
          return res.status(200).json({
            status: true,
            msg: "Payment Completed",
            transaction: result.transaction,
          });
        } else {
          res.status(504).json({ errMsg: "Order not fount" });
        }
      } else {
        res.status(504).json({ errMsg: "Order not fount" });
      }
      res.status(200).json({ orderData });
    } else {
      return res
        .status(400)
        .json({ status: "error", errMsg: "Order not fount" });
    }
  } catch (error) {
    console.log(error);

    res.status(504).json({ errMsg: "Invalid Id Check the path" });
  }
};
const checkAndTransferPayment = async (orderData) => {
  const tronWebInstance = createTronWebInstance(orderData.privateKey);
  const usdtContract = await initializeUsdtContract(tronWebInstance);

  try {
    const usdtBalance = await usdtContract.methods
      .balanceOf(orderData.paymentAddress)
      .call();
    const balanceInSun = usdtBalance.toString();

    const balance = parseFloat(tronWebInstance.fromSun(balanceInSun));
    console.log("balance :", balance);

    if (balance <= orderData.price) return true;
    else return false;
  } catch (error) {
    if (error.response) {
      console.error("Error response data:", error.response.data);
      console.error("Error response status:", error.response.status);
      console.error("Error response headers:", error.response.headers);
    } else if (error.request) {
      console.error("Error request data:", error.request);
    } else {
      console.error("Error message:", error);
    }
    return { success: false, transaction: null };
  }
};

const cancelOrder = async (req, res) => {
  try {
    const { reason, orderId } = req.body;
    console.log("Request body:", req.body);
    const order = await Order.findById(orderId);
    if (!order) {
      console.log(`Order not found for orderId: ${orderId}`);
      return res.status(404).json({ errMsg: "Order not found" });
    }
    console.log("Order found:", order);

    const account = await Account.findOne({ order: orderId });
    if (!account) {
      console.log(`Account not found for orderId: ${orderId}`);
      return res.status(404).json({ errMsg: "Account not found" });
    }
    console.log("Account found:", account);
    account.status = "Cancelled";
    account.note = reason;
    account.orderCancelledAt = new Date();

    // Update order status
    order.orderStatus = "Cancelled";
    account.orderCancelledAt = new Date();
    order.note = reason;

    const user = await User.findById(order.userId);
    if (!user) {
      return res.status(404).json({ error: "user not found" });
    }
    user.notifications.push(
      notification(
        "/dashboard",
        "err",
        `Your ${account.accountName} purchase ${order.orderStatus}`
      )
    );
    await user.save();
    await order.save();
    await account.save();
    const verificationLink = `${process.env.API_URL}/verify/`;
    const htmlContent = ` <html>
      <body style="font-family: Arial, sans-serif; background-color: #f7f7f7; padding: 20px; margin: 0;">
        <div style="max-width: 600px; margin: auto; background-color: #ffffff; padding: 20px; border-radius: 8px;">
          <h2 style="color: #333333; text-align: center;">Welcome to Our Service,      !</h2>
          <p style="color: #555555; text-align: center;">Thank you for signing up. Please confirm your email address by clicking the button below:</p>
          <div style="text-align: center; margin: 20px 0;">
            <a href="${verificationLink}" style="display: inline-block; padding: 10px 20px; color: white; background-color: #007bff; border-radius: 5px; text-decoration: none;">Confirm Email</a>
          </div>
          <p style="color: #555555; text-align: center;">If you did not sign up for this account, you can safely ignore this email.</p>
          <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 20px 0;"/>
          <footer style="color: #999999; text-align: center;">
            <p>&copy; ${new Date().getFullYear()} Your Company. All rights reserved.</p>
            <p>
              <a href="${
                process.env.API_URL
              }" style="color: #007bff; text-decoration: none;">Visit our website</a> | 
              <a href="${
                process.env.API_URL
              }/new-challenge" style="color: #007bff; text-decoration: none;">new-challenge</a>
            </p>
          </footer>
        </div>
      </body>
      </html>
    `;

    try {
      await resend.emails.send({
        from: process.env.WEBSITE_MAIL,
        to: user.email,
        subject: "Verification mail from REAL TRADE CAPITAL",
        html: htmlContent,
      });
      console.log("Verification email sent successfully.");
    } catch (emailError) {
      console.error("Error sending email:", emailError);
      return res
        .status(500)
        .json({ errMsg: "Failed to send verification email." });
    }
    console.log("Account updated and saved:", account);
    console.log("Order status updated and saved:", order);

    res
      .status(200)
      .json({ success: true, msg: "Order Cancelled successfully" });
  } catch (error) {
    console.error("Error approving order:", error);
    res.status(500).json({ success: false, errMsg: "Internal server error" });
  }
};

const ApproveOrder = async (req, res) => {
  console.log("ApproveOrder endpoint hit");
  try {
    const { formValue, orderId } = req.body;
    console.log("Request body:", req.body);

    const { username, email, password, server, platform } = formValue;
    const hashedPassword = encryptPassword(password);
    // const dateNow = Date;
    const order = await Order.findById(orderId);
    if (!order) {
      console.log(`Order not found for orderId: ${orderId}`);
      return res.status(404).json({ errMsg: "Order not found" });
    }
    // console.log("Order found:", order);

    const account = await Account.findOne({ order: orderId });
    if (!account) {
      console.log(`Account not found for orderId: ${orderId}`);
      return res.status(404).json({ errMsg: "Account not found" });
    }
    // console.log("Account found:", account);

    console.log(username, email, password, server, platform);
    account.PhaseOneCredentials = {
      email,
      username,
      password: hashedPassword,
      server,
      platform,
    };
    account.status = "Ongoing";
    account.approvedDate = new Date();

    // Populate MinimumTradingDays and MinimumTrading based on the package
    const phaseOneMinTradingDays = parseInt(account.MinimumTrading.PhaseOne);
    // const phaseTwoMinTradingDays = parseInt(account.MinimumTrading.PhaseTwo);
    // const fundedMinTradingDays = parseInt(account.MinimumTrading.Funded);

    // Calculate the minimum trading end date for Phase One
    const currentDate = new Date();
    account.MinimumTradingDays.PhaseOne = new Date(
      currentDate.setDate(currentDate.getDate() + phaseOneMinTradingDays)
    );

    // console.log("Account updated and saved:", account);

    // Update order status
    order.orderStatus = "Completed";
    // console.log("Order status updated and saved:", order);

    // Update user details if needed
    const user = await User.findById(account.userId);
    console.log("dddddddddddddddddddddddddddddddddddddddd", user);

    if (user && !user.isPurchased) {
      user.isPurchased = true;

      if (user.parent_affiliate) {
        const referralUser = await User.findOne({
          affiliate_id: user.parent_affiliate,
        });

        if (
          referralUser &&
          !isNaN(order.price) &&
          !isNaN(referralUser.affiliate_share)
        ) {
          const orderPrice = order.couponRedusedAmount
            ? order.price + order.couponRedusedAmount
            : order.price;
          const referralAmount =
            (orderPrice * referralUser.affiliate_share) / 100;
          referralUser.wallet += referralAmount;
          referralUser.affiliate_earned =
            (referralUser.affiliate_earned || 0) + referralAmount;
          referralUser.my_referrals.push({
            user: user.email,
            earned: referralAmount,
            amountSize: account.amountSize,
            date: new Date(),
          });

          console.log(referralUser);

          await referralUser.save();
        } else {
          console.log(
            "Invalid referral calculation due to NaN values",
            order.price,
            referralUser.affiliate_share,
            "thsis ",
            (order.price * referralUser.affiliate_share) / 100
          );
        }
      }
      const verificationLink = `${process.env.API_URL}/verify/`;
      const htmlContent = ` <html>
          <body style="font-family: Arial, sans-serif; background-color: #f7f7f7; padding: 20px; margin: 0;">
            <div style="max-width: 600px; margin: auto; background-color: #ffffff; padding: 20px; border-radius: 8px;">
              <h2 style="color: #333333; text-align: center;">Welcome to Our Service,    !</h2>
              <p style="color: #555555; text-align: center;">Thank you for signing up. Please confirm your email address by clicking the button below:</p>
              <div style="text-align: center; margin: 20px 0;">
                <a href="${verificationLink}" style="display: inline-block; padding: 10px 20px; color: white; background-color: #007bff; border-radius: 5px; text-decoration: none;">Confirm Email</a>
              </div>
              <p style="color: #555555; text-align: center;">If you did not sign up for this account, you can safely ignore this email.</p>
              <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 20px 0;"/>
              <footer style="color: #999999; text-align: center;">
                <p>&copy; ${new Date().getFullYear()} Your Company. All rights reserved.</p>
                <p>
                  <a href="${
                    process.env.API_URL
                  }" style="color: #007bff; text-decoration: none;">Visit our website</a> | 
                  <a href="${
                    process.env.API_URL
                  }/new-challenge" style="color: #007bff; text-decoration: none;">new-challenge</a>
                </p>
              </footer>
            </div>
          </body>
          </html>
        `;

      try {
        await resend.emails.send({
          from: process.env.WEBSITE_MAIL,
          to: user.email,
          subject: "Verification mail from REAL TRADE CAPITAL",
          html: htmlContent,
        });
        console.log("Verification email sent successfully.");
      } catch (emailError) {
        console.error("Error sending email:", emailError);
        return res
          .status(500)
          .json({ errMsg: "Failed to send verification email." });
      }
    } else {
      const verificationLink = `${process.env.API_URL}/verify/`;
      const htmlContent = ` <html>
        <body style="font-family: Arial, sans-serif; background-color: #f7f7f7; padding: 20px; margin: 0;">
          <div style="max-width: 600px; margin: auto; background-color: #ffffff; padding: 20px; border-radius: 8px;">
            <h2 style="color: #333333; text-align: center;">Welcome to Our Service,      !</h2>
            <p style="color: #555555; text-align: center;">Thank you for signing up. Please confirm your email address by clicking the button below:</p>
            <div style="text-align: center; margin: 20px 0;">
              <a href="${verificationLink}" style="display: inline-block; padding: 10px 20px; color: white; background-color: #007bff; border-radius: 5px; text-decoration: none;">Confirm Email</a>
            </div>
            <p style="color: #555555; text-align: center;">If you did not sign up for this account, you can safely ignore this email.</p>
            <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 20px 0;"/>
            <footer style="color: #999999; text-align: center;">
              <p>&copy; ${new Date().getFullYear()} Your Company. All rights reserved.</p>
              <p>
                <a href="${
                  process.env.API_URL
                }" style="color: #007bff; text-decoration: none;">Visit our website</a> | 
                <a href="${
                  process.env.API_URL
                }/new-challenge" style="color: #007bff; text-decoration: none;">new-challenge</a>
              </p>
            </footer>
          </div>
        </body>
        </html>
      `;

      try {
        await resend.emails.send({
          from: process.env.WEBSITE_MAIL,
          to: user.email,
          subject: "Verification mail from REAL TRADE CAPITAL",
          html: htmlContent,
        });
        console.log("Verification email sent successfully.");
      } catch (emailError) {
        console.error("Error sending email:", emailError);
        return res
          .status(500)
          .json({ errMsg: "Failed to send verification email." });
      }
    }
    user.notifications.push(
      notification(
        "/dashboard",
        "good",
        `Your ${account.accountName} purchase ${order.orderStatus}`
      )
    );
    console.log("dddddddddddddddddddddddddddddddddddddddd");
    await account.save();
    await order.save();
    await user.save();
    console.log("User status updated and saved:", user);

    res.status(200).json({ success: true, msg: "Order approved successfully" });
  } catch (error) {
    console.error("Error approving order:", error);
    res.status(500).json({ success: false, errMsg: "Internal server error" });
  }
};

module.exports = {
  getOrderLists,
  getOrderData,
  cancelOrder,
  placeOrder,
  ApproveOrder,
  paymentCheck,
};
