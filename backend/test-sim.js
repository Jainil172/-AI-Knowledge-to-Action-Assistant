import prisma from './src/config/prisma.js';
import { retrieveRelevantChunks } from './src/services/semanticRetrievalService.js';

async function run() {
    const doc = await prisma.document.findFirst();
    const res = await retrieveRelevantChunks(doc.id, "What is the main problem in Project Atlas?");
    console.log(JSON.stringify(res, null, 2));
}

run();
