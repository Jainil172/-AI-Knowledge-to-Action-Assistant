export const mockTasksData = [
    {
        id: 'tsk_101',
        title: 'Provision new AWS staging database',
        description: 'The upcoming v2 launch requires an isolated staging database running PostgreSQL with pgvector enabled to test similarity searches.',
        owner: 'Alex Jenkins',
        deadline: 'Oct 20, 2026',
        priority: 'high',
        status: 'in progress',
        relatedDocument: 'Q3_Architecture_Review.pdf',
        documentId: 'doc_1',
        extractedAt: '2 days ago'
    },
    {
        id: 'tsk_102',
        title: 'Update authentication middleware',
        description: 'Update the existing JWT middleware to support multi-tenant workspaces and robust rate-limiting to prevent brute force attacks on AI endpoints.',
        owner: null, // Test missing information
        deadline: 'Oct 15, 2026',
        priority: 'high',
        status: 'pending',
        relatedDocument: 'Security_Audit_Report.pdf',
        documentId: 'doc_2',
        extractedAt: '1 day ago'
    },
    {
        id: 'tsk_103',
        title: 'Deprecate old REST endpoints',
        description: 'Ensure all v1 REST endpoints are fully deprecated in favor of tRPC before the end of the sprint, as decided during the architecture review.',
        owner: 'Engineering Team',
        deadline: null, // Test missing information
        priority: 'medium',
        status: 'completed',
        relatedDocument: 'Q3_Architecture_Review.pdf',
        documentId: 'doc_1',
        extractedAt: '2 days ago'
    },
    {
        id: 'tsk_104',
        title: 'Review third-party API rate limits',
        description: 'Audit the current Groq and OpenAI quota utilization. We are approaching 80% usage threshold.',
        owner: 'Samantha Wright',
        deadline: 'Oct 12, 2026',
        priority: 'low',
        status: 'pending',
        relatedDocument: 'Sprint_32_Planning.pdf',
        documentId: 'doc_3',
        extractedAt: 'Just now'
    },
    {
        id: 'tsk_105',
        title: 'Draft incident response plan',
        description: 'Create a formal incident response plan targeting potential data breaches within the generative pipeline.',
        owner: 'Security Ops',
        deadline: 'Oct 25, 2026',
        priority: 'medium',
        status: 'pending',
        relatedDocument: 'Security_Audit_Report.pdf',
        documentId: 'doc_2',
        extractedAt: '1 day ago'
    }
];
