import 'dotenv/config';
import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI || '';
    const options: mongoose.ConnectOptions = {};
    // Fix "unable to get issuer certificate" when TLS can't verify (e.g. corporate proxy, custom CA).
    // For production, prefer installing the correct CA certs instead of disabling verification.
    if (process.env.NODE_ENV !== 'production') {
      options.tlsAllowInvalidCertificates = true;
    }
    await mongoose.connect(uri, options);
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

export default connectDB;