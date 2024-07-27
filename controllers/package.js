const Package = require('../models/package')
const cloudinary = require('../config/cloudinary')
const mime = require("mime-types");
const fs = require("fs");


let msg,errMsg;


const packages =async (req,res)=>{
    try {
        console.log('sksjdx');
        const packages = await Package.find({});
        console.log(packages);
        res.status(200).json({ packages });

    } catch (error) {
        res.status(504).json({ errMsg: "Gateway time-out" });
    }
}

const addService = async (req, res) => {
    
    const { file, body: { name } } = req;
    try {
        let serviceName = name.toUpperCase()
        let image;
        console.log(serviceName,file);
        if(!file) return res.status(400).json({errMsg : 'Image needed'})
        if(!name) return res.status(400).json({errMsg : 'Name needed'})  

        const exsistingService = await Package.find({serviceName})
        if(exsistingService.length) return res.status(400).json({errMsg : 'service already exist'})
        
        const mimeType = mime.lookup(file.originalname);
        if(mimeType && mimeType.includes("image/")) {
            console.log(process.env.CLOUDINARY_API_KEY);
            const upload = await cloudinary.uploader.upload(file?.path)
            image = upload.secure_url;
            fs.unlinkSync(file.path)
        }else{
            fs.unlinkSync(file.path)
            if(exsistingService) return res.status(400).json({errMsg : 'This file not a image',status:false})
        }
        const newService =await new Package({
            serviceName,
            serviceImage:image       
        }).save()

        res.status(200)?.json({ newService});

   } catch (error) {
        console.log(error);
        res.status(500).json({errMsg:'Server Error'});
       fs.unlinkSync(file?.path);
   }
}

const editPackage = async (req, res) => {
    
    const { file, body: { serviceName,_id } } = req;
    try {
        const name = serviceName.toUpperCase();

        const existingService = await Package.findOne({ serviceName: name, _id: { $ne: _id } });
        if (existingService) return res.status(400).json({ errMsg: 'Service name already exists' });
        
        const service = await Package.findById(_id);
        if(file&&file.filename){
            const mimeType = mime.lookup(file.originalname);
            if (mimeType && mimeType.includes("image/")) {
                const result = await cloudinary.uploader.upload(file.path);
                image = result.secure_url;
                fs.unlinkSync(file?.path);
            } else {
                fs.unlinkSync(file?.path);
                return res.status(400).json({ status: false, errMsg: "File is not a image" });
            };
            service.serviceName = name;
            service.serviceImage = image;
            await service.save();
            return res.status(200).json({ service });
        }
        
        service.serviceName = name
        await service.save();
        return res.status(200).json({ service ,msg:'Updated successfuly' });

    } catch (error) {
        fs.unlinkSync(file?.path);
        res.status(500).json({ errMsg: 'Server Error' });
    }
}

module.exports = {
    packages,
    addService,
    editPackage
}