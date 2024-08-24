const Stripe = require("stripe");
const Order = require("../models/order");
const User = require("../models/user");
const Admin = require("../models/admin");
const Account = require("../models/account");
const CryptoJS = require("crypto-js");
const Package = require("../models/package");

const stripe = Stripe(process.env.STRIPE_KEY);
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
      !billingDetails.postalCode
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
    await userData.save();

    // Fetch package details
    const packageData = await Package.findById({ _id: package });
    if (!packageData) {
      return res.status(404).send({ errMsg: "Package not found" });
    }

    // Create a new order
    const newOrder = new Order({
      name: `${billingDetails.firstName} ${billingDetails.lastName}`,
      userId: user,
      package,
      price: configureAccount.price,
      platform: configureAccount.platform,
      step: configureAccount.accountType,
      amountSize: configureAccount.accountSize,
      paymentMethod: payment,
      country: billingDetails.country,
      phone: billingDetails.phone,
      mail: billingDetails.mail,
      coupon: configureAccount?.coupon,
      couponRedusedAmount: configureAccount?.couponRedusedAmount,
      billingDetails: {
        title: billingDetails.title,
        postalCode: billingDetails.postalCode,
        country: billingDetails.country,
        city: billingDetails.city,
        street: billingDetails.street,
        dateOfBirth: billingDetails?.dateOfBirth,
      },
    });
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

    res
      .status(201)
      .send({ msg: "Order placed successfully", order: savedOrder });
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
      if (path == "/profile") {
        orderList = await Order.find({ customerId: id })
          .limit(limit)
          .populate({ path: "providerId", select: "name" })
          .sort({ orderCreatedAt: -1 });
      } else {
        orderList = await Order.find({ customerId: id })
          .populate({ path: "providerId", select: "name" })
          .sort({ orderCreatedAt: 1 });
      }
    } else if (role == "admin") {
      orderList = await Order.find({})
        .skip(parseInt(skip))
        .limit(limit)
        .populate({
          path: "userId",
          select: "first_name last_name email phone",
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
    res.status(504).json({ errMsg: "Invalid Id Check the path" });
  }
};

const paymentModeHandle = async (req, res) => {
  try {
    const { method } = req.query;
    const orderDetails = req.body;
    console.log(method);
    console.log(orderDetails);
    if (method === "strip") {
      const queryParams = new URLSearchParams({
        status: "success",
        orderDetail: JSON.stringify(orderDetails),
      });
      const date = new Date();
      const user = await stripe.customers.create({
        metadata: {
          userId: orderDetails.customerId,
          orderCreatAt: date,
          price: orderDetails.grandTotal,
        },
      });
      const session = await stripe.checkout.sessions.create({
        customer: user.id,
        line_items: [
          {
            price_data: {
              currency: "inr",
              product_data: {
                name: `Total grand price: ${orderDetails.grandTotal} INR `,
                metadata: {
                  id: orderDetails.option[0]._id,
                  gandTotal: orderDetails.grandTotal,
                },
              },
              unit_amount:
                orderDetails.grandTotal > 999999
                  ? 999999 * 100
                  : orderDetails.grandTotal * 100,
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        payment_method_types: ["card"], // Specify 'card' to allow credit card payments
        success_url: `${process.env.SERVER_URL}/payment?${queryParams}`,
        cancel_url: `${process.env.CLIENT_URL}/payments?status=false`,
      });
      res.send({ url: session.url });
    }
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
    console.log(error);
  }
};

const paymentStatusHandle = async (req, res) => {
  try {
    const { status, orderDetail } = req.query;
    const date = new Date();
    const orderDetails = JSON.parse(orderDetail);
    console.log(orderDetails, "dfsjhfsjdfzsjhdfjshdf");

    if (status === "success" && orderDetails) {
      const order = new Order({
        providerId: orderDetails.providerId,
        customerId: orderDetails.customerId,
        name: orderDetails.name,
        mobile: orderDetails.mobile,
        email: orderDetails.email,
        eventDate: orderDetails.date,
        address: orderDetails.address,
        options: orderDetails.option,
        grandTotal: orderDetails.grandTotal,
        paymentType: "strip",
        orderCreatedAt: date,
      });
      const save = await order.save();
      if (save) {
        const priceProvider = Math.floor((orderDetails.grandTotal * 90) / 100);
        const priceAdmin = Math.floor((orderDetails.grandTotal * 10) / 100);
        const walletHistoryProvider = {
          date: new Date(),
          amount: priceProvider,
          from: orderDetails.customerId,
          transactionType: "Credit",
        };
        const walletHistoryAdmin = {
          date: new Date(),
          amount: priceAdmin,
          from: orderDetails.customerId,
          transactionType: "Credit",
        };

        const updateProvider = await Provider.updateOne(
          { _id: orderDetails.providerId },
          {
            $inc: { wallet: priceProvider },
            $push: { walletHistory: walletHistoryProvider },
          }
        );

        const updateAdmin = await Admin.updateOne(
          { phone: process.env.ADMIN_NUMBER },
          {
            $inc: { wallet: priceAdmin },
            $push: { walletHistory: walletHistoryAdmin },
          }
        );

        return (
          updateProvider &&
          updateAdmin &&
          res.redirect(
            `${process.env.CLIENT_URL}/payments?status=true&id=${order._id}`
          )
        );
      } else
        return res.redirect(`${process.env.CLIENT_URL}/payments?status=false&`);
    } else {
      return res.redirect(`${process.env.CLIENT_URL}/payments?status=false`);
    }
  } catch (error) {
    res.redirect(`${process.env.CLIENT_URL}/payments?status=false`);
    console.log(error.message);
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
    await account.save();
    console.log("Account updated and saved:", account);

    // Update order status
    order.orderStatus = "Cancelled";
    account.orderCancelledAt = new Date();
    order.note = reason;
    await order.save();
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

    await account.save();
    console.log("Account updated and saved:", account);

    // Update order status
    order.orderStatus = "Completed";
    await order.save();
    console.log("Order status updated and saved:", order);

    // Update user details if needed
    const user = await User.findById(account.userId);
    if (user && !user.isPurchased) {
      user.isPurchased = true;
      await user.save();
      console.log("User status updated and saved:", user);
    }

    res.status(200).json({ success: true, msg: "Order approved successfully" });
  } catch (error) {
    console.error("Error approving order:", error);
    res.status(500).json({ success: false, errMsg: "Internal server error" });
  }
};

const verifyrzpay = async (req, res) => {
  const razorpay_order_id = req.body?.response.razorpay_order_id;
  const razorpay_payment_id = req.body?.response.razorpay_payment_id;
  const razorpay_signature = req.body?.response.razorpay_signature;
  const { course_id, amount, mode_of_payment } = req.body.purchaseData;

  const body = `${razorpay_order_id}|${razorpay_payment_id}`;
  try {
    const generated_signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_PASS)
      .update(body, "utf-8")
      .digest("hex");

    if (generated_signature === razorpay_signature) {
      const parsedDate = new Date();
      parsedDate.setDate(parsedDate.getDate());
      const purchase_date = parsedDate.toISOString();

      const order = new orderModel({
        course_id: course_id,
        user_id: req.user._id,
        payment_mode: mode_of_payment,
        date_of_purchase: purchase_date,
        amount: amount,
      });
      await order
        .save()
        .then(() => {
          res.status(200).json({ message: "Payment success" });
        })
        .catch((error) => {
          console.error(error);
          res.status(500).json({ message: "Saving order failed" });
        });
    } else {
      console.log("invalid signature");
      res.json({ status: false, message: "Invalid signature" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Failed" });
  }
};

module.exports = {
  getOrderLists,
  getOrderData,
  paymentModeHandle,
  paymentStatusHandle,
  cancelOrder,
  verifyrzpay,
  placeOrder,
  ApproveOrder,
};
