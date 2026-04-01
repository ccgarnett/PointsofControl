import 'dotenv/config';
import connectDB from './db';
import UserModel from './User';
import CalendarTask from './CalendarTask';

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(9, 0, 0, 0);
  return d;
}

async function seed() {
  await connectDB();

  const user = await UserModel.findOne({ role: 'Admin' });
  if (!user) {
    console.log('No admin user found — run npm run seed first.');
    process.exit(1);
  }

  const userId = user._id;
  const monday = getMonday(new Date());

  const offset = (days: number, hour = 9) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + days);
    d.setHours(hour, 0, 0, 0);
    return d;
  };

  const tasks = [
    { userId, title: 'Review course materials', description: 'Go through the new module content', date: offset(0), completed: true },
    { userId, title: 'Team standup', description: 'Weekly sync meeting', date: offset(0, 10), completed: false },
    { userId, title: 'Update analytics dashboard', description: 'Add date filtering to course analytics', date: offset(1), completed: false },
    { userId, title: 'User feedback review', date: offset(1, 14), completed: true },
    { userId, title: 'Deploy staging build', description: 'Push iteration 4 changes to staging', date: offset(2), completed: false },
    { userId, title: 'Write unit tests', description: 'Cover calendar and analytics endpoints', date: offset(3), completed: false },
    { userId, title: 'Sprint retrospective', date: offset(4, 15), completed: false },
  ];

  for (const task of tasks) {
    await CalendarTask.create(task);
    console.log(`Created task: "${task.title}"`);
  }

  console.log('Calendar seed complete.');
  process.exit(0);
}

seed().catch((err) => { console.error(err); process.exit(1); });
