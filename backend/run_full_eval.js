import { PrismaClient } from '@prisma/client';
import { sendPDFToAIService, generateDocumentChunks } from './src/services/ai.service.js';
import { saveDocumentIntelligence } from './src/services/documentPersistenceService.js';
import { askDocument } from './src/services/ragService.js';
import path from 'path';

const prisma = new PrismaClient();

const testPdfs = [
    "Document_No_Tasks.pdf",
    "Document_No_Risks.pdf",
    "Document_No_Decisions.pdf",
    "Document_Long.pdf",
    "Document_Conflicting.pdf",
    "Document_Pending_Mixed.pdf",
    "Document_Irrelevant.pdf"
];

async function uploadFile(filename) {
    console.log('Uploading', filename);
    const aiResponse = await sendPDFToAIService(path.join(process.cwd(), filename), filename);
    if (!aiResponse.success) throw new Error("AI failed: " + aiResponse.error);

    const intelligence = aiResponse.data.intelligence;
    let validatedIntelligence = { tasks: [], risks: [], decisions: [], keyTopics: [], peopleMentioned: [], importantPoints: [], missingOrUnclearInformation: [] };

    if (intelligence && intelligence.success && intelligence.intelligence) {
        validatedIntelligence = intelligence.intelligence;
    }

    // Hardcode a user ID (first user)
    const user = await prisma.user.findFirst();

    const saved = await saveDocumentIntelligence({
        userId: user.id,
        fileMetadata: {
            originalName: filename,
            storedFilename: filename, // Mock
            mimeType: 'application/pdf',
            fileSize: 1000
        },
        aiResponse: aiResponse.data?.document || {},
        validatedIntelligence: validatedIntelligence
    });

    if (saved.document.cleanedText) {
        await generateDocumentChunks(saved.document.id, saved.document.cleanedText);
    }

    // Slight delay for embedding to finish processing in PG
    await new Promise(r => setTimeout(r, 2000));

    return saved.document.id;
}

async function run() {
    console.log("Cleaning DB...");
    await prisma.document.deleteMany(); // Cascade deletes chunks, tasks, etc

    let docIds = {};
    for (let file of testPdfs) {
        docIds[file] = await uploadFile(file);
    }
    console.log("All uploaded successfully.");

    // We will execute a question to test it
    const q = "Who is the janitor and what must they do?";
    const ans = await askDocument(docIds["Document_Irrelevant.pdf"], q);
    console.log("\nIrrelevant Document Answer:", ans.answer);

    process.exit(0);
}
run().catch(console.error);
