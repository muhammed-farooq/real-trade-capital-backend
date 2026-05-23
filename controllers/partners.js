const PartnerApplication = require("../models/partnerApplication");
const userModel = require("../models/user");

const applyPartner = async (req, res) => {
  try {
    const userId = req.user._id; // from auth middleware, never trust client

    const {
      promotionMethod,
      audienceSize,
      experience,
      expectedReferrals,
      socialLinks,
      motivation,
    } = req.body;

    if (!promotionMethod || !audienceSize || !experience || expectedReferrals == null) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // block duplicate pending application
    const existing = await PartnerApplication.findOne({
      user: userId,
    });
    if (existing) {
      return res.status(409).json({ message: "You already have a application" });
    }

    const application = await PartnerApplication.create({
      user: userId,
      affiliate_id: req.user.affiliate_id,
      promotionMethod,
      audienceSize,
      experience,
      expectedReferrals,
      socialLinks,
      motivation,
    });

    return res.status(201).json({ message: "Application submitted", application });
  } catch (err) {
    console.error("applyPartner error:", err);
    if (err.code === 11000) {
      return res.status(409).json({ message: "You already have a pending application" });
    }   
    return res.status(500).json({ message: "Server error" });
  }
};

const checkStatus = async(req,res) => {
    try {   
        const userId = req.user._id; 

        const application = await PartnerApplication.findOne({
            user: userId,
            status: "pending",
        });

        if(!application){
            return res.status(200).json({ message: "No pending application found" , hasApplied : false });   
        }

        return res.status(200).json({ message: "Pending application found", hasApplied : true });
    } catch (err) {
        console.error("applyPartner error:", err);
        return res.status(500).json({ message: "Server error" });
    }       
}   

const reviewApplication = async (req, res) => {
  try {
    const { applicationId, decision, adminNote, affiliateShare } = req.body;
    // decision: "approved" | "rejected"
    // affiliateShare: number, required when approved

    if (!["approved", "rejected"].includes(decision)) {
      return res.status(400).json({ message: "Invalid decision" });
    }

    const application = await PartnerApplication.findById(applicationId);
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }
    if (application.status !== "pending") {
      return res.status(409).json({ message: "Application already reviewed" });
    }

    let share;
    if (decision === "approved") {
      share = Number(affiliateShare);
      if (!share || share < 0 || share > 100) {
        return res.status(400).json({ message: "Invalid commission percentage" });
      }
    }

    application.status = decision;
    application.reviewedBy = "admin"; 
    application.reviewedAt = new Date();
    application.adminNote = adminNote;
    await application.save();

    if (decision === "approved") {
      await userModel.findByIdAndUpdate(application.user, {
        is_partner: true,
        partner_since: new Date(),
        affiliate_share: share,
      });
    }

    return res.status(200).json({ message: `Application ${decision}`, application });
  } catch (err) {
    console.error("reviewApplication error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

const partnerStats = async (req, res) => {
  try {
    const agg = await userModel.aggregate([
      { $match: { is_partner: true } },
      {
        $group: {
          _id: null,
          totalPartners: { $sum: 1 },
          totalWallet: { $sum: "$wallet" },
          totalEarned: { $sum: "$affiliate_earned" },
          totalPaidOut: { $sum: "$affiliate_paidOut" },
        },
      },
    ]);

    const pendingCount = await PartnerApplication.countDocuments({ status: "pending" });

    const stats = agg[0] || {
      totalPartners: 0,
      totalWallet: 0,
      totalEarned: 0,
      totalPaidOut: 0,
    };

    return res.status(200).json({ ...stats, pendingCount });
  } catch (err) {
    console.error("partnerStats error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

const listApplications = async (req, res) => {
  try {
    const { status = "pending" } = req.query; // pending | approved | rejected | all
    const filter = status === "all" ? {} : { status };

    const applications = await PartnerApplication.find(filter)
      .populate("user", "first_name last_name email affiliate_id")
      .sort({ createdAt: -1 });

    return res.status(200).json({ applications });
  } catch (err) {
    console.error("listApplications error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  applyPartner,
  checkStatus,
  listApplications, 
  reviewApplication, 
  partnerStats
};  