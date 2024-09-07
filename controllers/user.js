const User = require("../models/user");
const bcrypt = require("bcrypt");
const Joi = require("joi");
const { generateToken } = require("../middlewares/auth");
const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_SECRET_KEY);
let msg, errMsg;

const signupSchema = Joi.object({
  firstName: Joi.string().min(1).required(),
  lastName: Joi.string().min(1).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(), // Ensuring password has at least 8 characters
  referralCode: Joi.string().allow("").optional(),
});

const signup = async (req, res) => {
  try {
    const { firstName, lastName, email, password, referralCode } = req.body;

    // Validate the incoming request body against the schema
    const { error } = signupSchema.validate({
      firstName,
      lastName,
      email,
      password,
      referralCode,
    });

    if (error) {
      return res.status(400).json({ errMsg: error.details[0].message });
    }

    // Check if the user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ errMsg: "User already exists" });
    }

    const timestamp = Date.now();
    const randomNum = Math.floor(Math.random() * 1000);
    const timestampPart = timestamp.toString().slice(-4);
    const randomNumPart = randomNum.toString().padStart(3, "0");
    const referralNumber = `#${timestampPart}${randomNumPart}`;

    // Hash the password with bcrypt
    const hashedPassword = await bcrypt.hash(
      password + process.env.PASSWORD_SALT,
      10
    );

    // Create new user
    const newUser = new User({
      first_name: firstName,
      last_name: lastName,
      email,
      password: hashedPassword,
      affiliate_id: referralNumber,
      parent_affiliate: referralCode || "",
      is_affiliate: !!referralCode,
    });

    await newUser.save();

    // Send verification email after user is created
    const verificationLink = `${process.env.API_URL}/verify/${newUser._id}`;
    const htmlContent = ` <html>
      <body style="font-family: Arial, sans-serif; background-color: #f7f7f7; padding: 20px; margin: 0;">
        <div style="max-width: 600px; margin: auto; background-color: #ffffff; padding: 20px; border-radius: 8px;">
          <h2 style="color: #333333; text-align: center;">Welcome to Our Service, ${firstName} ${lastName}!</h2>
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
        to: email,
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

    res.status(201).json({ msg: "Registration Success" });
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(504).json({ msg: "Gateway time-out" });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      console.log("User not found");
      return res.status(401).json({ errMsg: "User not found" });
    }

    console.log("Stored Hashed Password:", user.password);

    // Compare the provided password with the hashed password stored in the database
    const passwordCheck = await bcrypt.compare(
      password + process.env.PASSWORD_SALT,
      user.password
    );

    console.log("Password Check Result:", passwordCheck);
    console.log("Provided Password:", password);
    console.log(
      "Combined Password + Salt:",
      password + process.env.PASSWORD_SALT
    );

    if (!passwordCheck) {
      return res.status(401).json({ errMsg: "Password doesn't match" });
    }

    if (user.isBanned) {
      return res.status(401).json({ errMsg: "You are blocked", timeout: true });
    }

    if (!user.isVerify) {
      return res.status(201).json({
        info: "You are not verified yet please check your email",
        timeout: true,
      });
    }

    const token = generateToken(user._id, "user");
    console.log("Generated Token:", token);

    res.status(200).json({
      msg: "Login successfully",
      name: user?.name,
      userData: user,
      token,
      role: "user",
    });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(504).json({ errMsg: "Gateway time-out" });
  }
};

const newPasswordSchema = Joi.object({
  id: Joi.string().required(),
  password: Joi.string().min(8).required(),
});

const newPassword = async (req, res) => {
  try {
    const { id, password } = req.body;
    const { error } = newPasswordSchema.validate({
      id,
      password,
    });
    if (error) {
      return res.status(400).json({ errMsg: error.details[0].message });
    }
    const user = await User.findById(id);
    console.log(id, password, user);

    if (!user) {
      console.log("User not found");
      return res.status(401).json({ errMsg: "User not found" });
    }

    console.log("Stored Hashed Password:", user.password);

    const hashedPassword = await bcrypt.hash(
      password + process.env.PASSWORD_SALT,
      10
    );
    if (!hashedPassword) {
      return res.status(401).json({ errMsg: "Password not correct" });
    }

    if (user.isBanned) {
      return res.status(401).json({ errMsg: "You are blocked", timeout: true });
    }

    if (!user.isVerify) {
      return res.status(201).json({
        info: "You are not verified yet please check your email",
        timeout: true,
      });
    }
    user.password = hashedPassword;
    user.forgotPassword = false;
    await user.save();
    res.status(200).json({
      msg: "Password changed successfully",
    });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(504).json({ errMsg: "Gateway time-out" });
  }
};

const forgotPassword = async (req, res) => {
  try {
    console.log(req.body);
    const { email } = req.body;

    if (!email) {
      return res.status(401).json({ errMsg: "Mail is required" });
    }
    const user = await User.findOne({ email });
    console.log(user);

    if (!user) {
      console.log("User not found");
      return res.status(401).json({ errMsg: "User not found" });
    }
    if (user.isBanned) {
      return res.status(401).json({ errMsg: "You are blocked", timeout: true });
    }
    if (user.forgotPassword) {
      return res.status(203).json({
        info: "Please Check your mail, You already requested",
        timeout: true,
      });
    }

    if (!user.isVerify) {
      return res.status(201).json({
        info: "You are not verified yet please check your email",
        timeout: true,
      });
    }
    const verificationLink = `${process.env.API_URL}/new-password/${user._id}`;
    const htmlContent = ` <html>
      <body style="font-family: Arial, sans-serif; background-color: #f7f7f7; padding: 20px; margin: 0;">
        <div style="max-width: 600px; margin: auto; background-color: #ffffff; padding: 20px; border-radius: 8px;">
          <h2 style="color: #333333; text-align: center;">Welcome to Real Trade Capital, ${
            user?.first_name
          } ${user?.last_name}!</h2>
          <p style="color: #555555; text-align: center;">To create new password click the button below:</p>
          <div style="text-align: center; margin: 20px 0;">
            <a href="${verificationLink}" style="display: inline-block; padding: 10px 20px; color: white; background-color: #007bff; border-radius: 5px; text-decoration: none;">New Password</a>
          </div>
          <p style="color: #555555; text-align: center;">If you did not sign up for this account, you can safely ignore this email.</p>
          <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 20px 0;"/>
          <footer style="color: #999999; text-align: center;">
            <p>&copy; ${new Date().getFullYear()} Your Company. All rights reserved.</p>
            <p>
              <a href='${
                process.env.API_URL
              }' style="color: #007bff; text-decoration: none;">Visit our website</a> | 
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
        to: email,
        subject: "Forgot Password from REAL TRADE CAPITAL",
        html: htmlContent,
      });
      console.log("Verification email sent successfully.");
    } catch (emailError) {
      console.error("Error sending email:", emailError);
      return res
        .status(500)
        .json({ errMsg: "Failed to send mail. please try again." });
    }
    user.forgotPassword = true;
    await user.save();
    res.status(200).json({
      info: "Please Check your mail for further instructions",
    });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(504).json({ errMsg: "Gateway time-out" });
  }
};

const verifyMail = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ errMsg: "User not found" });
    }

    if (user.isBanned) {
      return res.status(403).json({ errMsg: "You are blocked", timeout: true });
    }

    if (!user.isVerify) {
      user.isVerify = true;
      await user.save(); // Save the updated user document to the database
      return res.status(200).json({
        msg: "Your mail is verified",
        email: user.email,
      });
    } else {
      return res.status(200).json({
        info: "You are already verified. You can sign in.",
        email: user.email,
      });
    }
  } catch (error) {
    console.error("Error during email verification:", error);
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
    const userData = await User.findOne({ _id: req.payload.id });
    //   userData?userData.walletHistory = userData.walletHistory.slice(-5):res.status(400).json({ errMsg:'User not found'});
    console.log(userData.notifications);
    userData
      ? res.status(200).json({ userData })
      : res.status(400).json({ errMsg: "User not found" });
  } catch (error) {
    console.log(error);
    res.status(504).json({ errMsg: "Gateway time-out" });
  }
};

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
  newPassword,
  forgotPassword,
  blockUser,
  unBlockUser,
  profileDetails,
  verifyMail,
};
