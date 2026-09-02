import prisma from './src/config/prisma.js';

async function run() {
    const chunks = await prisma.documentChunk.findMany();
    console.log("Number of chunks in DB:", chunks.length);
    for (const c of chunks) {
        const emb = JSON.parse(c.embedding);
        console.log(`Chunk ${c.chunkIndex} embedding dimension in DB:`, emb.length);
        console.log(`Chunk DB dimension column says:`, c.embeddingDimension);
    }

    const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    const response = await fetch(`${AI_SERVICE_URL}/api/rag/chunk-and-embed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: "Test question" }),
    });
    const data = await response.json();
    if (data.chunks && data.chunks.length > 0) {
        console.log("Question embedding dimension from AI service:", data.chunks[0].embedding.length);
    } else {
        console.log("AI service returned no chunks for question?!", data);
    }
}
run();
