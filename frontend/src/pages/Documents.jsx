import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileText, UploadCloud, ArrowRight, Calendar, ChevronRight, Search, AlertCircle } from 'lucide-react';
import { documentsApi } from '../services/api';

export default function Documents() {
    const navigate = useNavigate();
    const [docs, setDocs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await documentsApi.list(1, 100);
                const sorted = (res.data || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                setDocs(sorted);
            } catch (err) {
                setError('Failed to load documents. Please try again.');
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, []);

    const filtered = docs.filter(d =>
        !search || d.originalName?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Header */}
            <div className="page-header">
                <div className="page-header-info">
                    <h1 className="page-title">Knowledge Base</h1>
                    <p className="page-subtitle">
                        Upload and explore documents that will be analyzed to extract actionable insights.
                    </p>
                </div>
                <button className="btn btn-primary" onClick={() => navigate('/upload')}>
                    <UploadCloud size={16} /> Upload Document
                </button>
            </div>

            {/* Filter bar */}
            <div className="filter-bar">
                <div className="filter-search-wrap">
                    <Search size={16} color="var(--color-text-muted)" />
                    <input
                        id="docs-search"
                        className="filter-search-input"
                        placeholder="Search documents..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                {search && (
                    <button className="btn btn-secondary btn-sm" onClick={() => setSearch('')}>Clear</button>
                )}
            </div>

            {/* Content */}
            {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: '12px' }}>
                    <div className="spinner" />
                    <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>Loading documents...</p>
                </div>
            ) : error ? (
                <div className="card" style={{ padding: '40px' }}>
                    <div className="empty-state">
                        <div className="empty-state-icon" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
                            <AlertCircle size={22} color="#dc2626" />
                        </div>
                        <p className="empty-state-title">Something went wrong</p>
                        <p className="empty-state-text">{error}</p>
                        <button className="btn btn-secondary btn-sm" onClick={() => window.location.reload()}>Retry</button>
                    </div>
                </div>
            ) : filtered.length === 0 ? (
                <div className="card" style={{ padding: '40px' }}>
                    <div className="empty-state">
                        <div className="empty-state-icon">
                            <FileText size={24} />
                        </div>
                        <p className="empty-state-title">
                            {search ? 'No documents match your search' : 'No documents yet'}
                        </p>
                        <p className="empty-state-text">
                            {search
                                ? 'Try a different search term or clear the filter.'
                                : 'Add your first document to start generating actionable insights from your knowledge.'}
                        </p>
                        {!search && (
                            <button className="btn btn-primary" onClick={() => navigate('/upload')}>
                                <UploadCloud size={16} /> Upload Your First Document
                            </button>
                        )}
                    </div>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                    {filtered.map(doc => (
                        <DocumentCard key={doc.id} doc={doc} />
                    ))}
                </div>
            )}
        </div>
    );
}

function DocumentCard({ doc }) {
    const navigate = useNavigate();
    const tasksCount = doc.tasks?.length ?? 0;
    const risksCount = doc.risks?.length ?? 0;
    const decisionsCount = doc.decisions?.length ?? 0;

    return (
        <div
            className="doc-card"
            role="button"
            tabIndex={0}
            onClick={() => navigate(`/documents/${doc.id}`)}
            onKeyDown={e => e.key === 'Enter' && navigate(`/documents/${doc.id}`)}
            aria-label={`View document: ${doc.originalName}`}
        >
            {/* Top row */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{
                    width: 40, height: 40, borderRadius: 'var(--radius-md)',
                    background: '#eff6ff', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', flexShrink: 0
                }}>
                    <FileText size={18} color="var(--color-primary)" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {doc.originalName}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '3px', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                        <Calendar size={12} />
                        {new Date(doc.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        {doc.pageCount > 0 && <> · {doc.pageCount} pages</>}
                    </div>
                </div>
                <ChevronRight size={16} color="var(--color-text-muted)" style={{ flexShrink: 0, marginTop: '2px' }} />
            </div>

            {/* Summary snippet */}
            {doc.summary && (
                <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {doc.summary}
                </p>
            )}

            {/* Intelligence counts */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                {tasksCount > 0 && (
                    <span className="badge badge-success">{tasksCount} task{tasksCount > 1 ? 's' : ''}</span>
                )}
                {risksCount > 0 && (
                    <span className="badge badge-danger">{risksCount} risk{risksCount > 1 ? 's' : ''}</span>
                )}
                {decisionsCount > 0 && (
                    <span className="badge" style={{ background: '#faf5ff', color: '#9333ea', borderColor: '#d8b4fe' }}>
                        {decisionsCount} decision{decisionsCount > 1 ? 's' : ''}
                    </span>
                )}
                {tasksCount + risksCount + decisionsCount === 0 && (
                    <span className="badge badge-neutral">Processing...</span>
                )}
            </div>
        </div>
    );
}
