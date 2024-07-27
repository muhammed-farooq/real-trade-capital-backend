const Post = require('../models/post')
const Comment = require('../models/comment')
const cloudinary = require('../config/cloudinary')
const fs = require("fs");
const ObjectId = require('mongoose').Types.ObjectId;

let msg,errMsg;


const allPost =async (req,res) => {
    try {
        const { skip } = req.query;
        const noPost = false
        if(skip%5 == 0 ||skip == 0){
            const postsList = await Post.find({isBanned:false}).skip(skip).limit(5).sort({ _id:-1 }).populate('providerId');
            console.log(postsList);
            if(postsList.length == 0) noPost =true
            res.status(200).json({ postsList ,noPost});
        }else res.status(200).json({ noPost:true });

    } catch (error) {
        res.status(504).json({ errMsg: "Gateway time-out" });
    }
}


const postsList =async (req,res)=>{
    try {
        const { id } = req.query;
        const postsList = await Post.find({providerId:id}).populate('providerId');
        res.status(200).json({ postsList });

    } catch (error) {
        res.status(504).json({ errMsg: "Gateway time-out" });
    }
}


const addPost = async (req, res) => {
    const { files, body: { caption, tagline } } = req;
    const { id } = req.payload;
    console.log(files,caption,tagline);

    try {
        let postImages = [];
        if(!files) return res.status(400).json({errMsg : 'Image needed'})
        if(!caption) return res.status(400).json({errMsg : 'caption needed'})  
        if(files){
            for await (const file of files){
                const upload = await cloudinary.uploader.upload(file.path)
                postImages.push(upload.secure_url)
                if (fs.existsSync(file.path))fs.unlinkSync(file.path);
            }
        }
        const newPost = new Post({
            providerId: id,
            caption,
            tagline,
            postImages,       
        })
        console.log(newPost);
        await newPost.save();
        res.status(200)?.json({ newPost ,msg:"post upload successfully"});
    } catch (error) {
        if(files){
            for await (const file of files)if (fs.existsSync(file.path))fs.unlinkSync(file.path);
        }
        console.log(error);
        res.status(500).json({errMsg:'Server Error'});
   }
}


const postDetails = async (req, res) => {

    const { postId } = req.query;
    console.log(postId);

    try {
        let postImages = [];
        if(!files) return res.status(400).json({errMsg : 'Image needed'})
        if(!caption) return res.status(400).json({errMsg : 'caption needed'})  
        if(files){
            for await (const file of files){
                const upload = await cloudinary.uploader.upload(file.path)
                postImages.push(upload.secure_url)
                if (fs.existsSync(file.path))fs.unlinkSync(file.path);
            }
        }
        const newPost = new Post({
            providerId: id,
            caption,
            tagline,
            postImages,       
        })
        console.log(newPost);
        await newPost.save();
        res.status(200)?.json({ newPost ,msg:"post upload successfully"});
    } catch (error) {
        if(files){
            for await (const file of files)if (fs.existsSync(file.path))fs.unlinkSync(file.path);
        }
        console.log(error);
        res.status(500).json({errMsg:'Server Error'});
   }
}

const deletePost =async (req,res)=>{
    try {
        const { postId } = req.query;
        const removePost = await Post.deleteOne({_id:postId}) 
        removePost ? res.status(200).json({delete:true ,msg:'Post deleted sucssesfully'}):res.status(401).json({delete:false ,errMsg:"Post did'nt delete, something wrong"})
    } catch (error) {
        console.log(error);
        res.status(500).json({errMsg:'Server Error'});
    }
}

const postLike =async (req,res) => {
    let {toggle,postId} = req.query
    let {id} = req.payload;
    try {
        if(id){
            if(toggle == 'true'){
                await Post.updateOne({_id:postId}, { $addToSet: { likes:id } })
                .then((response) => {
                console.log(id,toggle,postId,'liked',response);
                    res.status(200).json({ like: true })})
                .catch((err) => {
                    console.error(err);
                    res.status(500).json({ like: false, errMsg: 'Something went wrong' });
                });
            }else{
                await Post.updateOne({_id:postId},{ $pull: { likes: id } })
                .then((response)=>{
                    console.log(id,toggle,postId,'UNLIKE',response);
                     res.status(200).json({unlike:true})})
                .catch((err)=>{
                    res.status(501).json({ error: 'Post not found' ,unlike:false});
                    console.log(err);
                })
            }

        }       
    } catch (error) {
        res.status(500).json({ like: false, errMsg: 'Something went wrong' });
        console.log(error);
    }
} 

const postReport =async (req,res) => {
    let {postId} = req.query
    let {id} = req.payload;
    try {
        if(id){
            await Post.updateOne({_id:postId}, { $addToSet: { reports:id } })
            .then((response) => {
            console.log(id,postId,'reported',response);
                res.status(200).json({ report: true })})
            .catch((err) => {
                console.error(err);
                res.status(500).json({ report: false, errMsg: 'Something went wrong' });
            });
        }       
    } catch (error) {
        res.status(500).json({ report: false, errMsg: 'Something went wrong' });
        console.log(error);
    }
} 

const commentList =async (req,res)=>{
    let {postId} = req.query
    try {
        await Comment.aggregate([
            {
                $match: { postId: new ObjectId(postId) }
            },
            {
                $lookup: {
                    from: 'users', // Name of the 'users' collection
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            {
                $lookup: {
                    from: 'providers', // Name of the 'providers' collection
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'provider'
                }
            }
        ])
        .then((comments) => {
            console.log(comments);
            res.status(200).json({ comments,status: true })})
        .catch((err) => {
            console.error(err);
            res.status(500).json({ status: false, errMsg: 'Something went wrong' });
        });
        console.log('Liked');
    } catch (error) {
        res.status(500).json({ status: false, errMsg: 'Something went wrong' });
        console.log(error);
    }    
}

const addComment =async (req,res) =>{
    let {postId} = req.query
    let {id} = req.payload;
    let {comment} = req.body;
    try {
        console.log('Liked',comment,id,postId);
        const newComment = new Comment({
            userId: id, 
            postId: postId,
            content:comment
        })
        await newComment.save()
        .then(() => res.status(200).json({ newComment,status: true }))
        .catch((err) => {
            console.error(err);
            res.status(500).json({ status: false, errMsg: 'Something went wrong' });
        });
    } catch (error) {
        res.status(500).json({ status: false, errMsg: 'Something went wrong' });
        console.log(error);
    }   
}


const likeComment =async (req,res) =>{
    let {commentId} = req.query
    let {like} = req.body
    let {id} = req.payload;
    try {
        if(id){
            if(like){
                await Comment.updateOne({_id:commentId}, { $addToSet: { likes:id } })
                .then(() => res.status(200).json({ like: true }))
                .catch((err) => {
                    console.error(err);
                    res.status(500).json({ like: false, errMsg: 'Something went wrong' });
                });
                console.log('Liked');
            }else{
                await Comment.updateOne({_id:commentId},{ $pull: { likes: id } })
                .then(()=> res.status(200).json({unlike:true}))
                .catch((err)=>{
                    res.status(501).json({ error: 'Post not found' ,unlike:false});
                    console.log(err);
                })
                console.log('unLiked')
            }

        }       
    } catch (error) {
        res.status(500).json({ like: false, errMsg: 'Something went wrong' });
        console.log(error);
    }
}

const updatePost = async(req,res) => {
    let {postId} = req.query
    let {tagline,caption} = req.body
    try {
        if(postId){
            console.log(postId);
            await Post.findByIdAndUpdate({_id:postId}, { $set: { caption:caption,tagline:tagline} })
            .then((respons) => res.status(200).json({ postData:respons,msg: 'Post updated successfully' }))
            .catch((err) => {
                console.error(err);
                res.status(500).json({  errMsg: 'Something went wrong' });
            })
        }       
    } catch (error) {
        res.status(500).json({ errMsg: 'Something went wrong' });
        console.log(error);
    }
}

const deleteComment = async (req,res) =>{
    try {
        const { commentId } = req.query;
        const removeComment = await Comment.deleteOne({_id:commentId}) 
        removeComment ? res.status(200).json({delete:true }):res.status(401).json({delete :false,errMsg:"Comment did'nt delete, something wrong"})
    } catch (error) {
        console.log(error);
        res.status(500).json({errMsg:'Server Error'});
    }
}

const postBann =async (req,res) => {
    let {postId} = req.query
    let {bann} = req.body;
    try {

        if(bann){
            await Post.updateOne({_id:postId}, { $set: { isBanned:false } })
            .then(() => res.status(200).json({ isBanned:false,bann:true }))
            .catch((err) => {
                console.error(err);
                res.status(500).json({bann:false, errMsg: 'Something went wrong' });
            });
        }else{
            await Post.updateOne({_id:postId}, { $set: { isBanned:true } })
            .then(()=> res.status(200).json({ isBanned:true,bann:true }))
            .catch((err)=>{
                res.status(501).json({ error: 'Post not found' ,bann:false});
                console.log(err);
            })
            console.log('unLiked')
        }

    } catch (error) {
        res.status(500).json({ bann: false, errMsg: 'Something went wrong' });
        console.log(error);
    }
} 

module.exports={
    allPost,
    postsList,
    addPost,
    postLike,
    updatePost,
    postBann,
    deletePost,
    postReport,
    commentList,
    addComment,
    likeComment,
    deleteComment
}