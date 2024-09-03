const Package = require("../models/package");
const mime = require("mime-types");
const fs = require("fs");

let msg, errMsg;

const packages = async (req, res) => {
  try {
    const packages = await Package.find({});
    console.log(packages[0].evaluationStage.PhaseOne);
    res.status(200).json({ packages });
  } catch (error) {
    res.status(504).json({ errMsg: "Gateway time-out" });
  }
};

const editPackage = async (req, res) => {
  const { step, stepData } = req.body;
  console.log(step, stepData);
  try {
    if (stepData._id) {
      const result = await Package.updateOne(
        { _id: stepData._id },
        { $set: stepData }
      );
      return res.status(200).json({ msg: "Updated Successfully" });
    } else {
      const result = await Package.insert(stepData);
      return res.status(200).json({ msg: "Updated Successfully" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ errMsg: "Server Error" });
  }
};

module.exports = {
  packages,
  editPackage,
};
