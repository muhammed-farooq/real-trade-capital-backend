const User = require("../models/user");
const sha256 = require("js-sha256");
const fs = require("fs");
const cloudinary = require("../config/cloudinary");
const mime = require("mime-types");

const { generateToken } = require("../middlewares/auth");

let msg, errMsg;

const signup = async (req, res) => {
  try {
    const { firstName, lastName, email, password, referralCode } = req.body;
    console.log(firstName, lastName, email, password, referralCode);
    // Check if the user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ errMsg: "User already exists" });
    }
    console.log("yo1");

    // Generate a unique referral number
    const timestamp = Date.now();
    const randomNum = Math.floor(Math.random() * 1000);
    const timestampPart = timestamp.toString().slice(-4);
    const randomNumPart = randomNum.toString().padStart(3, "0");
    const referralNumber = `#${timestampPart}${randomNumPart}`;
    console.log("yo2");

    // Create new user
    const newUser = new User({
      first_name: firstName,
      last_name: lastName,
      email,
      password: sha256(password + process.env.PASSWORD_SALT),
      affiliate_id: referralNumber,
      parent_affiliate: referralCode || "none",
    });

    await newUser.save();
    console.log("yo2");

    // Handle referral code
    if (referralCode) {
      console.log("yo7777");

      const referralUser = await User.findOne({ affiliate_id: referralCode });
      if (!referralUser) {
        return res.status(200).json({ errMsg: "Invalid referral code" });
      }

      referralUser.wallet += 50; // Add bonus to referrer
      referralUser.my_referrals.push(newUser._id); // Add new user to referrer's referrals
      await referralUser.save();
    }
    console.log("yo3");

    res.status(200).json({ msg: "Registration Success" });
  } catch (error) {
    console.log(error);
    res.status(504).json({ msg: "Gateway time-out" });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ errMsg: "User not found" });
    const passwordCheck =
      user.password == sha256(password + process.env.PASSWORD_SALT);
    if (!passwordCheck)
      return res.status(401).json({ errMsg: "Password doesn't match" });
    if (user.isBanned)
      return res.status(401).json({ errMsg: "You are blocked" });
    if (!user.isVerify)
      return res
        .status(401)
        .json({ errMsg: "You are not verified yet please check you male" });
    const token = generateToken(user._id, "user");
    console.log(token);

    res.status(200).json({
      msg: "Login successfully",
      name: user?.name,
      userData: user,
      token,
      role: "user",
    });
  } catch (error) {
    console.log(error);
    res.status(504).json({ errMsg: "Gateway time-out" });
  }
};

const allUsers = async (req, res) => {
  try {
    const userData = await User.find();
    console.log(userData);
    res.status(200).json({ userData });
  } catch (error) {
    res.status(504).json({ errMsg: "Gateway time-out" });
  }
};

const profileDetails = async (req, res) => {
  try {
    const userData = await User.findOne({ _id: req.payload.id }).populate({
      path: "walletHistory.from",
      select: "name",
    });
    //   userData?userData.walletHistory = userData.walletHistory.slice(-5):res.status(400).json({ errMsg:'User not found'});
    console.log(userData.walletHistory);
    userData
      ? res.status(200).json({ userData })
      : res.status(400).json({ errMsg: "User not found" });
  } catch (error) {
    console.log(error);
    res.status(504).json({ errMsg: "Gateway time-out" });
  }
};

// const editUser = async (req, res) => {
//   const {
//     file,
//     body: { name, email, place },
//   } = req;
//   try {
//     let image;
//     if (file) {
//       const mimeType = mime.lookup(file.originalname);
//       if (mimeType && mimeType.includes("image/")) {
//         console.log(process.env.CLOUDINARY_API_KEY);
//         const upload = await cloudinary.uploader.upload(file?.path);
//         image = upload.secure_url;
//         if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
//       } else {
//         if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
//         return res
//           .status(400)
//           .json({ errMsg: "This file not a image", status: false });
//       }
//     }
//     console.log(file, image);
//     const userData = await User.findByIdAndUpdate(
//       { _id: req.payload.id },
//       { $set: { name: name, email: email, place: place, image: image } }
//     );
//     console.log(userData);
//     userData
//       ? res
//           .status(200)
//           .json({
//             msg: "Profile updated successfully",
//             userData: { name: name, email: email, place: place, image: image },
//           })
//       : res.status(400).json({ errMsg: "User not found" });
//   } catch (error) {
//     if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
//     res.status(504).json({ errMsg: "Gateway time-out" });
//   }
// };

const blockUser = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(userId);
    const user = await User.findById(userId);
    if (!user) return res.status(400).json({ errMsg: "User Not Found" });
    user.isBanned = true;
    await user.save();
    res.status(200).json({ msg: "Unblocked Successfully" });
  } catch (error) {
    res.status(500).json({ errMsg: "Gateway time-out" });
  }
};

const unBlockUser = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(userId);
    const user = await User.findById(userId);
    if (!user) return res.status(400).json({ errMsg: "User Not Found" });
    user.isBanned = false;
    await user.save();
    res.status(200).json({ msg: "Unblocked Successfully" });
  } catch (error) {
    res.status(500).json({ errMsg: "Gateway time-out" });
  }
};

module.exports = {
  signup,
  login,
  allUsers,
  blockUser,
  unBlockUser,
  profileDetails,
};
