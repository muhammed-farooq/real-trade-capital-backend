const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    providerId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'provider',
        required: true
    },

    postImages:{
        type: Array,
        required:true
    },
    caption:{
        type:String,
        required:true
    },
    tagline:{
        type:String
    },
    comments:{
        type:Array,
    },
    likes:{
        type:Array,
    },
    createdAt : {
        type: Date,
        default: Date.now()
    },
    isBanned: { type: Boolean, default: false },
    reports : [{
        type: mongoose.Schema.Types.ObjectId,
        ref:'users',
    }]
});


const post = mongoose.model('posts', postSchema);
module.exports = post;

