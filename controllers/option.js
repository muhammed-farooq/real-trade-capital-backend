const Option = require('../models/options')
const cloudinary = require('../config/cloudinary')
const fs = require("fs");
const mime = require("mime-types");


let msg,errMsg;


const getOptionList =async (req,res) => {
    try {
        const { id,serviceId,checkout } = req.query;
        let optionList
        if(!serviceId&&!checkout) optionList = await Option.find({isBanned:false,providerId:id}).populate('serviceId').sort({ _id:-1 });
        else if(checkout) optionList = await Option.find({isBanned:false,isFlag:false,providerId:id}).sort({ _id:-1 });
        else optionList = await Option.find({isBanned:false,providerId:id,isFlag:false,serviceId:serviceId}).sort({ _id:-1 });
        console.log(optionList,id);
        res.status(200).json({ optionList });

    } catch (error) {
        res.status(504).json({ errMsg: "Gateway time-out" });
    }
}

const addOption = async (req, res) => {
    const { files, body: { title, description,price,service,priceOption } } = req;
    const { id } = req.payload;
    let createdAt =new Date
    console.log(files, title, description,price,service,priceOption,createdAt);
    if(!files||!title||!description||!price||!service||!priceOption )return res.status(400).json({errMsg : 'Form not filled'})
    else{
        try {
            const imageFiles = files.filter(isImage);
            let optionImages = [];
            if(!files.length == imageFiles) return res.status(401).json({errMsg : 'Only Images alowed'})
            if(!title) return res.status(400).json({errMsg : 'Title needed'})
            if(!description) return res.status(400).json({errMsg : 'caption needed'})  
            if (files) {
                if(files.length == 1){
                    const upload = await cloudinary.uploader.upload(files[0].path);
                    optionImages.push(upload.secure_url);
                }else{
                    for await (const file of files) {
                        const upload = await cloudinary.uploader.upload(file.path);
                        optionImages.push(upload.secure_url);
                        if (fs.existsSync(file.path))fs.unlinkSync(file.path)
                    };
                }
            };
            const newOption = new Option({
                providerId: id,
                title,
                serviceId:service,
                description,
                price,
                priceOption,
                optionImages,createdAt       
            })
            await newOption.save();
            res.status(200)?.json({ newOption ,msg:"Option added successfully"});
        } catch (error) {
            if(files){
                for await (const file of files)if (fs.existsSync(file.path))fs.unlinkSync(file.path);
            }
            console.log(error);
            res.status(500).json({errMsg:'Server Error'});
        }
    }
}

const optionFlag =async (req,res) => {
    let {toggle,optionId} = req.query
    let {id} = req.payload;
    try {
        if(id){
            if(toggle == 'true'){
                await Option.updateOne({_id:optionId}, { $set:{isFlag:true} })
                .then(() =>res.status(200).json({flag: true }))
                .catch((err) => {
                    console.error(err);
                    res.status(500).json({flag: false, errMsg: 'Something went wrong' });
                });
            }else if(toggle == 'false'){
                await Option.updateOne({_id:optionId},{ $set:{isFlag:false} })
                .then(()=>res.status(200).json({unFlag:true}))
                .catch((err)=>{
                    res.status(501).json({ error: 'Option not found' ,unFlag:false});
                    console.log(err);
                })
            }
        }       
    } catch (error) {
        res.status(500).json({flag: false, errMsg: 'Something went wrong' });
        console.log(error);
    }
} 

const isImage = (file) => {
    const acceptedImageTypes = ["image/jpeg", "image/jpg", "image/avif", "image/png", "image/gif" ,"image/webp"]; // Add more types if necessary
    console.log(acceptedImageTypes.includes(file.mimetype));
    return acceptedImageTypes.includes(file.mimetype);
};


module.exports={
    getOptionList,
    addOption,
    optionFlag
}