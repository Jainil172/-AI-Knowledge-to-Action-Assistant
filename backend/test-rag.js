import prisma from './src/config/prisma.js';
import { retrieveChunks, askDocument } from './src/services/ragService.js';

async function run() {
    const doc = await prisma.document.findFirst();
    const question = "What is the main problem in Project Atlas?";
    console.log('Doc:', doc.originalName);

    const retrieval = await retrieveChunks(doc.id, question);
    console.log('Retrieval result:', JSON.stringify(retrieval, null, 2));
}

run().catch(console.error);
