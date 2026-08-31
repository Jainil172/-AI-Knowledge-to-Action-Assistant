import { PrismaClient } from '@prisma/client';

// Create a singleton instance of PrismaClient
// This prevents multiple database connections in development
const globalForPrisma = globalThis;

const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
