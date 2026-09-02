import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Lightbulb, Search, X, Calendar, FileText,
    Loader2, AlertTriangle, UploadCloud
} from 'lucide-react';
import { documentsApi } from '../services/api';

function DecisionDetailPanel({ decision, onClose, navigate }) {
    if (!decision) return null;

    return (
        <div className="detail-panel-overlay" onClick={onClose} aria-modal="true" role="dialog" aria-label="Decision Details">
            <div className="detail-panel" onClick={e => e.stopPropagation()}>
                <div className="detail-panel-header">
                    <div>
                        <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '2px' }}>
                            Decision Details
                        </div>
                        <h2 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--color-text-primary)', lineHeight: 1.3 }}>
                            {decision.title}
                        </h2>
                    </div>
                    <button className="btn-icon" onClick={onClose} aria-label="Close panel"><X size={18} /></button>
                </div>

                <div className="detail-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Description */}
                    {decision.description && (
                        <div>
                            <div className="section-label">Context / Rationale</div>
                            <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.6, background: 'var(--color-surface-raised)', borderRadius: 'var(--radius-md)', padding: '12px 14px', border: '1px solid var(--color-surface-border)' }}>
                                {decision.description}
                            </p>
                        </div>
                    )}

                    {/* Properties */}
                    <div>
                        <div className="section-label">Properties</div>
                        <div style={{ fontSize: '14px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                                <span style={{ color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Calendar size={14} /> Date Logged
                                </span>
                                <span style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>
                                    {new Date(decision.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                </span>
                            </div>
                            {decision.sourcePageNumber && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                                    <span style={{ color: 'var(--color-text-muted)' }}>Source Page</span>
                                    <span style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>Page {decision.sourcePageNumber}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Source evidence */}
                    {decision.sourceEvidence && (
                        <div>
                            <div className="section-label">Source Evidence</div>
                            <div className="evidence-box">"{decision.sourceEvidence}"</div>
                        </div>
                    )}

                    {/* Source document */}
                    <div>
                        <div className="section-label">Source Document</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}
                            onClick={() => { navigate('/documents/' + decision.documentId); onClose(); }}>
                            <FileText size={18} color="var(--color-primary)" />
                            <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-primary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {decision.documentName || 'View source document'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="detail-panel-footer">
                    <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }} onClick={onClose}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function Decisions() {
    const navigate = useNavigate();
    const [decisions, setDecisions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [selectedDecision, setSelectedDecision] = useState(null);

    useEffect(() => {
        const fetchDecisions = async () => {
            try {
                setIsLoading(true);
                const docsRes = await documentsApi.list(1, 100);
                const allDocs = docsRes.data || [];
                let all = [];
                for (const doc of allDocs) {
                    const dRes = await documentsApi.getDecisions(doc.id, 1, 100);
                    const docDecisions = (dRes.data || []).map(d => ({ ...d, documentName: doc.originalName, documentId: doc.id }));
                    all = [...all, ...docDecisions];
                }
                all.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                setDecisions(all);
            } catch (err) {
                setError('Failed to load decisions. Please try again.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchDecisions();
    }, []);

    const filtered = useMemo(() => {
        if (!search) return decisions;
        const s = search.toLowerCase();
        return decisions.filter(d =>
            d.title?.toLowerCase().includes(s) || d.description?.toLowerCase().includes(s)
        );
    }, [decisions, search]);

    return (
        <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Header */}
                <div className="page-header">
                    <div className="page-header-info">
                        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            Decisions
                            {!isLoading && <span className="badge badge-neutral">{filtered.length}</span>}
                        </h1>
                        <p className="page-subtitle">
                            Key decisions and conclusions identified and logged from your knowledge documents.
                        </p>
                    </div>
                    <button className="btn btn-secondary" onClick={() => navigate('/upload')}>
                        <UploadCloud size={16} /> Add Document
                    </button>
                </div>

                {/* Filter bar */}
                <div className="filter-bar">
                    <div className="filter-search-wrap">
                        <Search size={16} color="var(--color-text-muted)" />
                        <input
                            id="decisions-search"
                            className="filter-search-input"
                            placeholder="Search decisions..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    {search && (
                        <button className="btn btn-secondary btn-sm" onClick={() => setSearch('')}>
                            <X size={13} /> Clear
                        </button>
                    )}
                </div>

                {/* Content */}
                {isLoading ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '80px 0', color: 'var(--color-text-secondary)', fontSize: '14px' }}>
                        <Loader2 size={20} style={{ animation: 'spin 0.7s linear infinite', color: 'var(--color-primary)' }} />
                        Loading decisions from all documents…
                    </div>
                ) : error ? (
                    <div className="card">
                        <div className="empty-state">
                            <div className="empty-state-icon" style={{ background: '#fef2f2', borderColor: '#fecaca' }}>
                                <AlertTriangle size={22} color="#dc2626" />
                            </div>
                            <p className="empty-state-title">Failed to load decisions</p>
                            <p className="empty-state-text">{error}</p>
                            <button className="btn btn-secondary btn-sm" onClick={() => window.location.reload()}>Retry</button>
                        </div>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="card">
                        <div className="empty-state">
                            <div className="empty-state-icon">
                                <Lightbulb size={24} />
                            </div>
                            <p className="empty-state-title">
                                {search ? 'No decisions match your search' : 'No decisions identified yet'}
                            </p>
                            <p className="empty-state-text">
                                {search
                                    ? 'Try a different search term or clear the filter.'
                                    : 'Upload and process a document to automatically identify key decisions and conclusions.'}
                            </p>
                            {search
                                ? <button className="btn btn-secondary btn-sm" onClick={() => setSearch('')}>Clear Search</button>
                                : <button className="btn btn-primary" onClick={() => navigate('/upload')}><UploadCloud size={16} /> Upload Document</button>
                            }
                        </div>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {filtered.map(decision => (
                            <div
                                key={decision.id}
                                className="card"
                                onClick={() => setSelectedDecision(decision)}
                                style={{ padding: '18px 20px', cursor: 'pointer', borderLeft: '3px solid #d8b4fe', display: 'flex', gap: '16px', alignItems: 'flex-start', transition: 'box-shadow 0.15s' }}
                                onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow-md)'}
                                onMouseLeave={e => e.currentTarget.style.boxShadow = 'var(--shadow-sm)'}
                            >
                                <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: '#faf5ff', border: '1px solid #d8b4fe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                                    <Lightbulb size={17} color="#9333ea" />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '6px', lineHeight: 1.4 }}>
                                        {decision.title}
                                    </h3>
                                    {decision.description && (
                                        <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: '10px' }}>
                                            {decision.description}
                                        </p>
                                    )}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                                            <Calendar size={12} />
                                            {new Date(decision.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </span>
                                        {decision.documentName && (
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--color-primary)', fontWeight: 500 }}>
                                                <FileText size={12} />
                                                {decision.documentName}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {selectedDecision && (
                <DecisionDetailPanel decision={selectedDecision} onClose={() => setSelectedDecision(null)} navigate={navigate} />
            )}
        </>
    );
}
