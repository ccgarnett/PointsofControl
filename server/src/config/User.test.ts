import mongoose from 'mongoose';
import User from './User'; // Simplified path

describe('User Model Test', () => {
  it('should successfully validate a correct user', async () => {
    const user = new User({
      username: 'testuser',
      email: 'ccgarnett@loyola.edu',
      passwordHash: 'hashedpassword123', // Matches the requirement in your Schema
      role: 'User'
    });
    const err = await user.validate();
    expect(err).toBeUndefined();
  });

  it('should fail if required fields are missing', async () => {
    const user = new User({ username: 'testuser' }); 
    let err: any;
    try {
      await user.validate();
    } catch (error) {
      err = error;
    }
    expect(err).toBeDefined();
  });
});