const mongoose = require('mongoose');

const optionSchema = new mongoose.Schema({
    title:{
        type:String,
        required:true
    },
    providerId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'provider',
        required: true
    },
    serviceId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'services',
        required: true
    },
    optionImages:{
        type: Array,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    priceOption:{
        type:String,
        required:true
    },
    price:{
        type:Number,
        required:true
    },
    createdAt : {
        type: Date,
        default: Date.now()
    },
    isBanned: { type: Boolean, default: false },
    isFlag: { type: Boolean, default: false }
});


const option = mongoose.model('options', optionSchema);
module.exports = option;

