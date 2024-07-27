const mongoose = require('mongoose')

const adminSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        phone: {
            type: Number,
            required: true,
        },
        password: {
            type: String,
            trim: true,
            required: true,
            minlength: [6],
        },
        wallet: {
            type: Number,
            default: 0,
        },
        walletHistory: [{
            date: {
                type: Date,
                default: Date.now(),
            },
            amount: {
                type: Number,
                default: 0,
            },
            from: {
                type: mongoose.Schema.Types.ObjectId,   
                ref: 'provider'
            },
            transactionType: {
                type: String,
                enum: ['Credit', 'Debit'],
            }
        }],
        notifications:[{
            from : {
                type:String,
                required:true,
            },
            content:{
                type:String,
                required:true
            },
            sendedAt:{
                type:Date,
                default:Date.now()
            }
        }]
    },
    {
        timestamps: true,
    }
);

const adminModal = mongoose.model("admins", adminSchema);
module.exports = adminModal;