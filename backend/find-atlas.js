const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');

async function run() {
    const docs = await prisma.document.findMany();
    for (let i = 0; i < docs.length; i++) {
        const doc = docs[i];
        console.log(`Document ${i + 1}: ${doc.originalName} (${doc.id})`);
        if (doc.cleanedText && doc.cleanedText.includes('Atlas')) {
            console.log('--- FOUND ATLAS IN THIS DOCUMENT ---');
        }
    }
}
run();
