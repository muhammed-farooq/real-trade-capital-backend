const Package = require("../models/package");
const cloudinary = require("../config/cloudinary");
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

const addService = async (req, res) => {
  const {
    file,
    body: { name },
  } = req;
  try {
    let serviceName = name.toUpperCase();
    let image;
    console.log(serviceName, file);
    if (!file) return res.status(400).json({ errMsg: "Image needed" });
    if (!name) return res.status(400).json({ errMsg: "Name needed" });

    const exsistingService = await Package.find({ serviceName });
    if (exsistingService.length)
      return res.status(400).json({ errMsg: "service already exist" });

    const mimeType = mime.lookup(file.originalname);
    if (mimeType && mimeType.includes("image/")) {
      console.log(process.env.CLOUDINARY_API_KEY);
      const upload = await cloudinary.uploader.upload(file?.path);
      image = upload.secure_url;
      fs.unlinkSync(file.path);
    } else {
      fs.unlinkSync(file.path);
      if (exsistingService)
        return res
          .status(400)
          .json({ errMsg: "This file not a image", status: false });
    }
    const newService = await new Package({
      serviceName,
      serviceImage: image,
    }).save();

    res.status(200)?.json({ newService });
  } catch (error) {
    console.log(error);
    res.status(500).json({ errMsg: "Server Error" });
    fs.unlinkSync(file?.path);
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
  addService,
  editPackage,
};
