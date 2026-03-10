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
const TradingAccount = require("../models/dashboard/tradingAcc")

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

// ─────────────────────────────────────────────────────────────────────────────
// controllers/orderController.js  —  placeOrder (updated)
// Only the UPSERT TRADING ACCOUNT block is new; everything else is unchanged.
// ─────────────────────────────────────────────────────────────────────────────

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
        name:           `${firstName}${lastName}`,
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

    // ── UPSERT ACCOUNT (existing) ─────────────────────────────────────────────
    const MinimumTrading = {
      PhaseOne: packageData.evaluationStage.PhaseOne.MinimumTradingDays,
      Funded:   packageData.fundedStage.MinimumTradingDays,
      ...(packageData.evaluationStage.PhaseTwo && {
        PhaseTwo: packageData.evaluationStage.PhaseTwo.MinimumTradingDays,
      }),
    };

    const accountPayload = {
      userId:        user,
      name:          `${firstName}${lastName}`,
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
    };

    const existingAccount = await Account.findOne({
      status: "Pending",
      order:  order._id,
      userId: user,
    });

    if (existingAccount) {
      Object.assign(existingAccount, accountPayload);
      await existingAccount.save();
    } else {
      await Account.create(accountPayload);
    }

    // ── UPSERT TRADING ACCOUNT ────────────────────────────────────────────────
    // Pull challenge config from the package's PhaseOne evaluation rules.
    // Package stores all values as strings (e.g. "5%", "10") — strip % and parse.
    const phaseConfig = packageData.evaluationStage.PhaseOne;
    const toNum = (v, fallback) => {
      const n = parseFloat(String(v ?? "").replace(/[^0-9.-]/g, ""));
      return isNaN(n) ? fallback : n;
    };

    const challengeConfig = {
      maxDailyLoss:   toNum(phaseConfig.MaximumDailyLoss,  5),   // stored as "5%" → 5
      maxTotalLoss:   toNum(phaseConfig.MaximumLoss,       10),  // stored as "10%" → 10
      profitTarget:   toNum(phaseConfig.ProfitTarget,      10),  // stored as "10%" → 10
      minTradingDays: toNum(phaseConfig.MinimumTradingDays, 10), // stored as "10"  → 10
      maxLotSize:     5,  // not in Package schema — keep default or add to schema
    };

    const tradingAccountPayload = {
      userId:          user,
      startingBalance: Number(accountSize),   // e.g. 25000
      challengeConfig,
      status:          "pending",             // no MT login yet — awaiting payment
      // myfxbookId / myfxbookSession are NOT set here.
      // They are set later when the user connects their MyfxBook account.
    };

    const existingTradingAccount = await TradingAccount.findOne({
      userId: user,
      order:  order._id,        // tie it to this specific order
    });

    if (existingTradingAccount) {
      // Re-placing / updating the order — refresh config in case package changed
      Object.assign(existingTradingAccount, {
        ...tradingAccountPayload,
        updatedAt: new Date(),
      });
      await existingTradingAccount.save();
    } else {
      await TradingAccount.create({
        ...tradingAccountPayload,
        order: order._id,       // keep a reference back to the order
      });
    }
    // ─────────────────────────────────────────────────────────────────────────

    return res.status(201).json({
      orderId:        order._id,
      paymentAddress: walletAddress,
    });

  } catch (error) {
    console.error("[placeOrder]", error.message, error);
    return res.status(500).json({ errMsg: "Internal server error" });
  }
};

// const generateUniqueAccountName = () => {
//   return `RTC-${nanoid(8).toUpperCase()}`;
// };

// const placeOrder = async (req, res) => {
//   try {
//     const { configureAccount, billingDetails, payment , user, package } =
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

//     // Update user details if address or country is missing
//     let updated = false;

//     if (
//       !userData.address ||
//       !userData.address.street ||
//       !userData.address.city ||
//       !userData.address.postalCode
//     ) {
//       userData.address = {
//         postalCode: billingDetails.postalCode,
//         country: billingDetails.country,
//         city: billingDetails.city,
//         street: billingDetails.street,
//       };
//       updated = true;
//     }

//     if (!userData.dateOfBirth) {
//       userData.dateOfBirth = billingDetails.dateOfBirth;
//       updated = true;
//     }

//     if (!userData.phone) {
//       userData.phone = billingDetails.phone;
//       updated = true;
//     }

//     // If any fields were updated, save the changes to the user document
//     if (updated) {
//       await userData.save();
//     }
//     // Check if package exists
//     const packageData = await Package.findById(package);
//     if (!packageData) {
//       return res.status(404).send({ errMsg: "Package not found" });
//     }
//     const uniqueAccountName = await generateUniqueAccountName();

//     // Check if an existing pending order exists
//     let existingOrder = await Order.findOne({
//       orderStatus: "Pending",
//       txnStatus: "Pending",
//       userId: user,
//     });
//     console.log(existingOrder, "existingOrder");

//     let paymentAddress;
//     let privateKey;

//     if (existingOrder) {
//       // If a pending order exists, reuse the existing order and update the necessary fields
//       if(payment !== existingOrder.paymentMethod){
//           await onChainWallet.updateOne({ address: existingOrder.paymentAddress }, { isUsed: false });
//           if(payment=="USDT-TRC20"){
//               const alreadyCreatedWallet = await onChainWallet.findOne({chain: "TRON", isUsed: false, userId: user }).sort({ createdAt: -1 });
//               if (alreadyCreatedWallet) {
//                 paymentAddress = alreadyCreatedWallet.address;
//                 privateKey = alreadyCreatedWallet.privatetKey;
//                 alreadyCreatedWallet.isUsed = true;
//                 await alreadyCreatedWallet.save();
//               } else {  
//                 const tronWebInstance = createTronWebInstance(process.env.PRIVATE_KEY);
//                 const account = await tronWebInstance.createAccount();
//                 paymentAddress = account.address.base58;
//                 privateKey = account.privateKey;
//                 //--------------------------------------------------------
//                 //Backup of pvtKey, not in use, just for reference
//                 const newWalletGenerate = new onChainWallet({
//                   userId: user,
//                   address: paymentAddress,
//                   privatetKey: privateKey,
//                   chain : "TRON"
//                 });
//                 await newWalletGenerate.save();
//                 //--------------------------------------------------------
//               }
//           } else if(payment=="USDT-BEP20"){
//               const alreadyCreatedWallet = await onChainWallet.findOne({chain: "BEP20", isUsed: false, userId: user }).sort({ createdAt: -1 });
//               if (alreadyCreatedWallet) {
//                 paymentAddress = alreadyCreatedWallet.address;
//                 privateKey = alreadyCreatedWallet.privatetKey;
//                 alreadyCreatedWallet.isUsed = true;
//                 await alreadyCreatedWallet.save();
//               } else {
//                 paymentAddress = "test-bep adress"
//                 privateKey = "test pvt key bep" 
//                 //--------------------------------------------------------
//                 //Backup of pvtKey, not in use, just for reference
//                 const newWalletGenerate = new onChainWallet({
//                   userId: user,
//                   address: paymentAddress,
//                   privatetKey: privateKey,
//                   chain : "BSC" 
//                 });
//                 await newWalletGenerate.save();
//                 //--------------------------------------------------------
//               }
//           }
//       }
//       // paymentAddress = existingOrder.paymentAddress;
//       // privateKey = existingOrder.privateKey;

//       // Update the order status to pending again and other necessary fields
//       existingOrder.orderStatus = "Pending";
//       // existingOrder.accountName = uniqueAccountName;
//       existingOrder.paymentMethod = payment;
//       existingOrder.price = Number(configureAccount.price);
//       existingOrder.platform = configureAccount.platform;
//       existingOrder.amountSize = configureAccount.accountSize;
//       existingOrder.step = configureAccount.accountType;
//       existingOrder.createdAt = new Date();
//       existingOrder.orderCreatedAt = new Date();
//       // Update billing details
//       existingOrder.billingDetails = {
//         title: billingDetails.title,
//         postalCode: billingDetails.postalCode,
//         country: billingDetails.country,
//         city: billingDetails.city,
//         street: billingDetails.street,
//         dateOfBirth: billingDetails.dateOfBirth,
//       };

//       if (configureAccount.coupon) {
//         // If the new order has a coupon, update the coupon details
//         existingOrder.isCouponApplied = true;
//         existingOrder.couponRedusedAmount = Number(
//           configureAccount.couponRedusedAmount
//         );
//         existingOrder.coupon = configureAccount.coupon;
//       } else {
//         // If the new order does not have a coupon, remove the previous coupon details
//         existingOrder.isCouponApplied = false;
//         existingOrder.couponRedusedAmount = 0; // Set to 0 since no discount is applied
//         existingOrder.coupon = null; // Remove the coupon information
//       }

//       await existingOrder.save();
//     } else {
//       // If no pending order, create a new TRX account and new order
//       if(payment=="USDT-TRC20"){
//           const alreadyCreatedWallet = await onChainWallet.findOne({chain: "TRON", isUsed: false, userId: user }).sort({ createdAt: -1 });
//           if (alreadyCreatedWallet) {
//             paymentAddress = alreadyCreatedWallet.address;
//             privateKey = alreadyCreatedWallet.privatetKey;
//             alreadyCreatedWallet.isUsed = true;
//             await alreadyCreatedWallet.save();
//           } else {
//             const tronWebInstance = createTronWebInstance(process.env.PRIVATE_KEY);
//             const account = await tronWebInstance.createAccount();
//             paymentAddress = account.address.base58;
//             privateKey = account.privateKey;
//             //--------------------------------------------------------
//             //Backup of pvtKey, not in use, just for reference
//             const newWalletGenerate = new onChainWallet({
//               userId: user,
//               address: paymentAddress,
//               privatetKey: privateKey,
//               chain : "TRON" 
//             });
//             await newWalletGenerate.save();
//             //--------------------------------------------------------
//           }
//       } else if(payment=="USDT-BEP20"){  
//           const alreadyCreatedWallet = await onChainWallet.findOne({chain: "BEP20", isUsed: false, userId: user }).sort({ createdAt: -1 });
//           if (alreadyCreatedWallet) {
//             paymentAddress = alreadyCreatedWallet.address;
//             privateKey = alreadyCreatedWallet.privatetKey;
//             alreadyCreatedWallet.isUsed = true;
//             await alreadyCreatedWallet.save();
//           } else {
//             paymentAddress = "test-bep adress"
//             privateKey = "test pvt key bep" 
//             //--------------------------------------------------------
//             //Backup of pvtKey, not in use, just for reference
//             const newWalletGenerate = new onChainWallet({
//               userId: user,
//               address: paymentAddress,
//               privatetKey: privateKey,
//               chain : "BSC" 
//             });
//             await newWalletGenerate.save();
//             //--------------------------------------------------------
//           }
//       }
      

//       // Create a new order
//       const newOrderData = {
//         name: `${billingDetails.firstName}${billingDetails.lastName}`,
//         userId: user,
//         package,
//         accountName: uniqueAccountName,
//         privateKey,
//         paymentAddress,
//         price: Number(configureAccount.price),
//         platform: configureAccount.platform,
//         step: configureAccount.accountType,
//         amountSize: configureAccount.accountSize,
//         paymentMethod: payment,
//         country: billingDetails.country,
//         phone: billingDetails.phone,
//         orderCancelledAt: new Date(),
//         mail: billingDetails.mail,
//         isCouponApplied: !!configureAccount.coupon,
//         couponRedusedAmount: Number(configureAccount.couponRedusedAmount),
//         billingDetails: {
//           title: billingDetails.title,
//           postalCode: billingDetails.postalCode,
//           country: billingDetails.country,
//           city: billingDetails.city,
//           street: billingDetails.street,
//           dateOfBirth: billingDetails.dateOfBirth,
//         },
//       };

//       if (configureAccount.coupon) {
//         newOrderData.coupon = configureAccount.coupon;
//       }

//       existingOrder = new Order(newOrderData);
//       await existingOrder.save();
//     }

//     // Create or update the account for this order
//     const MinimumTrading = {
//       PhaseOne: packageData.evaluationStage.PhaseOne.MinimumTradingDays,
//       Funded: packageData.fundedStage.MinimumTradingDays,
//       ...(packageData.evaluationStage.PhaseTwo && {
//         PhaseTwo: packageData.evaluationStage.PhaseTwo.MinimumTradingDays,
//       }),
//     };

//     const accountData = {
//       userId: user,
//       name: `${billingDetails.firstName}${billingDetails.lastName}`,
//       order: existingOrder._id,
//       package,
//       amountSize: configureAccount.accountSize,
//       platform: configureAccount.platform,
//       step: configureAccount.accountType,
//       mail: billingDetails.mail,
//       paymentMethod: payment,
//       MinimumTrading,
//       accountName: uniqueAccountName,
//       createdAt: new Date(), // Update createdAt to the current date/time
//     };

//     // Check if an account already exists for the order
//     let existingAccount = await Account.findOne({ status: "Pending", order: existingOrder._id, userId: user });
//     if (existingAccount) {
//       // Update the existing account and the createdAt field
//       Object.assign(existingAccount, accountData);
//       existingAccount.createdAt = new Date(); // Update the createdAt field to the current time
//       await existingAccount.save();
//     } else {
//       // Create a new account if none exists
//       const newAccount = new Account(accountData);
//       await newAccount.save();
//     }

//     res.status(201).send({
//       // info: "Once",
//       orderId: existingOrder._id,
//       paymentAddress,
//     });
//   } catch (error) {
//     console.error(error.message, error);
//     res.status(500).send({ errMsg: "Internal server error" });
//   }
// };

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

    // Construct the final query (preventing empty $and)
    const finalQuery = {};

    if (searchConditions.length) {
      finalQuery.$or = searchConditions;
    }

    if (Object.keys(dateFilter).length) {
      finalQuery.orderCreatedAt = dateFilter;
    }

    // Fetch orders based on role
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
    if(orderData.paymentMethod === "USDT-BEP20"){
      const balance = await getUSDTBEPBalance(orderData.paymentAddress)
      console.log('Balance BEP-20 :',balance);
      if (balance >= orderData.price) {
          await onChainWallet.updateOne(
            { address: orderData.paymentAddress },
            { isUsed: true }
          );
        return true;
      }
      else return false;
    } else if(orderData.paymentMethod === "USDT-TRC20"){
      const tronWebInstance = createTronWebInstance(orderData.privateKey);
      const usdtContract = await initializeUsdtContract(tronWebInstance);
      const usdtBalance = await usdtContract.methods
        .balanceOf(orderData.paymentAddress)
        .call();
      const balanceInSun = usdtBalance.toString();

      const balance = parseFloat(tronWebInstance.fromSun(balanceInSun));
      console.log("Balance TRC-20:", balance);
      if (balance >= orderData.price){
          await onChainWallet.updateOne(
            { address: orderData.paymentAddress },
            { isUsed: true }
          );
        return true;
      }
      else return false;
    }  
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

    if(username){
      await TradingAccount.findOneAndUpdate({userId: user._id, order: orderId },{login : username})
    }

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
