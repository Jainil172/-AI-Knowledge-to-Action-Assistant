export const mockRisksData = [
    {
        id: 'risk_201',
        title: 'Timeline constraint for v2 launch',
        description: 'The proposed feature set for the Q3 release exceeds the remaining sprint capacity by approximately 40%, increasing the likelihood of a delayed launch.',
        severity: 'high',
        status: 'open',
        relatedDocument: 'Sprint_32_Planning.pdf',
        documentId: 'doc_3',
        dateIdentified: 'Oct 12, 2026',
        extractedInfo: 'Identified conflicting dependencies between backend scale-out and frontend UI completion.'
    },
    {
        id: 'risk_202',
        title: 'Third-party API rate limits',
        description: 'Current usage approaches 80% of vendor API rate limit tier. Failing to upgrade or optimize requests could lead to temporary outages during peak hours.',
        severity: 'medium',
        status: 'mitigated',
        relatedDocument: 'Q3_Architecture_Review.pdf',
        documentId: 'doc_1',
        dateIdentified: 'Oct 10, 2026',
        extractedInfo: 'Associated vendor limit is 10k requests/min.'
    },
    {
        id: 'risk_203',
        title: 'Outdated compliance documentation',
        description: 'Security audit report reveals that ISO27001 documents have not been revised since last year. Needs addressing before next external audit.',
        severity: 'high',
        status: 'open',
        relatedDocument: 'Security_Audit_Report.pdf',
        documentId: 'doc_2',
        dateIdentified: 'Oct 14, 2026',
        extractedInfo: 'Missing signatures on Section 4 framework revisions.'
    },
    {
        id: 'risk_204',
        title: 'PostgreSQL connection pooling limits',
        description: 'Scaling backend infrastructure 3x may hit the pg-bouncer max connection limit early if not configured correctly.',
        severity: 'medium',
        status: 'open',
        relatedDocument: 'Q3_Architecture_Review.pdf',
        documentId: 'doc_1',
        dateIdentified: null, // test missing data
        extractedInfo: 'Recommendation: Adjust max_client_conn threshold.'
    },
    {
        id: 'risk_205',
        title: 'Minor UI inconsistencies in dashboard',
        description: 'Old color variables detected in the UI codebase deprecation pass.',
        severity: 'low',
        status: 'acknowledged',
        relatedDocument: null, // test missing document
        documentId: null,
        dateIdentified: 'Oct 11, 2026',
        extractedInfo: null // test missing extra info
    }
];
