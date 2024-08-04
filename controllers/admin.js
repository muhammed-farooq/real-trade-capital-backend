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

const addPost = async (req, res) => {
  const { files, body: { caption, tagline } } = req;
  const { id } = req.payload;
  console.log(files,caption,tagline);

  try {
      let postImages = [];
      if(!files) return res.status(400).json({errMsg : 'Image needed'})
      if(!caption) return res.status(400).json({errMsg : 'caption needed'})  
      if(files){
          for await (const file of files){
              const upload = await cloudinary.uploader.upload(file.path)
              postImages.push(upload.secure_url)
              if (fs.existsSync(file.path))fs.unlinkSync(file.path);
          }
      }
      const newPost = new Post({
          providerId: id,
          caption,
          tagline,
          postImages,       
      })
      console.log(newPost);
      await newPost.save();
      res.status(200)?.json({ newPost ,msg:"post upload successfully"});
  } catch (error) {
      if(files){
          for await (const file of files)if (fs.existsSync(file.path))fs.unlinkSync(file.path);
      }
      console.log(error);
      res.status(500).json({errMsg:'Server Error'});
 }
}
const accessChat = async (req, res) => {
  try {
      const { receiverId,role } = req.query;
      const senderId = req.payload.id;

      if (!receiverId || !senderId || !role) return res.status(400).json({errMsg:'Something wrong'});

      const findQuery = {
          providerId: role == 'user' ? receiverId : senderId,
          userId: role == 'user' ? senderId : receiverId,
      };

      let isChat = await Chat.findOne(findQuery)
          .then((async (result) => {
              role == 'user' ? 
              result = await Provider.populate(result, { path: 'providerId', select: 'name phone email location profilePic' })
                  : result = await User.populate(result, { path: 'userId', select: 'name place email phone image place' })
          }))
      if (isChat) {
          console.log(isChat,'hoi');
          res.status(200).json({ chat: isChat })
      } else {
          const chatData = {
              providerId: role == 'user' ? receiverId : senderId,
              userId: role == 'user' ? senderId : receiverId,
          }
          let createdChat = (await Chat.create(chatData))
          if (createdChat){
              role == 'user' ?
                  createdChat = await Provider.populate(createdChat, { path: 'providerId', select: 'name phone email location profilePic' })
                  : createdChat = await User.populate(createdChat, { createdChat: 'userId', select: 'name place email phone image place' })
          } 

              res.status(200).json({ caht:createdChat })
      }
  } catch (error) {
      console.log(error);
      return res.status(500)
  }
}
module.exports = {
  login,
  profileDetails,
};
