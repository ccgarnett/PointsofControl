import {Response} from 'express';
import directMessage from './directMessage';
import { AuthRequest } from './authMiddleware';
import User from './User';
import Message from './Message';

export const getUsers = async (req: AuthRequest, res: Response)=>{
    try{
        const loggedInUserId = req.user?.id;
        const filteredUsers = await User.find({_id: {$ne:loggedInUserId}}).select("-passwordHash");

        res.status(200).json(filteredUsers);
    }catch(error){return res.status(500).json({message:'Server Error'});}
};

export const getMessages = async (req:AuthRequest, res: Response)=>{
    try{
        const {id:userToChatId} = req.params;
        const myId = req.user?.id;
        const messages = await directMessage.find({
            $or: [
                {senderId:myId, receiverId:userToChatId},
                {senderId:userToChatId, receiverId:myId}
            ]
        })
        res.status(200).json({message:'message log found'});
    }catch(error){return res.status(500).json({message:'Server Error'});}
};

export const sendMessage = async (req:AuthRequest, res:Response)=>{
    try{
        const {content} = req.body;
        const {id: receiverId} = req.params;
        const senderId = req.user?.id;

    }catch(error){return res.status(500).json({message:'Server Error'});}
};
