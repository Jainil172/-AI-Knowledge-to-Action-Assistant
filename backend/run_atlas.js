import prisma from './src/config/prisma.js';
import { askDocument } from './src/services/ragService.js';

async function run() {
    const docs = await prisma.document.findMany();
    const atlas = docs.find(d => d.originalName === '01_Project_Status.pdf');

    const questions = [
        "What is the main problem in Project Atlas?",
        "Who is responsible for stabilizing the reporting API?",
        "What is the deadline for stabilizing the reporting API?",
        "What is the biggest risk to the project release?",
        "What decision was made about advanced reporting features?",
        "When is the planned project release?",
        "Who is the CEO of the company?" // Fake question
    ];

    for (const q of questions) {
        console.log('\nQ:', q);
        const answer = await askDocument(atlas.id, q);
        console.log('A:', answer.answer);
    }
}

run().catch(console.error);
