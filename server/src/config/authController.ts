import { Request, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import User from './User';

// ── POST /api/auth/forgot-password ────────────────────────────────────────────
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email });

    if (user) {
      const rawToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

      await User.findByIdAndUpdate(user._id, {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      });

      const resetLink = `http://localhost:3000/reset-password/${rawToken}`;
      console.log(`[Password Reset] Reset link for ${email}: ${resetLink}`);
    }

    // Always return 200 — don't reveal whether the email exists
    res.status(200).json({ message: 'If that email exists, we sent a reset link' });
  } catch {
    res.status(500).json({ message: 'Server Error' });
  }
};

// ── POST /api/auth/reset-password/:token ──────────────────────────────────────
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const token = String(req.params.token);
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    const passwordHash = await bcrypt.hash(String(password), 10);
    await User.findByIdAndUpdate(user._id, {
      $set: { passwordHash },
      $unset: { resetPasswordToken: 1, resetPasswordExpires: 1 },
    });

    res.status(200).json({ message: 'Password reset successful' });
  } catch {
    res.status(500).json({ message: 'Server Error' });
  }
};
