import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ShieldAlert, Search, X, FileText, Calendar,
    Loader2, AlertTriangle, UploadCloud
} from 'lucide-react';
import { documentsApi } from '../services/api';

const getSeverityStyle = (severity) => {
    switch (severity?.toLowerCase()) {
        case 'high': return { label: 'High Severity', badge: 'badge-danger', border: '#fecaca', bg: '#fef2f2' };
        case 'medium': return { label: 'Medium Severity', badge: 'badge-warning', border: '#fde68a', bg: '#fffbeb' };
        case 'low': return { label: 'Low Severity', badge: 'badge-primary', border: '#bfdbfe', bg: '#eff6ff' };
        default: return { label: 'Unknown', badge: 'badge-neutral', border: 'var(--color-surface-border)', bg: 'var(--color-surface-raised)' };
    }
};

function RiskDetailPanel({ risk, onClose, navigate }) {
    if (!risk) return null;
    const sev = getSeverityStyle(risk.severity);

    return (
        <div className="detail-panel-overlay" onClick={onClose} aria-modal="true" role="dialog" aria-label="Risk Details">
            <div className="detail-panel" onClick={e => e.stopPropagation()}>
                <div className="detail-panel-header">
                    <div>
                        <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '2px' }}>
                            Risk Details
                        </div>
                        <h2 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--color-text-primary)', lineHeight: 1.3 }}>
                            {risk.title}
                        </h2>
                    </div>
                    <button className="btn-icon" onClick={onClose} aria-label="Close panel"><X size={18} /></button>
                </div>

                <div className="detail-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Severity badge */}
                    <div>
                        <span className={`badge ${sev.badge}`}>{sev.label}</span>
                    </div>

                    {/* Description */}
                    {risk.description && (
                        <div>
                            <div className="section-label">Description</div>
                            <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.6, background: 'var(--color-surface-raised)', borderRadius: 'var(--radius-md)', padding: '12px 14px', border: '1px solid var(--color-surface-border)' }}>
                                {risk.description}
                            </p>
                        </div>
                    )}

                    {/* Properties */}
                    <div>
                        <div className="section-label">Properties</div>
                        <div style={{ display: 'flex', flexDirection: 'column', fontSize: '14px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                                <span style={{ color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Calendar size={14} /> Date Identified
                                </span>
                                <span style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>
                                    {new Date(risk.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                            {risk.sourcePageNumber && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                                    <span style={{ color: 'var(--color-text-muted)' }}>Source Page</span>
                                    <span style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>Page {risk.sourcePageNumber}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Source evidence */}
                    {risk.sourceEvidence && (
                        <div>
                            <div className="section-label">Source Evidence</div>
                            <div className="evidence-box">"{risk.sourceEvidence}"</div>
                        </div>
                    )}

                    {/* Source document */}
                    <div>
                        <div className="section-label">Source Document</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}
                            onClick={() => { navigate('/documents/' + risk.documentId); onClose(); }}>
                            <FileText size={18} color="var(--color-primary)" />
                            <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-primary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {risk.documentName || 'View source document'}
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

export default function Risks() {
    const navigate = useNavigate();
    const [risks, setRisks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [severityFilter, setSeverityFilter] = useState('All');
    const [selectedRisk, setSelectedRisk] = useState(null);

    useEffect(() => {
        const fetchRisks = async () => {
            try {
                setIsLoading(true);
                const docsRes = await documentsApi.list(1, 100);
                const allDocs = docsRes.data || [];
                let all = [];
                for (const doc of allDocs) {
                    const rRes = await documentsApi.getRisks(doc.id, 1, 100);
                    const docRisks = (rRes.data || []).map(r => ({ ...r, documentName: doc.originalName, documentId: doc.id }));
                    all = [...all, ...docRisks];
                }
                all.sort((a, b) => {
                    const order = { high: 0, medium: 1, low: 2 };
                    return (order[(a.severity || '').toLowerCase()] ?? 3) - (order[(b.severity || '').toLowerCase()] ?? 3);
                });
                setRisks(all);
            } catch (err) {
                setError('Failed to load risks. Please try again.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchRisks();
    }, []);

    const stats = useMemo(() => ({
        high: risks.filter(r => r.severity?.toLowerCase() === 'high').length,
        medium: risks.filter(r => r.severity?.toLowerCase() === 'medium').length,
        low: risks.filter(r => r.severity?.toLowerCase() === 'low').length,
    }), [risks]);

    const filtered = useMemo(() => risks.filter(r => {
        if (severityFilter !== 'All' && (r.severity || '').toLowerCase() !== severityFilter.toLowerCase()) return false;
        if (search) {
            const s = search.toLowerCase();
            return r.title?.toLowerCase().includes(s) || r.description?.toLowerCase().includes(s);
        }
        return true;
    }), [risks, search, severityFilter]);

    const hasFilters = search || severityFilter !== 'All';
    const clearFilters = () => { setSearch(''); setSeverityFilter('All'); };

    return (
        <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Header */}
                <div className="page-header">
                    <div className="page-header-info">
                        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            Risks
                            {!isLoading && <span className="badge badge-neutral">{filtered.length}</span>}
                        </h1>
                        <p className="page-subtitle">
                            Potential issues and concerns automatically identified from your documents.
                        </p>
                    </div>
                    <button className="btn btn-secondary" onClick={() => navigate('/upload')}>
                        <UploadCloud size={16} /> Add Document
                    </button>
                </div>

                {/* Stats */}
                {!isLoading && risks.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                        {[
                            { label: 'High Severity', count: stats.high, badge: 'badge-danger' },
                            { label: 'Medium Severity', count: stats.medium, badge: 'badge-warning' },
                            { label: 'Low Severity', count: stats.low, badge: 'badge-primary' },
                        ].map(s => (
                            <div key={s.label} className="card" style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>{s.label}</span>
                                <span style={{ fontSize: '22px', fontWeight: 700 }} className={s.badge.replace('badge-', 'priority-').replace('danger', 'high').replace('warning', 'medium').replace('primary', 'low')}>
                                    {s.count}
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Filter bar */}
                <div className="filter-bar">
                    <div className="filter-search-wrap">
                        <Search size={16} color="var(--color-text-muted)" />
                        <input
                            id="risks-search"
                            className="filter-search-input"
                            placeholder="Search risks..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="filter-divider" />
                    <select id="severity-filter" className="select" value={severityFilter} onChange={e => setSeverityFilter(e.target.value)}>
                        <option value="All">All Severities</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                    </select>
                    {hasFilters && (
                        <button className="btn btn-secondary btn-sm" onClick={clearFilters}>
                            <X size={13} /> Clear
                        </button>
                    )}
                </div>

                {/* Content */}
                {isLoading ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '80px 0', color: 'var(--color-text-secondary)', fontSize: '14px' }}>
                        <Loader2 size={20} style={{ animation: 'spin 0.7s linear infinite', color: 'var(--color-primary)' }} />
                        Loading risks from all documents…
                    </div>
                ) : error ? (
                    <div className="card">
                        <div className="empty-state">
                            <div className="empty-state-icon" style={{ background: '#fef2f2', borderColor: '#fecaca' }}>
                                <AlertTriangle size={22} color="#dc2626" />
                            </div>
                            <p className="empty-state-title">Failed to load risks</p>
                            <p className="empty-state-text">{error}</p>
                            <button className="btn btn-secondary btn-sm" onClick={() => window.location.reload()}>Retry</button>
                        </div>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="card">
                        <div className="empty-state">
                            <div className="empty-state-icon">
                                <ShieldAlert size={24} />
                            </div>
                            <p className="empty-state-title">
                                {hasFilters ? 'No risks match your filters' : 'No risks identified yet'}
                            </p>
                            <p className="empty-state-text">
                                {hasFilters
                                    ? 'Try adjusting or clearing your filters.'
                                    : 'Upload and process a document to automatically identify potential risks and concerns.'}
                            </p>
                            {hasFilters
                                ? <button className="btn btn-secondary btn-sm" onClick={clearFilters}>Clear Filters</button>
                                : <button className="btn btn-primary" onClick={() => navigate('/upload')}><UploadCloud size={16} /> Upload Document</button>
                            }
                        </div>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                        {filtered.map(risk => {
                            const sev = getSeverityStyle(risk.severity);
                            return (
                                <div
                                    key={risk.id}
                                    className="card"
                                    onClick={() => setSelectedRisk(risk)}
                                    style={{ padding: '18px 20px', cursor: 'pointer', borderLeft: `3px solid ${sev.border}`, transition: 'box-shadow 0.15s', display: 'flex', flexDirection: 'column', gap: '10px' }}
                                    onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow-md)'}
                                    onMouseLeave={e => e.currentTarget.style.boxShadow = 'var(--shadow-sm)'}
                                >
                                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                                        <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)', lineHeight: 1.4, flex: 1 }}>
                                            {risk.title}
                                        </h3>
                                        <span className={`badge ${sev.badge}`} style={{ flexShrink: 0 }}>{sev.label}</span>
                                    </div>
                                    {risk.description && (
                                        <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                            {risk.description}
                                        </p>
                                    )}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                                        <FileText size={12} color="var(--color-primary)" />
                                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--color-primary)', fontWeight: 500 }} title={risk.documentName}>
                                            {risk.documentName || 'Unknown source'}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {selectedRisk && (
                <RiskDetailPanel risk={selectedRisk} onClose={() => setSelectedRisk(null)} navigate={navigate} />
            )}
        </>
    );
}
