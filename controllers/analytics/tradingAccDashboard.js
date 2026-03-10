const TradingAccount = require("../../models/dashboard/tradingAcc")

const fetchTradingAcc = async(req,res)=> {
    try {
        const { id } = req.params;

        const data = await TradingAccount.findOne({account : id});
        
        console.log(data , "data");

        return res.status(200).json({success: true,data})
    } catch (error) {
        return res.status(500).json({success : false , message : error.message })
    }
}

module.exports = {
    fetchTradingAcc,
}