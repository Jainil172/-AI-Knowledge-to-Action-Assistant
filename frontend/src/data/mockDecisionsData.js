export const mockDecisionsData = [
    {
        id: 'dec_301',
        title: 'Migrate to PostgreSQL and pgvector',
        description: 'Replacing the existing FAISS setup with PostgreSQL + pgvector to simplify our persistence layer and leverage existing relational data alongside embeddings.',
        status: 'Finalized',
        relatedDocument: 'Q3_Architecture_Review.pdf',
        documentId: 'doc_1',
        date: 'Oct 10, 2026',
        extractedContext: 'Selected due to its ACID compliance and the team\'s prior familiarity, ultimately reducing infrastructure complexity by 30%.'
    },
    {
        id: 'dec_302',
        title: 'Deprecate v1 REST API endpoints',
        description: 'All v1 REST APIs will be frozen. New features will only be exposed via the modern tRPC backend to ensure strong typing across the monolith.',
        status: 'Proposed',
        relatedDocument: 'Q3_Architecture_Review.pdf',
        documentId: 'doc_1',
        date: 'Oct 11, 2026',
        extractedContext: 'Decision driven by the constant typing misalignments causing 15% of recent sprint bugs.'
    },
    {
        id: 'dec_303',
        title: 'Delay multi-tenant enterprise features',
        description: 'Enterprise SSO and multi-tenant billing are delayed until early next year to focus all bandwidth on core AI stabilization.',
        status: 'Finalized',
        relatedDocument: 'Sprint_32_Planning.pdf',
        documentId: 'doc_3',
        date: 'Oct 14, 2026',
        extractedContext: 'Timeline constraints identified surrounding frontend integration capacity.'
    },
    {
        id: 'dec_304',
        title: 'Adopt strict 10MB upload limit',
        description: 'Restrict initial PDF document uploads to 10MB to guarantee processing stays within sync HTTP limitations without requiring heavy lambda queues yet.',
        status: 'Deferred',
        relatedDocument: 'Security_Audit_Report.pdf',
        documentId: 'doc_2',
        date: null, // Test missing date
        extractedContext: null // Test missing context
    },
    {
        id: 'dec_305',
        title: 'Switch LLM provider to Groq',
        description: 'Migrating primary NLP workloads to Groq (Llama-3 basis) for near-instant inference times, vastly improving the real-time chat UX.',
        status: 'Finalized',
        relatedDocument: 'Q3_Architecture_Review.pdf',
        documentId: 'doc_1',
        date: 'Oct 10, 2026',
        extractedContext: 'Resulted in 400% speedup per token.'
    }
];
