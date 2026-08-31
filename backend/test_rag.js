import('@prisma/client').then(async ({PrismaClient}) => {
  const prisma = new PrismaClient();
  const docId = '8b579fd7-73f1-46ff-8bbb-e320f9414149';
  try {
    const doc = await prisma.document.findUnique({ where: { id: docId } });
    
    // 1. Send to python
    const aiRes = await fetch('http://localhost:8000/api/rag/chunk-and-embed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: doc.cleanedText || 'Fallback text for testing' })
    }).then(r => r.json());
    
    // 2. Send to node
    const storeRes = await fetch('http://localhost:3000/api/rag/vector-storage-test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documentId: docId, chunks: aiRes.chunks })
    }).then(r => r.json());
    
    console.log("Vector DB Result:", JSON.stringify(storeRes));
  } catch(e) {
    console.error('ERROR:', e.message);
  } finally {
    await prisma.$disconnect();
  }
});
