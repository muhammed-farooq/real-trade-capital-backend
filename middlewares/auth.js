const jwt = require('jsonwebtoken');
const User = require('../models/user')
const Provider = require('../models/provider')
let errMsg;

const generateToken = (id,role) => {
    const token = jwt.sign({ id, role }, process.env.TOKEN_SECRET);
    return token
}

const verifyTokenAdmin = async (req, res, next) => {
    try { 
        let token = req.headers['authorization'];
        if (!token) {
            return res.status(403).json({ errMsg: "Access Denied" });
        }          
        if (token.startsWith('Bearer ')) {
            token = token.slice(7, token.length).trimLeft();
        }
        const verified = jwt.verify(token, process.env.TOKEN_SECRET);
      
        req.payload = verified;
        if (req.payload.role === 'admin') {
            next()
        } else {
            return res.status(403).json({ errMsg: "Access Denied" });
        }
    } catch (err) {
        console.log("p");
        res.status(500).json({ errMsg: "Server Down" });
    }
}

const verifyTokenUser = async (req, res, next) => {
    try {        
        let token = req.headers['authorization'];
        console.log(token);

        if (!token) {
            return res.status(403).json({ errMsg: "Access Denied" });
        }          
        if (token.startsWith('Bearer ')) {
            token = token.slice(7, token.length).trimLeft();
        }
        const verified = jwt.verify(token, process.env.TOKEN_SECRET);
      
        req.payload = verified;
        const user = await User.findById(req.payload.id);
        if (user.isBanned === true) {
            return res.status(403).json({ errMsg: "Access Denied" }); 
        }else if (req.payload.role === 'user') {
            next() 
        } else {
            return res.status(403).json({ errMsg: "Access Denied" });
        }
    } catch (err) {
        console.log("p");
        res.status(500).json({ errMsg: "Server Down" });
    }
}

const verifyTokenProvider = async (req, res, next) => {
    try {        
        let token = req.headers['authorization'];
        console.log(token,'xjjnxj','smbkjbf');
        if (!token) {
            return res.status(403).json({ errMsg: "Access Denied" });
        }          
        if (token.startsWith('Bearer ')) {
            token = token.slice(7, token.length).trimLeft();
        }
        const verified = jwt.verify(token, process.env.TOKEN_SECRET);
      
        req.payload = verified;
        const provider = await Provider.findById(req.payload.id);
        console.log(provider.isBanned);
        if (provider.isBanned || !provider.adminConfirmed) {
            return res.status(403).json({ errMsg: "Access Denied" }); 
        }else if (req.payload.role === 'provider') {
            next() 
        } else {
            return res.status(403).json({ errMsg: "Access Denied"}); 
        }
    } catch (err) {
        console.log("p");
        res.status(500).json({ errMsg: "Access Denied" });
    }
}
module.exports = {
    generateToken,
    verifyTokenAdmin,
    verifyTokenUser,
    verifyTokenProvider
}