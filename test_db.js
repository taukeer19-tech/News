const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres:Admin%402188%24%24@db.xtttjoelffdarvojkrgr.supabase.co:5432/postgres"
    }
  }
});

async function main() {
  console.log("Attempting to connect to Supabase...");
  try {
    await prisma.$connect();
    console.log("Connection successful!");
  } catch (e) {
    console.error("Connection failed!");
    console.error(e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
