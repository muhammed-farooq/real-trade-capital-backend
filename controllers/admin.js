const { generateToken } = require("../middlewares/auth");
const Admin = require("../models/admin");
const sha256 = require("js-sha256");

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const adminEmail = process.env.ADMIN_MAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    // console.log(adminEmail,adminPassword,email, password,email === adminEmail , password === adminPassword);
    console.log('hii');

    // const admin = await Admin.findOne({ email })
    if (email && password) {
      if (email === adminEmail && password === adminPassword) {
        // if (!admin) return res.status(401).json({ errMsg: "Admin not found" });
        // const passwordCheck =
        //   admin.password == sha256(password + process.env.PASSWORD_SALT);
        // if (!passwordCheck)
        //   return res.status(401).json({ errMsg: "Password doesn't match" });
        const token = generateToken(adminEmail, "admin");
        // console.log(adminEmail);
        res
          .status(200)
          .json({
            msg: "Login successfully",
            adminData: {email:adminEmail},
            token,
            role: "admin",
          });
      }else{
        return res.status(401).json({ errMsg: "Email or Password incorrect" });
      }
    } else {
      return res.status(402).json({ errMsg: "Fill the form" });
    }
  } catch (error) {
    console.log(error);
    res.status(504).json({ errMsg: "Gateway time-out" });
  }
};

const profileDetails = async (req, res) => {
  try {
    const admin = await Admin.findOne({ _id: req.payload.id }).populate({
      path: "walletHistory.from",
      select: "name",
    });
    if (admin) res.status(200).json({ adminData: admin });
    else res.status(400).json({ errMsg: "somthig Wrong" });
  } catch (error) {
    res.status(504).json({ errMsg: "Gateway time-out" });
  }
};

module.exports = {
  login,
  profileDetails,
};
