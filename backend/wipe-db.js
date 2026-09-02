import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log('Deleting all test data safely...');
    await prisma.task.deleteMany({});
    await prisma.risk.deleteMany({});
    await prisma.decision.deleteMany({});
    await prisma.documentChunk.deleteMany({});
    await prisma.document.deleteMany({});
    console.log('✅ Cleaned all documents and relationships successfully!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
