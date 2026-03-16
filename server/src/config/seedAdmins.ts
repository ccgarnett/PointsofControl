import 'dotenv/config';
import bcrypt from 'bcryptjs';
import connectDB from './db';
import UserModel from './User';

const admins = [
  { username: 'chase',   password: 'Chase@POC1'   },
  { username: 'nyrique', password: 'Nyrique@POC1' },
  { username: 'jordan',  password: 'Jordan@POC1'  },
];

async function seed() {
  await connectDB();
  for (const admin of admins) {
    const exists = await UserModel.findOne({ username: admin.username });
    if (exists) {
      console.log(`User "${admin.username}" already exists — skipping.`);
      continue;
    }
    const passwordHash = await bcrypt.hash(admin.password, 10);
    await UserModel.create({ username: admin.username, passwordHash, role: 'Admin' });
    console.log(`Created admin: ${admin.username}`);
  }
  console.log('Done.');
  process.exit(0);
}

seed().catch((err) => { console.error(err); process.exit(1); });
