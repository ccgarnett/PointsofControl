import { Response } from 'express';
import { Types } from 'mongoose';
import { AuthRequest } from './authMiddleware';
import DirectMessage from './DirectMessage';
import User from './User';

// ── GET /api/chat/messages ─────────────────────────────────────────────────
// User: returns own conversation with Jordan. Admin: returns own (empty intent).
export const getUserMessages = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const messages = await DirectMessage.find({ userId }).sort({ createdAt: 1 });
    res.json(messages);
  } catch {
    res.status(500).json({ message: 'Server Error' });
  }
};

// ── POST /api/chat/messages ────────────────────────────────────────────────
// User sends a message to Jordan.
export const sendUserMessage = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const username = req.user!.username ?? 'User';
    const content = String(req.body?.content || '').trim();
    if (!content) return res.status(400).json({ message: 'content required' });
    const msg = await DirectMessage.create({ userId, fromAdmin: false, senderUsername: username, content });
    res.status(201).json(msg);
  } catch {
    res.status(500).json({ message: 'Server Error' });
  }
};

// ── GET /api/admin/chat ────────────────────────────────────────────────────
// Admin: list of users who have sent at least one message, with latest message.
export const listConversations = async (_req: AuthRequest, res: Response) => {
  try {
    const conversations = await DirectMessage.aggregate([
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$userId',
          latestMessage: { $first: '$content' },
          latestAt: { $first: '$createdAt' },
          latestFromAdmin: { $first: '$fromAdmin' },
        },
      },
      { $sort: { latestAt: -1 } },
    ]);

    // Attach usernames
    const userIds = conversations.map((c) => c._id);
    const users = await User.find({ _id: { $in: userIds } }).select('username');
    const usernameMap: Record<string, string> = {};
    users.forEach((u) => { usernameMap[String(u._id)] = u.username; });

    const result = conversations.map((c) => ({
      userId: c._id,
      username: usernameMap[String(c._id)] ?? 'Unknown',
      latestMessage: c.latestMessage,
      latestAt: c.latestAt,
      latestFromAdmin: c.latestFromAdmin,
    }));

    res.json(result);
  } catch {
    res.status(500).json({ message: 'Server Error' });
  }
};

// ── GET /api/admin/chat/:userId ────────────────────────────────────────────
// Admin: get all messages in a specific user's conversation.
export const getConversation = async (req: AuthRequest, res: Response) => {
  try {
    const userId = String(req.params.userId);
    if (!Types.ObjectId.isValid(userId)) return res.status(400).json({ message: 'Invalid user ID' });
    const messages = await DirectMessage.find({ userId }).sort({ createdAt: 1 });
    res.json(messages);
  } catch {
    res.status(500).json({ message: 'Server Error' });
  }
};

// ── POST /api/admin/chat/:userId ───────────────────────────────────────────
// Admin: reply to a specific user's conversation.
export const adminReply = async (req: AuthRequest, res: Response) => {
  try {
    const userId = String(req.params.userId);
    if (!Types.ObjectId.isValid(userId)) return res.status(400).json({ message: 'Invalid user ID' });
    const content = String(req.body?.content || '').trim();
    if (!content) return res.status(400).json({ message: 'content required' });
    const senderUsername = req.user!.username ?? 'Jordan';
    const msg = await DirectMessage.create({
      userId,
      fromAdmin: true,
      senderUsername,
      content,
    });
    res.status(201).json(msg);
  } catch {
    res.status(500).json({ message: 'Server Error' });
  }
};
