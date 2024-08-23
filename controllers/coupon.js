const Coupon = require("../models/coupon");

const getCoupons = async (req, res) => {
  try {
    const { userId, couponCode } = req.query;

    const filter = {};
    if (userId) filter.userId = userId;
    if (couponCode) filter.couponCode = couponCode;

    const coupons = await Coupon.find(filter);

    if (!coupons || coupons.length === 0) {
      return res.status(404).json({ errMsg: "No coupons found" });
    }

    res.status(200).json({ success: true, coupons });
  } catch (error) {
    console.error("Error fetching coupons:", error);
    res.status(500).json({ success: false, errMsg: "Internal server error" });
  }
};

const getAllCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find(); // Fetch all coupons

    if (!coupons || coupons.length === 0) {
      return res.status(404).json({ errMsg: "No coupons found" });
    }

    res.status(200).json({ success: true, coupons });
  } catch (error) {
    console.error("Error fetching all coupons:", error);
    res.status(500).json({ success: false, errMsg: "Internal server error" });
  }
};

const addCoupon = async (req, res) => {
  try {
    const { couponCode, couponOffer, discountType, expiryDate } =
      req.body.formValue;
    console.log(couponCode, couponOffer, discountType, expiryDate, "ugbugb");

    if (!couponCode || !couponOffer || !discountType || !expiryDate) {
      return res.status(400).json({ errMsg: "All fields are required" });
    }

    const existingCoupon = await Coupon.findOne({ couponCode });
    if (existingCoupon) {
      return res
        .status(400)
        .json({ errMsg: "Coupon with this code already exists" });
    }

    const newCoupon = new Coupon({
      couponCode,
      couponOffer,
      discountType,
      expiryDate,
    });

    const savedCoupon = await newCoupon.save();
    res.status(200).json({
      success: true,
      coupon: savedCoupon,
      msg: "Coupon added successfully",
    });
  } catch (error) {
    console.error("Error adding coupon:", error);
    res.status(500).json({ success: false, errMsg: "Internal server error" });
  }
};

const stopCoupon = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the coupon by ID
    const coupon = await Coupon.findById(id);
    if (!coupon) {
      return res.status(404).json({ errMsg: "Coupon not found" });
    }

    const now = new Date();
    const expiryDate = new Date(coupon.expiryDate);

    if (now < expiryDate) {
      // If the coupon has not expired
      // Toggle the stopped status: If it is stopped, activate it; otherwise, stop it
      coupon.isStopped = !coupon.isStopped;
    } else {
      // If the coupon has expired
      if (!coupon.isStopped) {
        // If not stopped, we can only stop it (deactivate)
        coupon.isStopped = true;
      } else {
        // If already stopped, just return a message
        return res.status(400).json({ errMsg: "Coupon is already stopped" });
      }
    }

    await coupon.save();

    res.status(200).json({
      success: true,
      coupon,
      msg: coupon.isStopped
        ? "Coupon stopped successfully"
        : "Coupon activated successfully",
    });
  } catch (error) {
    console.error("Error stopping coupon:", error);
    res.status(500).json({ success: false, errMsg: "Internal server error" });
  }
};

const useCoupon = async (req, res) => {
  try {
    const { userId, couponCode } = req.body;
    console.log(userId, couponCode, "nd");
    if (!userId || !couponCode) {
      console.log(userId, couponCode, "nd");

      return res.status(404).json({ errMsg: "Something is Wrong" });
    }
    const coupon = await Coupon.findOne({ couponCode, isStopped: false });

    if (!coupon) {
      return res.status(404).json({ errMsg: "Coupon not found or is stopped" });
    }

    // if (coupon.userId.includes(userId)) {
    //   return res
    //     .status(400)
    //     .json({ errMsg: "User has already used this coupon" });
    // }

    coupon.userId.push(userId);
    await coupon.save();

    res.status(200).json({
      success: true,
      coupon,
      msg: "Coupon applied successfully",
    });
  } catch (error) {
    console.error("Error using coupon:", error);
    res.status(500).json({ success: false, errMsg: "Internal server error" });
  }
};

module.exports = {
  getCoupons,
  getAllCoupons,
  addCoupon,
  stopCoupon,
  useCoupon,
};
