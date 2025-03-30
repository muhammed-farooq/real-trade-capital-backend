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
const {
  purchaseConfirmation,
  purchaseConfirmationAdmin,
} = require("../assets/html/verification");
const { orderApprove, orderCancelled } = require("../assets/html/order");

const resend = new Resend(process.env.RESEND_SECRET_KEY);

// // Function to create a new TronWeb instance
const createTronWebInstance = (privateKey) => {
  return new TronWeb({
    fullHost: "https://api.trongrid.io",
    privateKey: privateKey,
  });
};

const fetchTotalUsersCount = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date();
    tomorrow.setHours(23, 59, 59, 999);

    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);

    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    // Define the find queries for different timeframes
    const findQueries = {
      daily: { createdAt: { $gte: today, $lte: tomorrow }, txnStatus },
      weekly: { createdAt: { $gte: lastWeek } },
      total: {},
    };

    // Define aggregation pipelines for counting documents
    const aggregatePipeline = (query) => [
      { $match: query },
      { $group: { _id: null, count: { $sum: 1 } } },
    ];

    // Perform aggregation for daily, weekly, and total user count
    const [dailyCount, weeklyCount, totalCount] = await Promise.all([
      userModel.aggregate(aggregatePipeline(findQueries.daily)),
      userModel.aggregate(aggregatePipeline(findQueries.weekly)),
      userModel.aggregate(aggregatePipeline(findQueries.total)),
    ]);

    // Create the result object
    const result = {
      daily: dailyCount[0]?.count || 0,
      weekly: weeklyCount[0]?.count || 0,
      total: totalCount[0]?.count || 0,
    };
    res.status(200).json(result);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server side error!" });
  }
};

const calculateTotalOrderAmounts = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date();
    tomorrow.setHours(23, 59, 59, 999);

    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);

    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    // Define the find queries for different timeframes
    const findQueries = {
      daily: {
        orderCreatedAt: { $gte: today, $lte: tomorrow },
        orderStatus: "Completed",
      },
      weekly: { orderCreatedAt: { $gte: lastWeek }, orderStatus: "Completed" },
      total: { orderStatus: "Completed" },
    };

    // Define aggregation pipelines for different timeframes
    const aggregatePipeline = (query) => [
      { $match: query },
      { $group: { _id: null, total: { $sum: "$price" } } },
    ];

    let result;

    const [dailyTotal, weeklyTotal, totalAmount] = await Promise.all([
      Order.aggregate(aggregatePipeline(findQueries.daily)),
      Order.aggregate(aggregatePipeline(findQueries.weekly)),
      Order.aggregate(aggregatePipeline(findQueries.total)),
    ]);
    console.log(dailyTotal, weeklyTotal, totalAmount);

    // Create the result object
    result = {
      daily: dailyTotal[0]?.total || 0,
      weekly: weeklyTotal[0]?.total || 0,
      total: totalAmount[0]?.total || 0,
    };

    res.status(200).json({ result });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server side error!" });
  }
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

// const placeOrder = async (req, res) => {
//   try {
//     const { configureAccount, billingDetails, payment, user, package } =
//       req.body;

//     // Validate required fields
//     if (!configureAccount || !billingDetails || !payment || !user || !package) {
//       return res
//         .status(400)
//         .send({ errMsg: "All required fields must be provided" });
//     }

//     // Validate configureAccount fields
//     if (
//       !configureAccount.price ||
//       !configureAccount.platform ||
//       !configureAccount.accountType ||
//       !configureAccount.accountSize
//     ) {
//       return res
//         .status(400)
//         .send({ errMsg: "Configuration account details are incomplete" });
//     }

//     // Validate billingDetails fields
//     if (
//       !billingDetails.firstName ||
//       !billingDetails.lastName ||
//       !billingDetails.phone ||
//       !billingDetails.mail ||
//       !billingDetails.street ||
//       !billingDetails.city ||
//       !billingDetails.postalCode ||
//       !billingDetails.dateOfBirth
//     ) {
//       return res.status(400).send({ errMsg: "Billing details are incomplete" });
//     }

//     // Validate payment method
//     if (!payment) {
//       return res.status(400).send({ errMsg: "Payment method is required" });
//     }
//     // Check if user exists
//     const userData = await User.findById(user);
//     if (!userData) {
//       return res.status(404).send({ errMsg: "User not found" });
//     }
//     const packageData = await Package.findById({ _id: package });
//     if (!packageData) {
//       return res.status(404).send({ errMsg: "Package not found" });
//     }
//     const tronWebInstance = createTronWebInstance(process.env.PRIVATE_KEY);
//     const account = await tronWebInstance.createAccount(); // Create a new TRX account for this payment
//     const paymentAddress = account.address.base58;
//     const privateKey = account.privateKey;
//     // const address =await
//     // Update user details if necessary
//     if (!userData.phone) userData.phone = billingDetails.phone;
//     if (!userData.address) userData.address = {};
//     if (!userData.address.street)
//       userData.address.street = billingDetails.street;
//     if (!userData.address.city) userData.address.city = billingDetails.city;
//     if (!userData.address.postalCode)
//       userData.address.postalCode = billingDetails.postalCode;
//     if (!userData.address.country)
//       userData.address.country = billingDetails.country;
//     if (!userData.dateOfBirth)
//       userData.dateOfBirth = billingDetails.dateOfBirth;
//     await userData.save();

//     // Fetch package details

//     // Create a new order
//     const newOrderData = {
//       name: `${billingDetails.firstName} ${billingDetails.lastName}`,
//       userId: user,
//       package,
//       privateKey,
//       paymentAddress,
//       price: Number(configureAccount.price),
//       platform: configureAccount.platform,
//       step: configureAccount.accountType,
//       amountSize: configureAccount.accountSize,
//       paymentMethod: payment,
//       country: billingDetails.country,
//       phone: billingDetails.phone,
//       mail: billingDetails.mail,
//       isCouponApplied: !!configureAccount.coupon, // double exclamation marks to ensure it's a boolean
//       couponRedusedAmount: Number(configureAccount.couponRedusedAmount), // can remain as is
//       billingDetails: {
//         title: billingDetails.title,
//         postalCode: billingDetails.postalCode,
//         country: billingDetails.country,
//         city: billingDetails.city,
//         street: billingDetails.street,
//         dateOfBirth: billingDetails.dateOfBirth,
//       },
//     };

//     // Conditionally add the coupon field if it exists
//     if (configureAccount.coupon) {
//       newOrderData.coupon = configureAccount.coupon;
//     }
//     const newOrder = new Order(newOrderData);
//     const savedOrder = await newOrder.save();

//     // Create a new account
//     const MinimumTrading = {
//       PhaseOne: packageData.evaluationStage.PhaseOne.MinimumTradingDays,
//       Funded: packageData.fundedStage.MinimumTradingDays,
//       ...(packageData.evaluationStage.PhaseTwo && {
//         PhaseTwo: packageData.evaluationStage.PhaseTwo.MinimumTradingDays,
//       }),
//     };
//     const uniqueAccountName = await generateUniqueAccountName();
//     const newAccount = new Account({
//       userId: user,
//       name: `${billingDetails.firstName} ${billingDetails.lastName}`,
//       order: savedOrder._id,
//       package,
//       amountSize: configureAccount.accountSize,
//       platform: configureAccount.platform,
//       step: configureAccount.accountType,
//       mail: billingDetails.mail,
//       paymentMethod: payment,
//       MinimumTrading,
//       accountName: uniqueAccountName,
//     });
//     await newAccount.save();

//     res.status(201).send({
//       msg: "Order placed successfully",
//       orderId: newOrder._id,
//       paymentAddress,
//     });
//   } catch (error) {
//     console.error(error.message);
//     res.status(500).send({ errMsg: "Internal server error" });
//   }
// };

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

    // Update user details if address or country is missing
    let updated = false;

    if (
      !userData.address ||
      !userData.address.street ||
      !userData.address.city ||
      !userData.address.postalCode
    ) {
      userData.address = {
        postalCode: billingDetails.postalCode,
        country: billingDetails.country,
        city: billingDetails.city,
        street: billingDetails.street,
      };
      updated = true;
    }

    if (!userData.dateOfBirth) {
      userData.dateOfBirth = billingDetails.dateOfBirth;
      updated = true;
    }

    if (!userData.phone) {
      userData.phone = billingDetails.phone;
      updated = true;
    }

    // If any fields were updated, save the changes to the user document
    if (updated) {
      await userData.save();
    }
    // Check if package exists
    const packageData = await Package.findById(package);
    if (!packageData) {
      return res.status(404).send({ errMsg: "Package not found" });
    }
    const uniqueAccountName = await generateUniqueAccountName();

    // Check if an existing pending order exists
    let existingOrder = await Order.findOne({
      userId: user,
      txnStatus: "Pending",
      orderStatus: "Pending",
    });
    console.log(existingOrder, "hahahahhh");

    let paymentAddress;
    let privateKey;

    if (existingOrder) {
      // If a pending order exists, reuse the existing order and update the necessary fields
      paymentAddress = existingOrder.paymentAddress;
      privateKey = existingOrder.privateKey;

      // Update the order status to pending again and other necessary fields
      existingOrder.orderStatus = "Pending";
      existingOrder.accountName = uniqueAccountName;
      existingOrder.paymentMethod = payment;
      existingOrder.price = Number(configureAccount.price);
      existingOrder.platform = configureAccount.platform;
      existingOrder.amountSize = configureAccount.accountSize;
      existingOrder.step = configureAccount.accountType;
      existingOrder.createdAt = new Date();
      existingOrder.orderCreatedAt = new Date();
      // Update billing details
      existingOrder.billingDetails = {
        title: billingDetails.title,
        postalCode: billingDetails.postalCode,
        country: billingDetails.country,
        city: billingDetails.city,
        street: billingDetails.street,
        dateOfBirth: billingDetails.dateOfBirth,
      };

      if (configureAccount.coupon) {
        // If the new order has a coupon, update the coupon details
        existingOrder.isCouponApplied = true;
        existingOrder.couponRedusedAmount = Number(
          configureAccount.couponRedusedAmount
        );
        existingOrder.coupon = configureAccount.coupon;
      } else {
        // If the new order does not have a coupon, remove the previous coupon details
        existingOrder.isCouponApplied = false;
        existingOrder.couponRedusedAmount = 0; // Set to 0 since no discount is applied
        existingOrder.coupon = null; // Remove the coupon information
      }

      await existingOrder.save();
    } else {
      // If no pending order, create a new TRX account and new order
      const tronWebInstance = createTronWebInstance(process.env.PRIVATE_KEY);
      const account = await tronWebInstance.createAccount();
      paymentAddress = account.address.base58;
      privateKey = account.privateKey;

      // Create a new order
      const newOrderData = {
        name: `${billingDetails.firstName}${billingDetails.lastName}`,
        userId: user,
        package,
        accountName: uniqueAccountName,
        privateKey,
        paymentAddress,
        price: Number(configureAccount.price),
        platform: configureAccount.platform,
        step: configureAccount.accountType,
        amountSize: configureAccount.accountSize,
        paymentMethod: payment,
        country: billingDetails.country,
        phone: billingDetails.phone,
        orderCancelledAt: new Date(),
        mail: billingDetails.mail,
        isCouponApplied: !!configureAccount.coupon,
        couponRedusedAmount: Number(configureAccount.couponRedusedAmount),
        billingDetails: {
          title: billingDetails.title,
          postalCode: billingDetails.postalCode,
          country: billingDetails.country,
          city: billingDetails.city,
          street: billingDetails.street,
          dateOfBirth: billingDetails.dateOfBirth,
        },
      };

      if (configureAccount.coupon) {
        newOrderData.coupon = configureAccount.coupon;
      }

      existingOrder = new Order(newOrderData);
      await existingOrder.save();
    }

    // Create or update the account for this order
    const MinimumTrading = {
      PhaseOne: packageData.evaluationStage.PhaseOne.MinimumTradingDays,
      Funded: packageData.fundedStage.MinimumTradingDays,
      ...(packageData.evaluationStage.PhaseTwo && {
        PhaseTwo: packageData.evaluationStage.PhaseTwo.MinimumTradingDays,
      }),
    };

    const accountData = {
      userId: user,
      name: `${billingDetails.firstName}${billingDetails.lastName}`,
      order: existingOrder._id,
      package,
      amountSize: configureAccount.accountSize,
      platform: configureAccount.platform,
      step: configureAccount.accountType,
      mail: billingDetails.mail,
      paymentMethod: payment,
      MinimumTrading,
      accountName: uniqueAccountName,
      createdAt: new Date(), // Update createdAt to the current date/time
    };

    // Check if an account already exists for the order
    let existingAccount = await Account.findOne({ order: existingOrder._id });
    if (existingAccount) {
      // Update the existing account and the createdAt field
      Object.assign(existingAccount, accountData);
      existingAccount.createdAt = new Date(); // Update the createdAt field to the current time
      await existingAccount.save();
    } else {
      // Create a new account if none exists
      const newAccount = new Account(accountData);
      await newAccount.save();
    }

    res.status(201).send({
      // info: "Once",
      orderId: existingOrder._id,
      paymentAddress,
    });
  } catch (error) {
    console.error(error.message, error);
    res.status(500).send({ errMsg: "Internal server error" });
  }
};

const getOrderLists = async (req, res) => {
  try {
    const { search, filter, skip, path, role, startDate, endDate } = req.query;
    console.log("Query Params:", skip, path, role, search, startDate, endDate);
    const { id } = req.payload;
    let orderList = [];
    let limit = path === "/profile" || path === "/dashboard" ? 5 : 10;

    // Build search query
    const searchConditions = [];

    // Handle spaces in search using regex
    const formattedSearch = search ? search.replace(/\s+/g, "\\s*") : "";

    // Text search on name and accountName
    if (formattedSearch) {
      searchConditions.push(
        { name: { $regex: formattedSearch, $options: "i" } },
        { accountName: { $regex: formattedSearch, $options: "i" } }
      );

      // Number search on amountSize
      const parsedAmount = parseFloat(search);
      if (!isNaN(parsedAmount)) {
        searchConditions.push({ amountSize: parsedAmount });
      }
    }

    // Date range filter on orderCreatedAt
    const dateFilter = {};
    if (startDate && !isNaN(new Date(startDate).getTime())) {
      dateFilter.$gte = new Date(startDate);
    }
    if (endDate && !isNaN(new Date(endDate).getTime())) {
      dateFilter.$lte = new Date(endDate);
    }

    // Combine queries using $and for date + search
    const finalQuery = {
      $and: [
        ...(searchConditions.length ? [{ $or: searchConditions }] : []),
        ...(Object.keys(dateFilter).length
          ? [{ orderCreatedAt: dateFilter }]
          : []),
      ],
    };

    if (role === "admin") {
      orderList = await Order.find(finalQuery)
        .skip(parseInt(skip) || 0)
        .limit(limit)
        .populate({
          path: "userId",
          select: "first_name last_name email phone",
        })
        .populate({
          path: "coupon",
          select: "couponCode discountAmount expiryDate",
        })
        .sort({ orderCreatedAt: -1 });
    }

    console.log("Order List:", orderList);
    res.status(200).json({ orderList });
  } catch (error) {
    console.error("Error:", error);
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
        : res.status(504).json({ errMsg: "Soothing wrong" });
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

    if (balance >= orderData.price) return true;
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

          const userName = orderData.name;
          const htmlContentForUser = purchaseConfirmation(userName);
          const htmlContentForAdmin = purchaseConfirmationAdmin(userName);

          try {
            await resend.emails.send({
              from: process.env.WEBSITE_MAIL,
              to: process.env.ADMIN_OFFICIAL,
              subject: "New Challenge Purchase Notification",
              html: htmlContentForAdmin,
            });
            console.log("Verification email sent successfully.");
          } catch (emailError) {
            console.error("Error sending email:", emailError);
            return res
              .status(500)
              .json({ errMsg: "Failed to send verification email." });
          }
          try {
            await resend.emails.send({
              from: process.env.WEBSITE_MAIL,
              to: orderData.mail,
              subject: "New Challenge Purchase",
              html: htmlContentForUser,
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
          return res.status(203).json({});
        }
      } else {
        res.status(504).json({ errMsg: "Order not fount" });
      }
      return res.status(200).json({ orderData });
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
    user.notificationsCount += 1;
    const userName = order.name;
    const htmlContent = orderCancelled(userName);
    try {
      await resend.emails.send({
        from: process.env.WEBSITE_MAIL,
        to: user.email,
        subject: "Challenge Purchase Update",
        html: htmlContent,
      });
      console.log("Verification email sent successfully.");
    } catch (emailError) {
      console.error("Error sending email:", emailError);
      return res
        .status(500)
        .json({ errMsg: "Failed to send verification email." });
    }
    await user.save();
    await order.save();
    await account.save();
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

    order.orderStatus = "Completed";

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
          // const orderPrice = order.couponRedusedAmount
          //   ? order.price + order.couponRedusedAmount
          //   : order.price;
          const orderPrice = order.price;
          const referralAmount =
            (orderPrice * referralUser.affiliate_share) / 100;
          referralUser.wallet += referralAmount;
          referralUser.affiliate_earned =
            (referralUser.affiliate_earned || 0) + referralAmount;
          referralUser.my_referrals.push({
            user: user.email,
            earned: referralAmount,
            amountSize: Number(account.amountSize),
            date: new Date(),
          });
          console.log(referralUser);

          await referralUser.save();
        } else {
          console.log(
            "Invalid referral calculation due to NaN values",
            order?.price,
            referralUser?.affiliate_share,
            "thsis ",
            (order?.price * referralUser?.affiliate_share) / 100
          );
        }
      }
    }
    user.notifications.push(
      notification(
        "/dashboard",
        "good",
        `Your ${account.accountName} purchase ${order.orderStatus}`
      )
    );
    const htmlContent = orderApprove(order.name);
    try {
      await resend.emails.send({
        from: process.env.WEBSITE_MAIL,
        to: user.email,
        subject: "Challenge Purchase Update",
        html: htmlContent,
      });
      console.log("Verification email sent successfully.");
    } catch (emailError) {
      console.error("Error sending email:", emailError);
      return res
        .status(500)
        .json({ errMsg: "Failed to send verification email." });
    }
    user.notificationsCount += 1;
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
  calculateTotalOrderAmounts,
};
