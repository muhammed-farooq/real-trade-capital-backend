const Provider = require('../models/provider')
const sha256 = require('js-sha256');
const { generateToken } = require('../middlewares/auth');
const fs = require('fs');
const cloudinary = require('../config/cloudinary')
const mime = require("mime-types");
let errMsg,msg;

const signup =async (req,res) => {
    try {
        const { name, email, phone, password,services,places } = req.body;
        const lowerCaseName = name.toLowerCase();
        const exsistingProvider = await Provider.findOne({ $or: [{ name }, { phone }] });
        if(exsistingProvider) return res.status(400).json({errMsg:'Provider alredy exsist'})
    
        const newProvider =await new Provider({
            name: lowerCaseName,
            phone,
            email,
            password: sha256(password + process.env.PASSWORD_SALT),
            services,
            places,
        }).save()
        res.status(200).json({msg:'REgistration Success'});
    } catch (error) {        
        res.status(500).json({ errMsg: 'Something went wrong' })
    }
}


const login = async (req,res)=>{
    try {
        const { phone, password } = req.body;
        const provider = await Provider.findOne({ phone }).populate('services').populate({
            path: 'walletHistory.from',
            select: 'name'
        });
        if (!provider) return res.status(401).json({ errMsg: "Provider not found" });
        const passwordCheck =  provider.password == sha256(password + process.env.PASSWORD_SALT);
        if (!passwordCheck) return res.status(401).json({ errMsg: "Password doesn't match" });
        if(provider.isBanned) return res.status(401).json({errMsg:"You are blocked"});
        if(!provider.adminConfirmed) return res.status(401).json({errMsg:"You are'nt confirmed by admin"});
        const token = generateToken(provider._id,'provider')

        res.status(200).json({ msg: 'Login succesfull', providerData:provider, token, role: 'provider' })
    } catch (error) {
        console.log(error);
        res.status(504).json({ errMsg: "Gateway time-out" });
    }
}
  

const otpLogin = async (req,res)=>{
    try {
        const {phone} = req.body;
        console.log(phone,'jjjd',req.body);
        const provider = await Provider.findOne({ phone});
        if (!provider) return res.status(401).json({ errMsg: "User not found" });
        if(provider.isBanned) return res.status(401).json({errMsg:"You are blocked"});
        const token = generateToken(provider._id,'provider')

        res.status(200).json({ msg: 'Login succesfull', name: provider?.name, token, role: 'provider' })
    } catch (error) {
        res.status(504).json({ errMsg: "Gateway time-out" });
    }
}


const confirmProvider =async (req,res) => {
    try {
        const {providerId} = req.params;
        console.log(providerId);
        const provider = await Provider.findById({_id:providerId})
        if(!provider) return res.status(400).json({errMsg:'Provider not found'})
        provider.adminConfirmed = true;
        await provider.save();
        return res.status(200).json({ msg: 'Confirmed Successfully' })
    } catch (error) {
        console.log(error);  
        res.status(500).json({ errMsg: 'Something went wrong' })
    }
}

const providerList =async (req,res)=>{
    try {
        const providersData = await Provider.find()
            .populate('services', 'serviceName')
            .select('-feedback -walletHistory -password -wallet -coverPic -profilePic')
            .sort({ isUpgraded: -1 })

        res.status(200).json({providersData});
    } catch (error) {
        console.log(error);

        res.status(504).json({ errMsg: "Gateway time-out" });
    }
}

const UserProviderList = async (req, res) => {
    try {
        const { service, search, skip, place } = req.query;

        const searchQuery = { name: { $regex: new RegExp(search, 'i') } }

        const findQuery = {
            adminConfirmed: true,
            isBanned:false,
            ...(isNaN(Number(search)) && searchQuery ),
            ...(service !== 'All' && { services: { $in: service } }),
            ...(place !== 'All' && { places: { $in: place } })
        };
        console.log(isNaN(Number(search)), search, findQuery);


        const providersData = await Provider.find(findQuery).skip(skip).limit(6)
            .populate('services')
            .populate('feedback.userId', 'name image')
            .select('-walletHistory -password -wallet')
            .sort({ isUpgraded: -1 })
        console.log(providersData);


        return providersData
            ? res.status(200).json({ providersData })
            : res.status(200).json({ msg: 'Provider not found' });
    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ error: 'Internal server error' });
    } 
}


const profileDetails = async (req,res)=>{
    try {
        const providerData = await Provider.findOne({ _id: req.payload.id }).populate('services').populate({
            path: 'walletHistory.from',
            select: 'name'
        });
        console.log(providerData);
        providerData ? res.status(200).json({ providerData }) : res.status(400).json({ errMsg:'Provider not found'});
    } catch (error) {
        res.status(504).json({ errMsg: "Server error!!!" });
    }
}


const editProvider = async (req,res)=>{
    const {name,email,places,services,description,location} = req.body
    const lowerCaseName = name.toLowerCase();
    const profilePic = req.files.profilePic?req.files.profilePic[0]:null;
    const coverPic = req.files.coverPic?req.files.coverPic[0]:null
    console.log(req.body,profilePic,coverPic,req.files['profilePic']);
    try {   
        let dpPic;
        let bgPic;
        if(profilePic){
            const mimeType = mime.lookup(profilePic.originalname);
            if(mimeType && mimeType.includes("image/")) {
                const upload = await cloudinary.uploader.upload(profilePic?.path)
                dpPic = upload.secure_url;
                if (fs.existsSync(profilePic.path))fs.unlinkSync(profilePic.path);
            }else{
                if (fs.existsSync(profilePic.path))fs.unlinkSync(profilePic.path);
                return res.status(400).json({errMsg : 'This file not a image',status:false})
            }
        }
        if(coverPic){
            const mimeType = mime.lookup(coverPic.originalname);
            if(mimeType && mimeType.includes("image/")) {
                const upload = await cloudinary.uploader.upload(coverPic?.path)
                bgPic = upload.secure_url;
                if (fs.existsSync(coverPic.path))fs.unlinkSync(coverPic.path);
            }else{
                if (fs.existsSync(coverPic.path))fs.unlinkSync(coverPic.path);
                return res.status(400).json({errMsg : 'This file not a image',status:false})
            }
        }
        console.log(bgPic,dpPic);
        const providerData = await Provider.findByIdAndUpdate({_id:req.payload.id},
            {$set:{name:lowerCaseName,email:email,places:places,services:services,description:description,profilePic:dpPic,coverPic:bgPic,location:location}});
            providerData.name =name?lowerCaseName:providerData.name
            providerData.email =email?email:providerData.email  
            providerData.places =places?places:providerData.places 
            providerData.location =location?location:providerData.location  
            providerData.services =services?services:providerData.services
            providerData.description =description?description:providerData.description  
            providerData.profilePic =dpPic?dpPic:providerData.profilePic  
            providerData.coverPic =bgPic?bgPic:providerData.coverPic  

        console.log(providerData),'hjvshavsjhvasjhvajshvajhsvjahvsjhasvjhasvjhavjhasvjha',providerData.services;
        providerData ? res.status(200).json({msg:'Profile updated successfully', providerData,bgPic,dpPic }) : res.status(400).json({ errMsg:'User not found'});
    } catch (error) {
        if(profilePic)if (fs.existsSync(profilePic.path))fs.unlinkSync(profilePic.path);
        if(coverPic) if (fs.existsSync(coverPic.path))fs.unlinkSync(coverPic.path);
        ;

        res.status(504).json({ errMsg: "Gateway time-out" });
    }
}


const blockProvider =async (req,res)=>{
    try {
        const { providerId } = req.params;
        const provider = await Provider.findById(providerId);
        if (!provider) return res.status(400).json({ errMsg: 'Provider Not Found' })

        provider.isBanned = true;
        await provider.save();

        res.status(200).json({ msg: 'Unblocked Successfully' })
    } catch (error) {
        res.status(504).json({ errMsg: "Server error!!!" });
    }
}


const unBlockProvider =async (req,res)=>{
    try {
        const { providerId } = req.params;
        const provider = await Provider.findById(providerId);
        if (!provider) return res.status(400).json({ errMsg: 'Provider Not Found' })

        provider.isBanned = false;
        await provider.save();

        res.status(200).json({ msg: 'Unblocked Successfully' })
    } catch (error) {
        res.status(504).json({ errMsg: "Gateway time-out" });
    }
}

const addFeedback = async (req, res) => {

    try {
        const { rating, feedback } = req.body;
        const { providerId } = req.query
        const { id } = req.payload;

        console.log(rating, providerId, feedback, 'suyudfgsyjdfjhsfd')
        if (rating && providerId && feedback) {
            const date = new Date()
            const review = {userId: id,date: date,description:feedback,rating:rating}
            const addingFeedback = await Provider.updateOne({ _id: providerId }, {
                $push: { feedback: review}});

            addingFeedback ? res.status(200).json({ msg: 'Thank you for your feedback',feedback:review })
                : res.status(500).json({ errMsg: "Server error" })

        } else { res.status(402).json({ errMsg: "Somthing wrong", status: false }); }

    } catch (error) {
        console.log(error);
        res.status(500).json({ errMsg: "Server error", status: false });
    }

} 


module.exports = {
    signup,
    login,
    otpLogin,
    confirmProvider,
    providerList,
    UserProviderList,
    profileDetails,
    editProvider,
    blockProvider,
    unBlockProvider,
    addFeedback,

}