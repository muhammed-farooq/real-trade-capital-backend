const jwt = require("jsonwebtoken");
const User = require("../models/user");
let errMsg;

const generateToken = (id, role) => {
  const token = jwt.sign(
    { id, role },
    process.env.TOKEN_SECRET,
    { expiresIn: "4d" } // Token will expire in 1 day
  );
  return token;
};

const verifyTokenAdmin = async (req, res, next) => {
  try {
    let token = req.headers["authorization"];
    if (!token) {
      return res.status(403).json({ errMsg: "Access Denied", timeout: true });
    }
    if (token.startsWith("Bearer ")) {
      token = token.slice(7, token.length).trimLeft();
    }
    const verified = jwt.verify(token, process.env.TOKEN_SECRET);

    req.payload = verified;
    if (req.payload.role === "admin") {
      next();
    } else {
      return res.status(403).json({ errMsg: "Access Denied", timeout: true });
    }
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        errMsg: "Session expired. Please log in again.",
        timeout: true,
      });
    }
    res.status(500).json({ errMsg: "Server Error", timeout: true });
  }
};

// The verifyTokenUser function will have a similar structure

const verifyTokenUser = async (req, res, next) => {
  try {
    let token = req.headers["authorization"];
    console.log(token,'token');

    if (!token) {
      return res.status(403).json({ errMsg: "Access Denied", timeout: true });
    }
    if (token.startsWith("Bearer ")) {
      token = token.slice(7, token.length).trimLeft();
    }
    const verified = jwt.verify(token, process.env.TOKEN_SECRET);
    console.log(verified, "verified");

    req.payload = verified;
    const user = await User.findById(req.payload.id);
    if (user.isBanned === true) {
      console.error("user.isBanned === true:");

      return res.status(403).json({ errMsg: "you are banned", timeout: true });
    } else if (req.payload.role === "user") {
      next();
    } else {
      return res.status(403).json({ errMsg: "Access Denied", timeout: true });
    }
  } catch (err) {
    console.error("JWT Verification Error:", err);
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        errMsg: "Session expired. Please log in again.",
        timeout: true,
      });
    }
    console.error("JWT Verification Error:", err);
    res.status(500).json({ errMsg: "Server Error", timeout: true });
  }
};

module.exports = {
  generateToken,
  verifyTokenAdmin,
  verifyTokenUser,
};
