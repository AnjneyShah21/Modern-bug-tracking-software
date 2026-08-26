import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing existing database...');
  await prisma.notification.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.bugRelation.deleteMany();
  await prisma.bug.deleteMany();
  await prisma.component.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  console.log('Seeding minimal clean initial accounts...');

  const passwordHash = await bcrypt.hash('password123', 10);

  // Initial Clean Admin Account
  await prisma.user.create({
    data: {
      name: 'System Admin',
      email: 'admin@bugzilla.com',
      passwordHash,
      role: Role.ADMIN,
      designation: 'Engineering Director',
    },
  });

  // Initial Clean Developer Account
  await prisma.user.create({
    data: {
      name: 'Lead Developer',
      email: 'dev@bugzilla.com',
      passwordHash,
      role: Role.DEVELOPER,
      designation: 'Senior Full Stack Engineer',
    },
  });

  console.log('Clean database initial accounts created successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
