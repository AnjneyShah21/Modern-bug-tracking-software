import { PrismaClient, Role, Severity, Priority, BugStatus } from '@prisma/client';
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

  console.log('Seeding database...');

  // Hash password
  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Create Users
  console.log('Creating users...');
  const users = {
    admin: await prisma.user.create({
      data: {
        name: 'Sarah Connor',
        email: 'admin@bugzilla.com',
        passwordHash,
        role: Role.ADMIN,
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      },
    }),
    dev1: await prisma.user.create({
      data: {
        name: 'Alex Mercer',
        email: 'dev1@bugzilla.com',
        passwordHash,
        role: Role.DEVELOPER,
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      },
    }),
    dev2: await prisma.user.create({
      data: {
        name: 'Elena Rostova',
        email: 'dev2@bugzilla.com',
        passwordHash,
        role: Role.DEVELOPER,
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      },
    }),
    reporter: await prisma.user.create({
      data: {
        name: 'John Doe',
        email: 'reporter@bugzilla.com',
        passwordHash,
        role: Role.REPORTER,
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      },
    }),
    qa: await prisma.user.create({
      data: {
        name: 'Jane Foster',
        email: 'qa@bugzilla.com',
        passwordHash,
        role: Role.QA,
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      },
    }),
  };

  // 2. Create Projects & Components
  console.log('Creating projects and components...');
  const project1 = await prisma.project.create({
    data: {
      name: 'Acme Web Platform',
      description: 'The core e-commerce website and consumer web application portal.',
      components: {
        create: [
          { name: 'Checkout & Payments', description: 'Stripe integration, shopping cart and billing flows.' },
          { name: 'User Authentication', description: 'Sign up, login, MFA, and session management.' },
          { name: 'Search & Recommendations', description: 'Elasticsearch-powered product indexing and search recommendation engine.' },
          { name: 'Frontend UI', description: 'React design system components, accessibility, and theme styling.' },
        ],
      },
    },
    include: { components: true },
  });

  const project2 = await prisma.project.create({
    data: {
      name: 'Acme Mobile App',
      description: 'Native iOS and Android consumer mobile applications.',
      components: {
        create: [
          { name: 'Push Notifications', description: 'FCM and APNS notification handling and deep linking.' },
          { name: 'Offline Sync', description: 'Local SQLite cache and background syncing mechanisms.' },
          { name: 'Camera Integration', description: 'Receipt scanning, profile photo uploads, and barcode reader.' },
          { name: 'Performance', description: 'Startup metrics, memory leak prevention, and bundle optimization.' },
        ],
      },
    },
    include: { components: true },
  });

  const components1 = project1.components;
  const components2 = project2.components;

  const checkoutComp = components1.find((c: any) => c.name === 'Checkout & Payments')!;
  const authComp = components1.find((c: any) => c.name === 'User Authentication')!;
  const searchComp = components1.find((c: any) => c.name === 'Search & Recommendations')!;
  const uiComp = components1.find((c: any) => c.name === 'Frontend UI')!;

  const pushComp = components2.find((c: any) => c.name === 'Push Notifications')!;
  const offlineComp = components2.find((c: any) => c.name === 'Offline Sync')!;

  // 3. Create Bugs
  console.log('Creating bugs...');
  const bug1 = await prisma.bug.create({
    data: {
      title: 'Stripe Webhook signature verification failing in production',
      description: 'We are receiving webhooks from Stripe but the signature verification fails, preventing checkout from completing and database payment updates.',
      stepsToReproduce: '1. Add items to cart.\n2. Complete checkout with test card.\n3. Stripe sends webhook to `/api/webhooks/stripe`.\n4. Server responds with 400 Bad Request due to verification failure.',
      expectedBehavior: 'Stripe webhook signature should verify successfully using the endpoint secret and update the transaction status in the database.',
      actualBehavior: 'Webhook endpoint returns 400 with message "Webhook signature verification failed".',
      severity: Severity.CRITICAL,
      priority: Priority.P0,
      status: BugStatus.NEW,
      tags: ['stripe', 'production', 'webhook'],
      projectId: project1.id,
      componentId: checkoutComp.id,
      reporterId: users.qa.id,
      assigneeId: users.dev1.id,
      watchers: {
        connect: [{ id: users.admin.id }, { id: users.qa.id }],
      },
    },
  });

  const bug2 = await prisma.bug.create({
    data: {
      title: 'MFA SMS verification code is not sent to users with UK phone numbers',
      description: 'Users attempting to verify their accounts using UK phone numbers (+44) do not receive the SMS code via Twilio.',
      stepsToReproduce: '1. Register with a UK phone number starting with +44.\n2. Request login SMS.\n3. Twilio API registers success, but message never arrives on the device.',
      expectedBehavior: 'SMS should arrive within 30 seconds for UK mobile carriers.',
      actualBehavior: 'No SMS received, log shows Twilio error code 21614.',
      severity: Severity.HIGH,
      priority: Priority.P1,
      status: BugStatus.IN_PROGRESS,
      tags: ['auth', 'mfa', 'twilio'],
      projectId: project1.id,
      componentId: authComp.id,
      reporterId: users.reporter.id,
      assigneeId: users.dev2.id,
      watchers: {
        connect: [{ id: users.qa.id }],
      },
    },
  });

  const bug3 = await prisma.bug.create({
    data: {
      title: 'Product search returns zero results when containing apostrophes',
      description: 'Searching for terms containing apostrophes, e.g. "Collector\'s Edition", returns empty results due to improper SQL escaping or query tokenization.',
      stepsToReproduce: '1. Type "Collector\'s" in search bar.\n2. Press Enter.\n3. No results page is displayed instead of matches.',
      expectedBehavior: 'Search should return items matching "Collector\'s Edition".',
      actualBehavior: 'Search input causes Elasticsearch query execution failure, yielding 0 results.',
      severity: Severity.MEDIUM,
      priority: Priority.P2,
      status: BugStatus.TRIAGED,
      tags: ['search', 'elasticsearch', 'bug'],
      projectId: project1.id,
      componentId: searchComp.id,
      reporterId: users.qa.id,
      assigneeId: users.dev1.id,
    },
  });

  const bug4 = await prisma.bug.create({
    data: {
      title: 'Main navigation header is cut off on Safari iOS 15',
      description: 'On Safari iOS 15, the header overlaps with the status bar or gets partially hidden when scrolling down.',
      stepsToReproduce: '1. Open Acme site on iPhone running iOS 15.\n2. Scroll down page.\n3. Observe header styling breaks.',
      expectedBehavior: 'Header stays sticky or disappears smoothly without layout clipping.',
      actualBehavior: 'Header collapses and overlays menu options.',
      severity: Severity.LOW,
      priority: Priority.P3,
      status: BugStatus.RESOLVED,
      tags: ['safari', 'mobile-web', 'ui'],
      projectId: project1.id,
      componentId: uiComp.id,
      reporterId: users.reporter.id,
      assigneeId: users.dev2.id,
    },
  });

  const bug5 = await prisma.bug.create({
    data: {
      title: 'Push notifications fail on Android 13 due to missing POST_NOTIFICATIONS permission request',
      description: 'Android 13 requires runtime permissions for push notifications. The app crashes or fails silently because we are not requesting this dialog.',
      stepsToReproduce: '1. Launch app on Android 13 device.\n2. Go to notifications settings.\n3. App doesn\'t request push notifications runtime permission.',
      expectedBehavior: 'App triggers runtime permission prompt on first launch or login.',
      actualBehavior: 'No permission prompt shows up, push notifications blocked by default.',
      severity: Severity.HIGH,
      priority: Priority.P1,
      status: BugStatus.IN_REVIEW,
      tags: ['android', 'notifications'],
      projectId: project2.id,
      componentId: pushComp.id,
      reporterId: users.qa.id,
      assigneeId: users.dev2.id,
    },
  });

  const bug6 = await prisma.bug.create({
    data: {
      title: 'Database synchronization locks up on low network bandwidth',
      description: 'When SQLite syncs data back to PostgreSQL over slow 3G connections, the request times out and locks the local SQLite database state, requiring an app restart.',
      stepsToReproduce: '1. Turn on network throttling (3G).\n2. Create 5 offline orders.\n3. Go online; order sync initiates and hangs.\n4. Local app remains in syncing state indefinitely.',
      expectedBehavior: 'Sync should retry with exponential backoff or fail gracefully with network timeout.',
      actualBehavior: 'Transaction locks db file, app crashes.',
      severity: Severity.HIGH,
      priority: Priority.P1,
      status: BugStatus.NEW,
      tags: ['offline', 'sync', 'sqlite'],
      projectId: project2.id,
      componentId: offlineComp.id,
      reporterId: users.qa.id,
    },
  });

  // 4. Create Bug Relations (Blocking / Blocked By)
  console.log('Creating bug relations...');
  await prisma.bugRelation.create({
    data: {
      bugId: bug2.id,       // MFA blocked
      blockedById: bug1.id, // by Stripe checkout (just as an example relation)
    },
  });

  // 5. Create Comments
  console.log('Creating comments...');
  await prisma.comment.createMany({
    data: [
      {
        bugId: bug1.id,
        authorId: users.dev1.id,
        text: 'I checked the webhook payload logs. The issue seems to be that Next.js raw body is parsed by body-parser before reaching the Stripe SDK. We need to disable the API body parsing for this route.',
      },
      {
        bugId: bug1.id,
        authorId: users.qa.id,
        text: 'Confirming that raw body workaround fixed this in my local staging environment. Let me know when you push a PR.',
      },
      {
        bugId: bug2.id,
        authorId: users.dev2.id,
        text: 'Working on updating Twilio helper config. It seems Twilio UK numbers require messaging service registration under compliance laws. Checking Twilio Console logs now.',
      },
    ],
  });

  // 6. Create Activity Logs
  console.log('Creating activity logs...');
  await prisma.activityLog.createMany({
    data: [
      {
        bugId: bug1.id,
        field: 'status',
        oldValue: 'NEW',
        newValue: 'TRIAGED',
        changedById: users.admin.id,
      },
      {
        bugId: bug1.id,
        field: 'assigneeId',
        oldValue: null,
        newValue: users.dev1.name,
        changedById: users.admin.id,
      },
      {
        bugId: bug2.id,
        field: 'status',
        oldValue: 'NEW',
        newValue: 'IN_PROGRESS',
        changedById: users.dev2.id,
      },
      {
        bugId: bug4.id,
        field: 'status',
        oldValue: 'IN_REVIEW',
        newValue: 'RESOLVED',
        changedById: users.dev2.id,
      },
    ],
  });

  // 7. Create Notifications
  console.log('Creating notifications...');
  await prisma.notification.createMany({
    data: [
      {
        userId: users.admin.id,
        bugId: bug1.id,
        message: 'Bug #1: Stripe Webhook signature verification failing in production has been triaged.',
        read: false,
      },
      {
        userId: users.qa.id,
        bugId: bug1.id,
        message: 'Alex Mercer commented on Bug #1: "I checked the webhook payload..."',
        read: false,
      },
    ],
  });

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
