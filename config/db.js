const mongoose= require('mongoose')

const mongoDB = "mongodb://127.0.0.1:27017/real-trade-capital"
const dotenv = require("dotenv");
dotenv.config();

// const mongoDB = process.env.DB_URL


const connectDB = async()=>{

    try {
        const conn =await mongoose.connect(mongoDB)
            console.log('mongoDB connected')
    } catch (error) {
        console.log(error);
    }
}


module.exports = connectDB
