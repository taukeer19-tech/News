const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('Taukeer$2027$', 10);
  const user = await prisma.user.upsert({
    where: { email: 'taukeer@bombinoexp.com' },
    update: {
      password: hashedPassword,
      name: 'Taukeer Admin'
    },
    create: {
      email: 'taukeer@bombinoexp.com',
      password: hashedPassword,
      name: 'Taukeer Admin'
    }
  });
  console.log('Admin user created successfully:', user.email);
}

main()
  .catch(e => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
