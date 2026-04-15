import { Request, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import User from './User';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
  port: Number(process.env.EMAIL_PORT) || 587,
  auth: {
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || '',
  },
});

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

      const resetLink = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password/${rawToken}`;

      // Send email — failure is best-effort and does not block the 200 response
      transporter.sendMail({
        from: process.env.EMAIL_FROM || '"Points of Control" <noreply@pointsofcontrol.com>',
        to: email,
        subject: 'Password Reset Request',
        text: `You requested a password reset. Click the link below to reset your password:\n\n${resetLink}\n\nThis link expires in 1 hour. If you did not request this, you can ignore this email.`,
        html: `<p>You requested a password reset.</p><p><a href="${resetLink}">Reset your password</a></p><p>This link expires in 1 hour.</p>`,
      }).catch(() => {});
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
