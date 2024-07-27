// const express = require('express');
// const { serviceList} = require('../controllers/service');
// const { signup,login, profileDetails, editProvider } = require('../controllers/provider');
// const { verifyTokenProvider } = require('../middlewares/auth');

// const multer = require('../config/multer');
// const { postsList, addPost, deletePost, postLike, commentList, addComment, likeComment, deleteComment, updatePost, postReport } = require('../controllers/posts');
// const { addOption, getOptionList, optionFlag } = require('../controllers/option');
// const { getOrderLists, getOrderData } = require('../controllers/order');
// const upload = multer.createMulter();
// const providerRoute= express.Router();

// providerRoute.post('/register',signup);
// providerRoute.post('/login',login);

// providerRoute.get('/serviceList',serviceList);
// providerRoute.get('/profile',verifyTokenProvider,profileDetails);
// providerRoute.patch('/editProfile',verifyTokenProvider,upload.fields([{ name: 'profilePic' }, { name: 'coverPic' }]),editProvider)

// providerRoute.route('/post')
//     .get(verifyTokenProvider,postsList)
//     .post(verifyTokenProvider,upload.array("postImages", 10),addPost)
//     .patch(verifyTokenProvider,updatePost)
//     .delete(verifyTokenProvider,deletePost)

// providerRoute.route('/comment')
//     .get(verifyTokenProvider,commentList)
//     .post(verifyTokenProvider,addComment)
//     .patch(verifyTokenProvider,likeComment)
//     .delete(verifyTokenProvider,deleteComment)

// providerRoute.route('/option')
// providerRoute.route('/option')
//     .get(verifyTokenProvider,getOptionList)
//     .post(verifyTokenProvider,upload.array("optionImages", 10),addOption)

// providerRoute.patch('/option/flag',verifyTokenProvider,optionFlag)
// providerRoute.patch('/post/like',verifyTokenProvider,postLike)
// providerRoute.get('/orders',verifyTokenProvider,getOrderLists)
// providerRoute.get('/order/:id',verifyTokenProvider,getOrderData)

// // providerRoute.get('/orders',verifyTokenProvider,getOrderLists)



    






// module.exports = providerRoute;