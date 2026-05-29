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
const { nanoid } = require("nanoid");
const onChainWallet = require("../models/chainWallet");
const generateUniqueAccountName = () => `RTC-${nanoid(8).toUpperCase()}`;
const resend = new Resend(process.env.RESEND_SECRET_KEY);
const TradingAccount = require("../models/dashboard/tradingAccount")
const { createTradingAccount } = require("./tradingAccount");

const { Web3 } = require('web3');
const { ethers } = require("ethers");
const USDT_ADDRESS = "0x55d398326f99059ff775485246999027b3197955"; 
const ANKR_API_KEY = process.env.ANKR_API_KEY; 
const RPC_URL =  `https://rpc.ankr.com/bsc/${ANKR_API_KEY}`;
const web3 = new Web3(RPC_URL);
const usdtAbi = [
    {
        "constant": true,
        "inputs": [{ "name": "_owner", "type": "address" }],
        "name": "balanceOf",
        "outputs": [{ "name": "balance", "type": "uint256" }],
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "decimals",
        "outputs": [{ "name": "", "type": "uint8" }],
        "type": "function"
    }
];
const usdtContract = new web3.eth.Contract(usdtAbi, USDT_ADDRESS);

// // Function to create a new TronWeb instance
const createTronWebInstance = (privateKey) => {
  return new TronWeb({
    fullHost: "https://api.trongrid.io",
    privateKey: privateKey,
  });
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

// Generate TRON wallet function
const generateTRONWallet = async() => {
    const tronWeb  = createTronWebInstance(process.env.PRIVATE_KEY);
    const wallet  = await tronWeb.createAccount();
    return {
        address: wallet.address.base58,
        privateKey: wallet.privateKey
    };
};

// Generate BSC wallet function
const generateBSCWallet = async() => {
    const wallet = ethers.Wallet.createRandom();
    return {
        address: wallet.address,
        privateKey: wallet.privateKey
    };
};

// ── WALLET RESOLVER ────────────────────────────────────────────────────────────
// Single source of truth for fetching/creating a payment wallet.
// Returns { address, privateKey } or throws on unsupported method.
const resolveWallet = async (payment, userId) => {
  if (payment === "USDT-TRC20") {
    // Reuse an existing unused TRON wallet for this user if available
    const existing = await onChainWallet
      .findOne({ chain: "TRON", isUsed: false, userId })
      .sort({ createdAt: -1 });

    if (existing) {
      await existing.save();
      return { address: existing.address, privateKey: existing.privatetKey };
    }

    // Create a fresh TRON account
    const account  = await generateTRONWallet();
    await onChainWallet.create({
      userId,
      address:     account.address,
      privatetKey: account.privateKey,
      chain:       "TRON",
    });
    return { address: account.address, privateKey: account.privateKey };
  }

  if (payment === "USDT-BEP20") {
    const existing = await onChainWallet
      .findOne({ chain: "BSC", isUsed: false, userId })
      .sort({ createdAt: -1 });

    if (existing) {
      await existing.save();
      return { address: existing.address, privateKey: existing.privatetKey };
    }

    const account = await generateBSCWallet()
    const address    = account.address;
    const privateKey = account.privateKey;
    await onChainWallet.create({
      userId,
      address,
      privatetKey: privateKey,
      chain:       "BSC",
    });
    return { address, privateKey };
  }

  throw new Error(`Unsupported payment method: ${payment}`);
};

const placeOrder = async (req, res) => {
  try {
    const { configureAccount, billingDetails, payment, user, package: packageId } = req.body;
 
    // ── VALIDATION ──────────────────────────────────────────────────────────
    const missing = [];
    if (!configureAccount) missing.push("configureAccount");
    if (!billingDetails)   missing.push("billingDetails");
    if (!payment)          missing.push("payment");
    if (!user)             missing.push("user");
    if (!packageId)        missing.push("package");
    if (missing.length)
      return res.status(400).json({ errMsg: `Missing fields: ${missing.join(", ")}` });
 
    const { price, platform, accountType, accountSize, coupon, couponRedusedAmount } = configureAccount;
    if (!price || !platform || !accountType || !accountSize)
      return res.status(400).json({ errMsg: "Configuration account details are incomplete" });
 
    const { firstName, lastName, phone, mail, street, city, postalCode, dateOfBirth, title, country } = billingDetails;
    if (!firstName || !lastName || !phone || !mail || !street || !city || !postalCode || !dateOfBirth)
      return res.status(400).json({ errMsg: "Billing details are incomplete" });
 
    // ── LOOKUPS ──────────────────────────────────────────────────────────────
    const [userData, packageData] = await Promise.all([
      User.findById(user),
      Package.findById(packageId),
    ]);
    if (!userData)    return res.status(404).json({ errMsg: "User not found" });
    if (!packageData) return res.status(404).json({ errMsg: "Package not found" });
 
    // ── UPDATE USER PROFILE ──────────────────────────────────────────────────
    let userNeedsUpdate = false;
    if (!userData.address?.street || !userData.address?.city || !userData.address?.postalCode) {
      userData.address = { postalCode, country, city, street };
      userNeedsUpdate = true;
    }
    if (!userData.dateOfBirth) { userData.dateOfBirth = dateOfBirth; userNeedsUpdate = true; }
    if (!userData.phone)       { userData.phone = phone;             userNeedsUpdate = true; }
    if (userNeedsUpdate) await userData.save();
 
    // ── RESOLVE WALLET ────────────────────────────────────────────────────────
    const existingOrder = await Order.findOne({
      userId: user,
      orderStatus: "Pending",
      txnStatus: "Pending",
    });
 
    let walletAddress, walletPrivateKey;
    if (existingOrder && existingOrder.paymentMethod === payment) {
      walletAddress    = existingOrder.paymentAddress;
      walletPrivateKey = existingOrder.privateKey;
    } else {
      const wallet     = await resolveWallet(payment, user);
      walletAddress    = wallet.address;
      walletPrivateKey = wallet.privateKey;
    }
 
    // ── SHARED BILLING SNAPSHOT ───────────────────────────────────────────────
    const billingSnapshot = { title, postalCode, country, city, street, dateOfBirth };
 
    // ── COUPON FIELDS ─────────────────────────────────────────────────────────
    const couponFields = coupon
      ? { isCouponApplied: true,  couponRedusedAmount: Number(couponRedusedAmount), coupon }
      : { isCouponApplied: false, couponRedusedAmount: 0, coupon: null };
 
    // ── UPSERT ORDER ──────────────────────────────────────────────────────────
    const uniqueAccountName = generateUniqueAccountName();
    let order;
 
    if (existingOrder) {
      Object.assign(existingOrder, {
        orderStatus:    "Pending",
        paymentMethod:  payment,
        paymentAddress: walletAddress,
        privateKey:     walletPrivateKey,
        price:          Number(price),
        platform,
        amountSize:     accountSize,
        step:           accountType,
        createdAt:      new Date(),
        orderCreatedAt: new Date(),
        billingDetails: billingSnapshot,
        ...couponFields,
      });
      await existingOrder.save();
      order = existingOrder;
    } else {
      order = await Order.create({
        name:           `${firstName} ${lastName}`,
        userId:         user,
        package:        packageId,
        accountName:    uniqueAccountName,
        privateKey:     walletPrivateKey,
        paymentAddress: walletAddress,
        price:          Number(price),
        platform,
        step:           accountType,
        amountSize:     accountSize,
        paymentMethod:  payment,
        country,
        phone,
        mail,
        orderCancelledAt: new Date(),
        billingDetails: billingSnapshot,
        ...couponFields,
      });
    }
 
    // ── UPSERT ACCOUNT ────────────────────────────────────────────────────────
    const MinimumTrading = {
      Funded: packageData.fundedStage.MinimumTradingDays,
      ...(packageData.evaluationStage?.PhaseOne && {
        PhaseOne: packageData.evaluationStage.PhaseOne.MinimumTradingDays,
      }),
      ...(packageData.evaluationStage?.PhaseTwo && {
        PhaseTwo: packageData.evaluationStage.PhaseTwo.MinimumTradingDays,
      }),
    };
 
    const isInstant = packageData.PackageType === "instant";

    const accountPayload = {
      userId:        user,
      name:          `${firstName} ${lastName}`,
      order:         order._id,
      package:       packageId,
      amountSize:    accountSize,
      platform,
      step:          accountType,
      mail,
      paymentMethod: payment,
      MinimumTrading,
      accountName:   order.accountName ?? uniqueAccountName,
      createdAt:     new Date(),
      phase:         isInstant ? "Funded" : "Phase One",
      expiresAt:     isInstant && packageData.Validity
      ? new Date(Date.now() + packageData.Validity * 24 * 60 * 60 * 1000)
      : null
    };
 
    let account = await Account.findOne({
      status: "Pending",
      order:  order._id,
      userId: user,
    });
 
    if (account) {
      Object.assign(account, accountPayload);
      await account.save();
    } else {
      account = await Account.create(accountPayload);
    }
 
    // NOTE: TradingAccount is NOT created here.
    // It is created in ApproveOrder once the MT login is assigned.
 
    return res.status(201).json({
      orderId:        order._id,
      paymentAddress: walletAddress,
    });
 
  } catch (error) {
    console.error("[placeOrder]", error.message, error);
    return res.status(500).json({ errMsg: "Internal server error" });
  }
};

/* =====================================================================
   BACKEND — getOrderLists  (updated)
   ---------------------------------------------------------------------
   Changes vs your current version:
   1. Accepts `orderStatus` and `paymentMethod` query params for the chips.
   2. Returns a `total` count so the frontend can paginate properly.
   3. Returns `page` / `limit` so the UI can stay in sync.
   Everything else (search regex, date filter, role) is unchanged.
   ===================================================================== */
 
const getOrderLists = async (req, res) => {
  try {
    const {
      search,
      skip,
      path,
      role,
      startDate,
      endDate,
      orderStatus, // NEW
      paymentMethod, // NEW
    } = req.query;
 
    const limit = path === "/profile" || path === "/dashboard" ? 5 : 10;
 
    /* ---------- search conditions (unchanged) ---------- */
    const searchConditions = [];
    const formattedSearch = search ? search.replace(/\s+/g, "\\s*") : "";
 
    if (formattedSearch) {
      searchConditions.push(
        { name: { $regex: formattedSearch, $options: "i" } },
        { accountName: { $regex: formattedSearch, $options: "i" } }
      );
      const parsedAmount = parseFloat(search);
      if (!isNaN(parsedAmount)) {
        searchConditions.push({ amountSize: parsedAmount });
      }
    }
 
    /* ---------- date range (unchanged) ---------- */
    const dateFilter = {};
    if (startDate && !isNaN(new Date(startDate).getTime())) {
      dateFilter.$gte = new Date(startDate);
    }
    if (endDate && !isNaN(new Date(endDate).getTime())) {
      // include the whole end day
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter.$lte = end;
    }
 
    /* ---------- build final query ---------- */
    const finalQuery = {};
 
    if (searchConditions.length) {
      finalQuery.$or = searchConditions;
    }
    if (Object.keys(dateFilter).length) {
      finalQuery.orderCreatedAt = dateFilter;
    }
 
    // NEW: status & method chip filters
    if (orderStatus && orderStatus !== "All") {
      finalQuery.orderStatus = orderStatus;
    }
    if (paymentMethod && paymentMethod !== "All") {
      finalQuery.paymentMethod = paymentMethod;
    }
 
    /* ---------- fetch + count ---------- */
    let orderList = [];
    let total = 0;
 
    if (role === "admin") {
      // run both in parallel for speed
      [orderList, total] = await Promise.all([
        Order.find(finalQuery)
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
          .sort({ orderCreatedAt: -1 }),
        Order.countDocuments(finalQuery),
      ]);
    }
 
    const currentPage = Math.floor((parseInt(skip) || 0) / limit) + 1;
 
    res.status(200).json({
      orderList,
      total, // NEW — total matching docs
      page: currentPage, // NEW
      limit, // NEW
    });
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
        : res.status(504).json({ errMsg: "Something wrong" });
    }
  } catch (error) {
    console.log(error);

    res.status(504).json({ errMsg: "Invalid Id Check the path" });
  }
};

const getUSDTBEPBalance = async (walletAddress) => {
    try {
        const balance = await usdtContract.methods.balanceOf(walletAddress).call();
        return Number(balance) / 10 ** 18; 
    } catch (error) {
        console.error("Error fetching balance:", error);
        return 0;
    }
};

const checkAndTransferPayment = async (orderData) => {
  try {
    const allowedDifference = 1.5;

    if (orderData.paymentMethod === "USDT-BEP20") {

      const balance = await getUSDTBEPBalance(orderData.paymentAddress);

      console.log("Balance BEP-20 :", balance);

      if (balance >= (orderData.price - allowedDifference)) {

        await onChainWallet.updateOne(
          { address: orderData.paymentAddress },
          { isUsed: true }
        );

        return {
          success: true,
          balance
        };
      }

      return { success: false };

    } else if (orderData.paymentMethod === "USDT-TRC20") {
      const tronWebInstance = createTronWebInstance(orderData.privateKey);
      const usdtContract = await initializeUsdtContract(tronWebInstance);
      const usdtBalance = await usdtContract.methods
        .balanceOf(orderData.paymentAddress)
        .call();

      const balance = parseFloat(
        tronWebInstance.fromSun(usdtBalance.toString())
      );

      console.log("Balance TRC-20:", balance);

      if (balance >= (orderData.price - allowedDifference)) {
        await onChainWallet.updateOne(
          { address: orderData.paymentAddress },
          { isUsed: true }
        );
        return {
          success: true,
          balance
        };
      }
      return { success: false };
    }
    return { success: false };
  } catch (error) {
    console.error("Payment Check Error:", error);
    return {
      success: false,
      transaction: null
    };
  }
};

const paymentCheck = async (req, res) => {
  try {
    const { id } = req.params;
    if (id) {
      const orderData = await Order.findById(id);
      if (orderData && orderData.paymentAddress) {
        const result = await checkAndTransferPayment(orderData);                            
        if (result.success) {
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
      // await resend.emails.send({
      //   from: process.env.WEBSITE_MAIL,
      //   to: user.email,
      //   subject: "Challenge Purchase Update",
      //   html: htmlContent,
      // });
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
  try {
    const { formValue, orderId } = req.body;
    const { username, email, password, server, platform } = formValue;

    const hashedPassword = encryptPassword(password);

    // ── Fetch order & account ─────────────────────────────────────────────────
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ errMsg: "Order not found" });
    }

    const account = await Account.findOne({ order: orderId });
    if (!account) {
      return res.status(404).json({ errMsg: "Account not found" });
    }

    // ── Fetch package — needed for Instant validity + type ────────────────────
    const packageData = await Package.findById(order.package);
    if (!packageData) {
      return res.status(404).json({ errMsg: "Package not found" });
    }
    const isInstant = packageData.PackageType === "instant";

    // ── Set credentials ───────────────────────────────────────────────────────
    const credentials = {
      email,
      username,
      password: hashedPassword,
      server,
      platform,
    };

    if (isInstant) {
      // Instant — no evaluation. Straight to funded.
      account.FundedStageCredentials = credentials;
      account.phase  = "Funded";
      account.status = "Ongoing";

      const fundedMinDays = parseInt(account.MinimumTrading.Funded) || 0;
      const minBase = new Date();
      account.MinimumTradingDays.Funded = new Date(
        minBase.setDate(minBase.getDate() + fundedMinDays)
      );

      // Validity clock starts NOW — at funding
      if (packageData.Validity) {
        account.expiresAt = new Date(
          Date.now() + packageData.Validity * 24 * 60 * 60 * 1000
        );
      }
    } else {
      // Evaluation — Phase One credentials
      account.PhaseOneCredentials = credentials;
      account.status = "Ongoing";

      const phaseOneMinTradingDays = parseInt(account.MinimumTrading.PhaseOne) || 0;
      const currentDate = new Date();
      account.MinimumTradingDays.PhaseOne = new Date(
        currentDate.setDate(currentDate.getDate() + phaseOneMinTradingDays)
      );
    }

    account.approvedDate = new Date();
    order.orderStatus    = "Completed";

    // ── Create TradingAccount now that we have an MT login ────────────────────
    await createTradingAccount({
      userId:      account.userId,
      orderId:     order._id,
      accountId:   account._id,
      packageId:   order.package,
      accountSize: order.amountSize,
      login:       username,
      phase:       isInstant ? "Funded" : "PhaseOne",
      ...(isInstant && account.expiresAt && { expiresAt: account.expiresAt }),
    });

    // ── rest unchanged — referral / notification / email / save ───────────────
    const user = await User.findById(account.userId);

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
          const referralAmount = (order.price * referralUser.affiliate_share) / 100;
          referralUser.wallet          += referralAmount;
          referralUser.affiliate_earned = (referralUser.affiliate_earned || 0) + referralAmount;
          referralUser.my_referrals.push({
            user:       user.email,
            earned:     referralAmount,
            amountSize: Number(account.amountSize),
            date:       new Date(),
          });
          await referralUser.save();
        } else {
          console.warn("[ApproveOrder] Invalid referral calculation — skipping payout", {
            price:           order?.price,
            affiliate_share: referralUser?.affiliate_share,
          });
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
    user.notificationsCount += 1;

    const htmlContent = orderApprove(order.name);
    try {
      await resend.emails.send({
        from:    process.env.WEBSITE_MAIL,
        to:      user.email,
        subject: "Challenge Purchase Update",
        html:    htmlContent,
      });
    } catch (emailError) {
      console.error("[ApproveOrder] Email send failed:", emailError);
    }

    await Promise.all([
      account.save(),
      order.save(),
      user.save(),
    ]);

    return res.status(200).json({ success: true, msg: "Order approved successfully" });

  } catch (error) {
    console.error("[ApproveOrder]", error.message, error);
    return res.status(500).json({ success: false, errMsg: "Internal server error" });
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
