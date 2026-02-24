import { Request, Response } from 'express';
import Message from './Message';

// GET /api/messages — all messages, newest first
export const getMessages = async (req: Request, res: Response) => {
  try {
    const messages = await Message.find().sort({ createdAt: -1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// POST /api/messages — create a new message
export const createMessage = async (req: Request, res: Response) => {
  try {
    const { content, postedBy } = req.body;
    if (!content || !postedBy) {
      return res.status(400).json({ message: 'content and postedBy are required' });
    }
    const message = await Message.create({ content, postedBy, reactions: [] });
    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// PUT /api/messages/:id — edit message content
export const updateMessage = async (req: Request, res: Response) => {
  try {
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ message: 'content is required' });
    }
    const message = await Message.findByIdAndUpdate(
      req.params.id,
      { content },
      { new: true }
    );
    if (!message) return res.status(404).json({ message: 'Message not found' });
    res.json(message);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// DELETE /api/messages/:id — delete a message
export const deleteMessage = async (req: Request, res: Response) => {
  try {
    const message = await Message.findByIdAndDelete(req.params.id);
    if (!message) return res.status(404).json({ message: 'Message not found' });
    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};
