import prisma from './src/config/prisma.js';
import { cosineSimilarity } from './src/services/vectorPersistenceService.js';

async function run() {
    const chunks = await prisma.documentChunk.findMany();

    const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    const question = "What is the main problem in Project Atlas?";
    const response = await fetch(`${AI_SERVICE_URL}/api/rag/chunk-and-embed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: question }),
    });
    const data = await response.json();
    const qEmb = data.chunks[0].embedding;

    for (const c of chunks) {
        const cEmb = JSON.parse(c.embedding);
        const sim = cosineSimilarity(qEmb, cEmb);
        console.log(`Chunk ${c.chunkIndex} similarity:`, sim);
    }
}
run();
