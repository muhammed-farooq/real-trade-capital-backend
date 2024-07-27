const { default: mongoose } = require("mongoose");
const Provider = require('../models/provider')
const User = require('../models/user');
const Chat = require("../models/chat");

const accessChat = async (req, res) => {
    try {
        const { receiverId,role } = req.query;
        const senderId = req.payload.id;

        if (!receiverId || !senderId || !role) return res.status(400).json({errMsg:'Something wrong'});

        const findQuery = {
            providerId: role == 'user' ? receiverId : senderId,
            userId: role == 'user' ? senderId : receiverId,
        };

        let isChat = await Chat.findOne(findQuery)
            .then((async (result) => {
                role == 'user' ? 
                result = await Provider.populate(result, { path: 'providerId', select: 'name phone email location profilePic' })
                    : result = await User.populate(result, { path: 'userId', select: 'name place email phone image place' })
            }))
        if (isChat) {
            console.log(isChat,'hoi');
            res.status(200).json({ chat: isChat })
        } else {
            const chatData = {
                providerId: role == 'user' ? receiverId : senderId,
                userId: role == 'user' ? senderId : receiverId,
            }
            let createdChat = (await Chat.create(chatData))
            if (createdChat){
                role == 'user' ?
                    createdChat = await Provider.populate(createdChat, { path: 'providerId', select: 'name phone email location profilePic' })
                    : createdChat = await User.populate(createdChat, { createdChat: 'userId', select: 'name place email phone image place' })
            } 

                res.status(200).json({ caht:createdChat })
        }
    } catch (error) {
        console.log(error);
        return res.status(500)
    }
}

const fetchChats = async (req, res) => {
    try {
        const { role } = req.query; 
        const senderId = req.payload.id;
        let findQuery ={}
        role == 'user' ? findQuery = { userId: senderId } : role == 'provider' ? 
        findQuery = { providerId: senderId } :res.status(400).json({errMsg:'Somthing went wrong'});
        let chatList = await Chat.find(findQuery)
            .sort({ updatedAt: -1 })
        if (chatList.length > 0) {
            if (role === 'user') chatList = await Provider.populate(chatList, {
                    path: 'providerId',
                    select: 'name phone email location profilePic',
                })
            else  chatList = await User.populate(chatList, {
                    path: 'userId',
                    select: 'name place email phone image place',
                });
        } else chatList = [];
        res.status(200).json({ chatList })
    } catch (error) {
        console.log(error);
        return res.status(500)
    }
}

const getReceiverData = async (req, res) => {
    try {
        const { role,skip } = req.query;
        if (role !== 'user' && role !== 'provider') res.status(200).json({ status:false})
        if (skip%10 != 0) res.status(200).json({ noMore: true })

        let findQuery = role == 'user' ? { isBanned: false, adminConfirmed: true } : { isBanned: false }
        let receiverList =
            role == 'user' ? await Provider.find(findQuery).sort({ _id: -1 }).limit(10).skip(skip).select('name email profilePic') : role == 'provider' ?
                await User.find(findQuery).sort({ _id: -1 }).limit(10).select('name email image').skip(skip):''
        console.log(receiverList,'dfugxfug',role);
        res.status(200).json({ receiverList })
    } catch (error) {
        console.log(error);
        return res.status(500)
    }
}


const sendMessage = async (req, res) => {
    try {
        const { content, chatId } = req.body
        const user_id = new mongoose.Types.ObjectId(req.user._id);

        if (!content || !chatId) {
            return res.status(400)
        }

        const newMessage = {
            sender: user_id,
            content: content,
            chat: chatId
        }

        let message = await messageModel.create(newMessage);

        message = await message
            .populate("sender", "name image")
            .populate("chat")
            .populate({
                path: "chat.user",
                select: "name image email",
            })
            .populate({
                path: "chat.tutor",
                select: "name image email",
            })
            .exec();

        await chatModel.findByIdAndUpdate(req.body.chatId, {
            latestMessage: message
        })

        res.json(message)

    } catch (error) {
        console.log(error);
        return res.status(500)
    }
}

const allMessages = async (req, res) => {
    try {



    } catch (error) {
        console.log(error);
        return res.status(500)
    }
}

module.exports = {
    accessChat,
    sendMessage,
    fetchChats,
    getReceiverData,
    allMessages
}
