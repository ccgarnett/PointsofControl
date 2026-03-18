import { Response } from 'express';
import Message from './Message';
import { AuthRequest } from './authMiddleware';

const VALID_REACTION_TYPES = ['👍', '❤️', '👏'];

// GET /api/messages — all messages, newest first
export const getMessages = async (req: AuthRequest, res: Response) => {
  try {
    const messages = await Message.find().sort({ createdAt: -1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// POST /api/messages — create a new message
export const createMessage = async (req: AuthRequest, res: Response) => {
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
export const updateMessage = async (req: AuthRequest, res: Response) => {
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
export const deleteMessage = async (req: AuthRequest, res: Response) => {
  try {
    const message = await Message.findByIdAndDelete(req.params.id);
    if (!message) return res.status(404).json({ message: 'Message not found' });
    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// POST /api/messages/:id/react — toggle a reaction (U13)
export const reactToMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { type } = req.body;
    if (!VALID_REACTION_TYPES.includes(type)) {
      return res.status(400).json({ message: 'Invalid reaction type' });
    }
    const userId = req.user!.id;
    const msg = await Message.findById(req.params.id);
    if (!msg) return res.status(404).json({ message: 'Message not found' });

    const existingIdx = msg.reactions.findIndex(
      (r) => r.userId === userId && r.type === type
    );
    if (existingIdx !== -1) {
      msg.reactions.splice(existingIdx, 1);
    } else {
      msg.reactions.push({ userId, type });
    }
    await msg.save();
    res.json(msg);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// POST /api/messages/:id/acknowledge — mark as read (U13)
export const acknowledgeMessage = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const msg = await Message.findById(req.params.id);
    if (!msg) return res.status(404).json({ message: 'Message not found' });

    if (!msg.acknowledgedBy.includes(userId)) {
      msg.acknowledgedBy.push(userId);
      await msg.save();
    }
    res.json(msg);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};
