const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    providerId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'provider',
        required: true
    },
    customerId :{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    eventDate:{
        type: Date,
        required:true
    },
    mobile:{
        type:Number,
        required:true
    },
    address:{
        zip:{
            type:Number,
            required:true
        },
        city:{
            type:String,
            required:true
        },
        landmark:{
            type:String,
            required:true
        },
        district:{
            type:String,
            required:true
        }
    },
    options:[{
        optionId:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'options',
            required: true
        },
        count:{
            type:Number,
            required:true
        },
        totalAmount:{
            type:Number,
            required:true
        }
    }],
    grandTotal:{
        type:Number,
        required:true
    },
    paymentType:{
        type:String,
        required:true
    },
    orderCreatedAt: {
        type: Date,
        default: Date.now()
    },
    orderCancelledAt: {
        type: Date,
        default: Date.now()
    },  
    status: {
        type: String,
        enum: ['Confirmed', 'Completed', 'Cancelled'],
        default: 'Confirmed'
    },
});


const order = mongoose.model('order', orderSchema);
module.exports = order;

