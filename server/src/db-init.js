import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl || dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1')) {
  console.error('\n========================================================================');
  console.error('ERROR: DATABASE_URL is not configured correctly for production.');
  console.error('It is currently unset or pointing to "localhost".');
  console.error('Please configure your DATABASE_URL environment variable in the Render');
  console.error('dashboard under Web Service -> Environment using your Render PostgreSQL');
  console.error('Internal Database URL.');
  console.error('========================================================================\n');
  process.exit(1);
}

console.log('Running database migrations...');
try {
  execSync('npx prisma migrate deploy', { stdio: 'inherit' });
  console.log('Database migrations completed successfully.');
} catch (error) {
  console.error('Failed to run database migrations:', error);
  process.exit(1);
}

const prisma = new PrismaClient();

try {
  const userCount = await prisma.user.count();
  if (userCount === 0) {
    console.log('Database is empty. Seeding initial data...');
    execSync('node prisma/seed.js', { stdio: 'inherit' });
    console.log('Database seeding completed successfully.');
  } else {
    console.log(`Database already has ${userCount} users. Skipping seeding.`);
  }
} catch (error) {
  console.error('Failed to initialize/seed database:', error);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
