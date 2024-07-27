const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    postId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'posts', // Specify multiple collections
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now()
    },
    likes:{
        type:Array,
    },
   
});


const comment = mongoose.model('comments', commentSchema);
module.exports = comment;

