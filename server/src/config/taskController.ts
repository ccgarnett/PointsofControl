import {Request, Response} from 'express';
import {Types} from 'mongoose';
import Task from './Task';
import type {ITask} from './Task';


const isValidObjectId = (user_id: string) => Types.ObjectId.isValid(user_id);
const localDateConversion = () => {
    const localDate = new Date();
    const year = localDate.getFullYear();
    const month = String(localDate.getMonth()+1).padStart(2,'0');
    const day = String(localDate.getDay()).padStart(2,'0');
    return `${year}-${month}-${day}`;
};

//first attempt at auto-archiving functionality that automatically archives tasks after a day
export const makeArchived = async (req: Request, res: Response) => {
    try{
        const user_id = String(req.query.user_id || '');
        if(!user_id || !isValidObjectId(user_id)){
            return res.status(400).json({message:'Invalid user id.'});
        }

        const autoArchive = await Task.updateMany(
        {user_id: user_id, dateKey: {$ne: localDateConversion()}, archivedAt: null},
        {archivedAt: new Date()});
        res.status(200).json({message:'old tasks archived.',
             archivedCount: autoArchive.modifiedCount});
    }catch(error){res.status(500).json({message:'Server Error'});}
};

export const createTask = async (req: Request, res: Response) => {
    try{
        const user_id = String(req.query.user_id || '');
        const description = String(req.body?.description || '').trim();
        const dateKey = String(req.body?.dateKey || req.query.date || localDateConversion());
        if(!user_id || !isValidObjectId(user_id)){
            return res.status(400).json({message:'Invalid user id.'});
        }
        if(!description){
            return res.status(400).json({message:'description required.'});
        }
        const task = await Task.create({
            user_id, 
            dateKey, 
            description, 
            completed: false, 
            archivedAt: null
        });
        res.status(201).json(task);
    }catch(error){res.status(500).json({message:'Server Error'})};
};

export const readTask = async (req: Request, res: Response) => {
    try{
        const user_id = String(req.query.user_id || '');
        const dateKey = String(req.query.date || localDateConversion());
        if(!user_id || !isValidObjectId(user_id)){
            return res.status(400).json({message:'Invalid user id.'});
        }
        const tasks = await Task.find({
            user_id,
            dateKey,
            archivedAt: null,
        }).sort({createdAt: 1});
        res.json(tasks);
    }catch(error){res.status(500).json({message:'Server Error'})}
};

export const updateTask = async (req: Request, res: Response) => {
    try{
        const user_id = String(req.query.user_id || '');
        const task_id = String(req.params.task_id || '');
        if(!user_id || !isValidObjectId(user_id)){
            return res.status(400).json({message:'Invalid user id.'});
        }
        if(!task_id || !isValidObjectId(task_id)){
            return res.status(400).json({message:'Task does not exist.'});
        }

        const update: Partial<ITask> = {};
        if(typeof req.body?.description === 'string'){
            update.description = req.body.description.trim();
        }
        if(typeof req.body?.completed === 'boolean'){
            update.completed = req.body.completed;
        }
        if(typeof req.body?.archived === 'boolean'){
            update.archivedAt = req.body.archived ? new Date():null;
        }

        if(Object.keys(update).length === 0){
            return res.status(400).json({message:'no fields to update.'});
        }
        if(update.description !== undefined && !update.description){
            return res.status(400).json({message:'description field cannot be empty.'});
        }

        const task = await Task.findOneAndUpdate(
            {_id: task_id, user_id},
            update,
            {new: true}
        );
        if(!task) return res.status(404).json({message:'task not found.'});
        res.json(task);
    }catch(error){res.status(500).json({message:'Server Error'})};
};

export const deleteTask = async (req: Request, res: Response) => {
    try{
        const user_id = String(req.query.user_id || '');
        const task_id = String(req.params.id || '');
        if(!user_id || !isValidObjectId(user_id)){
            return res.status(400).json({message:'Invalid user id.'});
        }
        if(!task_id || !isValidObjectId(task_id)){
            return res.status(400).json({message:'Task does not exist.'});
        }
    }catch(error){res.status(500).json({message:'Server Error'})};
};

export const readArchive = async (req: Request, res: Response) => {
    try{
        const user_id = String(req.query.user_id || '');
        const dateKey = String(req.query.date || localDateConversion());
        if(!user_id || !isValidObjectId(user_id)){
            return res.status(400).json({message:'Invalid user id.'});
        }
        const tasks = await Task.find({
            user_id,
            archivedAt: {$ne: null},
        }).sort({archivedAt: -1, updatedAt: -1});
        res.json(tasks);
    }catch(error){res.status(500).json({message:'Server Error'})}
};