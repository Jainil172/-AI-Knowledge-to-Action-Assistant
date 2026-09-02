import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    CheckSquare, Search, X, Calendar, User, FileText,
    ArrowUp, Minus, ArrowDown, Circle, CheckCircle2, Clock,
    Loader2, AlertTriangle, UploadCloud
} from 'lucide-react';
import { documentsApi } from '../services/api';

const getPriorityStyle = (priority) => {
    switch (priority?.toLowerCase()) {
        case 'high': return { label: 'High', badge: 'badge-danger', dot: '#dc2626' };
        case 'medium': return { label: 'Medium', badge: 'badge-warning', dot: '#d97706' };
        case 'low': return { label: 'Low', badge: 'badge-primary', dot: '#2563eb' };
        default: return { label: '—', badge: 'badge-neutral', dot: '#94a3b8' };
    }
};

const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
        case 'completed': return { label: 'Completed', badge: 'badge-success' };
        case 'in progress': return { label: 'In Progress', badge: 'badge-info' };
        default: return { label: 'Pending', badge: 'badge-neutral' };
    }
};

function TaskDetailPanel({ task, onClose, navigate }) {
    if (!task) return null;
    const priority = getPriorityStyle(task.priority);
    const status = getStatusStyle(task.status);

    return (
        <div className="detail-panel-overlay" onClick={onClose} aria-modal="true" role="dialog" aria-label="Task Details">
            <div className="detail-panel" onClick={e => e.stopPropagation()}>
                <div className="detail-panel-header">
                    <div>
                        <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '2px' }}>
                            Task Details
                        </div>
                        <h2 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--color-text-primary)', lineHeight: 1.3 }}>
                            {task.title}
                        </h2>
                    </div>
                    <button className="btn-icon" onClick={onClose} aria-label="Close panel"><X size={18} /></button>
                </div>

                <div className="detail-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Badges */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <span className={`badge ${status.badge}`}>{status.label}</span>
                        <span className={`badge ${priority.badge}`}>{priority.label} Priority</span>
                    </div>

                    {/* Description */}
                    {task.description && (
                        <div>
                            <div className="section-label">Description</div>
                            <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.6, background: 'var(--color-surface-raised)', borderRadius: 'var(--radius-md)', padding: '12px 14px', border: '1px solid var(--color-surface-border)' }}>
                                {task.description}
                            </p>
                        </div>
                    )}

                    {/* Properties table */}
                    <div>
                        <div className="section-label">Properties</div>
                        <div style={{ display: 'flex', flexDirection: 'column', fontSize: '14px' }}>
                            {[
                                { label: 'Assignee', value: task.owner || '—', icon: <User size={14} /> },
                                { label: 'Deadline', value: task.deadline || '—', icon: <Calendar size={14} /> },
                                { label: 'Extracted', value: new Date(task.createdAt).toLocaleDateString(), icon: <Clock size={14} /> },
                            ].map(row => (
                                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                                    <span style={{ color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>{row.icon} {row.label}</span>
                                    <span style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>{row.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Source evidence */}
                    {task.sourceEvidence && (
                        <div>
                            <div className="section-label">Source Evidence</div>
                            <div className="evidence-box">"{task.sourceEvidence}"</div>
                        </div>
                    )}

                    {/* Source document */}
                    <div>
                        <div className="section-label">Source Document</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}
                            onClick={() => { navigate('/documents/' + task.documentId); onClose(); }}>
                            <FileText size={18} color="var(--color-primary)" />
                            <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-primary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {task.documentName || 'View source document'}
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

export default function Tasks() {
    const navigate = useNavigate();
    const [tasks, setTasks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [priorityFilter, setPriorityFilter] = useState('All');
    const [selectedTask, setSelectedTask] = useState(null);

    useEffect(() => {
        const fetchTasks = async () => {
            try {
                setIsLoading(true);
                const docsRes = await documentsApi.list(1, 100);
                const allDocs = docsRes.data || [];
                let allTasks = [];
                for (const doc of allDocs) {
                    const tRes = await documentsApi.getTasks(doc.id, 1, 100);
                    const docTasks = (tRes.data || []).map(t => ({ ...t, documentName: doc.originalName }));
                    allTasks = [...allTasks, ...docTasks];
                }
                allTasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                setTasks(allTasks);
            } catch (err) {
                setError('Failed to load tasks. Please try again.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchTasks();
    }, []);

    const filtered = useMemo(() => tasks.filter(t => {
        if (priorityFilter !== 'All' && (t.priority || '').toLowerCase() !== priorityFilter.toLowerCase()) return false;
        if (search) {
            const s = search.toLowerCase();
            return t.title?.toLowerCase().includes(s) || t.description?.toLowerCase().includes(s);
        }
        return true;
    }), [tasks, search, priorityFilter]);

    const hasFilters = search || priorityFilter !== 'All';
    const clearFilters = () => { setSearch(''); setPriorityFilter('All'); };

    return (
        <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Header */}
                <div className="page-header">
                    <div className="page-header-info">
                        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            Tasks
                            {!isLoading && <span className="badge badge-neutral">{filtered.length}</span>}
                        </h1>
                        <p className="page-subtitle">
                            Actionable items automatically identified from your uploaded documents by AI.
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
                            id="tasks-search"
                            className="filter-search-input"
                            placeholder="Search tasks..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="filter-divider" />
                    <select id="priority-filter" className="select" value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
                        <option value="All">All Priorities</option>
                        <option value="high">High Priority</option>
                        <option value="medium">Medium Priority</option>
                        <option value="low">Low Priority</option>
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
                        Loading tasks from all documents…
                    </div>
                ) : error ? (
                    <div className="card" style={{ padding: '0' }}>
                        <div className="empty-state">
                            <div className="empty-state-icon" style={{ background: '#fef2f2', borderColor: '#fecaca' }}>
                                <AlertTriangle size={22} color="#dc2626" />
                            </div>
                            <p className="empty-state-title">Failed to load tasks</p>
                            <p className="empty-state-text">{error}</p>
                            <button className="btn btn-secondary btn-sm" onClick={() => window.location.reload()}>Retry</button>
                        </div>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="card" style={{ padding: '0' }}>
                        <div className="empty-state">
                            <div className="empty-state-icon">
                                <CheckSquare size={24} />
                            </div>
                            <p className="empty-state-title">
                                {hasFilters ? 'No tasks match your filters' : 'No tasks identified yet'}
                            </p>
                            <p className="empty-state-text">
                                {hasFilters
                                    ? 'Try adjusting or clearing your filters.'
                                    : 'Upload and process a document to automatically identify actionable tasks.'}
                            </p>
                            {hasFilters
                                ? <button className="btn btn-secondary btn-sm" onClick={clearFilters}>Clear Filters</button>
                                : <button className="btn btn-primary" onClick={() => navigate('/upload')}><UploadCloud size={16} /> Upload Document</button>
                            }
                        </div>
                    </div>
                ) : (
                    <div className="card" style={{ overflow: 'hidden' }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Task</th>
                                    <th>Priority</th>
                                    <th>Status</th>
                                    <th>Assignee</th>
                                    <th>Deadline</th>
                                    <th>Source</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(task => {
                                    const p = getPriorityStyle(task.priority);
                                    const s = getStatusStyle(task.status);
                                    return (
                                        <tr key={task.id} onClick={() => setSelectedTask(task)} style={{ cursor: 'pointer' }}>
                                            <td>
                                                <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '2px', maxWidth: '300px' }}>
                                                    {task.title}
                                                </div>
                                                {task.description && (
                                                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '300px' }}>
                                                        {task.description}
                                                    </div>
                                                )}
                                            </td>
                                            <td>
                                                <span className={`badge ${p.badge}`}>{p.label}</span>
                                            </td>
                                            <td>
                                                <span className={`badge ${s.badge}`}>{s.label}</span>
                                            </td>
                                            <td style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>
                                                {task.owner || <span style={{ color: 'var(--color-text-muted)' }}>—</span>}
                                            </td>
                                            <td style={{ color: 'var(--color-text-secondary)', fontSize: '13px', whiteSpace: 'nowrap' }}>
                                                {task.deadline || <span style={{ color: 'var(--color-text-muted)' }}>—</span>}
                                            </td>
                                            <td style={{ maxWidth: '180px' }}>
                                                <span style={{ fontSize: '12px', color: 'var(--color-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }} title={task.documentName}>
                                                    {task.documentName || '—'}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {selectedTask && (
                <TaskDetailPanel task={selectedTask} onClose={() => setSelectedTask(null)} navigate={navigate} />
            )}
        </>
    );
}
