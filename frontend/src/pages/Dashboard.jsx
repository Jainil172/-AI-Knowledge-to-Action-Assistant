import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, FileText, CheckSquare, ShieldAlert, Lightbulb,
    UploadCloud, ArrowRight, Sparkles, TrendingUp
} from 'lucide-react';
import { documentsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

function StatCard({ label, value, icon: Icon, color, bg, link }) {
    return (
        <Link
            to={link}
            className="stat-card"
            style={{ textDecoration: 'none', transition: 'box-shadow 0.15s, border-color 0.15s', border: '1px solid var(--color-surface-border)' }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.borderColor = '#bfdbfe'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.borderColor = 'var(--color-surface-border)'; }}
        >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="stat-label">{label}</span>
                <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={18} color={color} />
                </div>
            </div>
            <div className="stat-value">{value ?? '—'}</div>
        </Link>
    );
}

function WorkflowSteps() {
    const steps = [
        { num: 1, label: 'Add Knowledge', desc: 'Upload a document or PDF' },
        { num: 2, label: 'AI Analyzes', desc: 'AI extracts key information' },
        { num: 3, label: 'Insights Found', desc: 'Tasks, risks and decisions appear' },
        { num: 4, label: 'Take Action', desc: 'Review and act on each insight' },
    ];

    return (
        <div className="card" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '4px' }}>How It Works</h2>
            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '24px' }}>
                Upload a document and let the AI do the heavy lifting.
            </p>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                {steps.map((step, idx) => (
                    <div key={step.num} style={{ display: 'flex', alignItems: 'flex-start', flex: '1', minWidth: '130px', gap: '0' }}>
                        <div className="workflow-step">
                            <div className="workflow-step-number">{step.num}</div>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>{step.label}</div>
                            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', lineHeight: 1.4 }}>{step.desc}</div>
                        </div>
                        {idx < steps.length - 1 && (
                            <div style={{ paddingTop: '10px', color: 'var(--color-text-muted)', flexShrink: 0 }}>
                                <ArrowRight size={16} />
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function Dashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [docs, setDocs] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [risks, setRisks] = useState([]);
    const [decisions, setDecisions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const docsRes = await documentsApi.list(1, 100);
                const allDocs = docsRes.data || [];
                setDocs(allDocs);

                let allTasks = [], allRisks = [], allDecisions = [];
                for (const doc of allDocs.slice(0, 10)) {
                    const [tr, rr, dr] = await Promise.all([
                        documentsApi.getTasks(doc.id, 1, 100).catch(() => ({ data: [] })),
                        documentsApi.getRisks(doc.id, 1, 100).catch(() => ({ data: [] })),
                        documentsApi.getDecisions(doc.id, 1, 100).catch(() => ({ data: [] })),
                    ]);
                    allTasks = [...allTasks, ...(tr.data || []).map(t => ({ ...t, documentName: doc.originalName }))];
                    allRisks = [...allRisks, ...(rr.data || []).map(r => ({ ...r, documentName: doc.originalName }))];
                    allDecisions = [...allDecisions, ...(dr.data || []).map(d => ({ ...d, documentName: doc.originalName }))];
                }
                setTasks(allTasks);
                setRisks(allRisks);
                setDecisions(allDecisions);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const highRisks = risks.filter(r => r.severity?.toLowerCase() === 'high').length;
    const recentDocs = [...docs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 4);

    const nextActionMessage = () => {
        if (docs.length === 0) return { msg: 'Start by uploading your first document to generate insights.', link: '/upload', cta: 'Upload a Document' };
        if (tasks.length === 0 && risks.length === 0 && decisions.length === 0) return { msg: `${docs.length} document(s) uploaded. Process them to extract actionable insights.`, link: '/documents', cta: 'View Documents' };
        if (highRisks > 0) return { msg: `${highRisks} high-severity risk${highRisks > 1 ? 's' : ''} identified. Review them promptly.`, link: '/risks', cta: 'View Risks' };
        if (tasks.length > 0) return { msg: `${tasks.length} task${tasks.length > 1 ? 's' : ''} found across your documents.`, link: '/tasks', cta: 'View Tasks' };
        return { msg: 'Your workspace is up to date. Upload more documents to discover new insights.', link: '/upload', cta: 'Add More' };
    };

    const next = nextActionMessage();

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Header */}
            <div>
                <h1 className="page-title">
                    {user?.name ? `Welcome, ${user.name.split(' ')[0]}` : 'Dashboard'}
                </h1>
                <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                    Turn documents and knowledge into clear, actionable insights.
                </p>
            </div>

            {/* Stats row */}
            {loading ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="stat-card" style={{ height: '100px', background: '#f1f5f9', animation: 'pulse 1.5s infinite' }} />
                    ))}
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
                    <StatCard label="Documents" value={docs.length} icon={FileText} color="#2563eb" bg="#eff6ff" link="/documents" />
                    <StatCard label="Tasks" value={tasks.length} icon={CheckSquare} color="#16a34a" bg="#f0fdf4" link="/tasks" />
                    <StatCard label="Risks" value={risks.length} icon={ShieldAlert} color="#dc2626" bg="#fef2f2" link="/risks" />
                    <StatCard label="Decisions" value={decisions.length} icon={Lightbulb} color="#9333ea" bg="#faf5ff" link="/decisions" />
                </div>
            )}

            {/* Next Action Banner */}
            <div className="card" style={{ padding: '20px 24px', borderLeft: '3px solid var(--color-primary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <TrendingUp size={20} color="var(--color-primary)" />
                        <div>
                            <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-primary)', marginBottom: '2px' }}>
                                Suggested Next Step
                            </div>
                            <p style={{ fontSize: '14px', color: 'var(--color-text-primary)' }}>{next.msg}</p>
                        </div>
                    </div>
                    <button className="btn btn-primary btn-sm" onClick={() => navigate(next.link)}>
                        {next.cta} <ArrowRight size={14} />
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {/* Recent Documents */}
                <div className="card">
                    <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--color-surface-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <h2 style={{ fontSize: '15px', fontWeight: 700 }}>Recent Knowledge</h2>
                        <Link to="/documents" style={{ fontSize: '13px', color: 'var(--color-primary)', fontWeight: 500 }}>View all</Link>
                    </div>
                    <div>
                        {loading ? (
                            <div style={{ padding: '40px', textAlign: 'center' }}>
                                <div className="spinner" style={{ margin: '0 auto' }} />
                            </div>
                        ) : recentDocs.length === 0 ? (
                            <div className="empty-state" style={{ padding: '36px 24px' }}>
                                <div className="empty-state-icon"><FileText size={22} /></div>
                                <p className="empty-state-title" style={{ fontSize: '14px' }}>No documents yet</p>
                                <p className="empty-state-text" style={{ fontSize: '13px', maxWidth: '240px' }}>Upload a document to get started</p>
                                <button className="btn btn-primary btn-sm" onClick={() => navigate('/upload')}>
                                    <UploadCloud size={14} /> Upload
                                </button>
                            </div>
                        ) : (
                            recentDocs.map(doc => (
                                <Link
                                    key={doc.id}
                                    to={`/documents/${doc.id}`}
                                    style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '14px 20px', borderBottom: '1px solid #f1f5f9', textDecoration: 'none', transition: 'background 0.1s' }}
                                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                                    onMouseLeave={e => e.currentTarget.style.background = ''}
                                >
                                    <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <FileText size={16} color="var(--color-primary)" />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {doc.originalName}
                                        </div>
                                        <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                                            {new Date(doc.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </div>
                                    </div>
                                    <ArrowRight size={16} color="var(--color-text-muted)" style={{ flexShrink: 0, marginTop: '2px' }} />
                                </Link>
                            ))
                        )}
                    </div>
                </div>

                {/* High-level Intelligence Summary */}
                <div className="card">
                    <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--color-surface-border)' }}>
                        <h2 style={{ fontSize: '15px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Sparkles size={15} color="var(--color-primary)" /> AI Summary
                        </h2>
                    </div>
                    {loading ? (
                        <div style={{ padding: '40px', textAlign: 'center' }}>
                            <div className="spinner" style={{ margin: '0 auto' }} />
                        </div>
                    ) : tasks.length + risks.length + decisions.length === 0 ? (
                        <div className="empty-state" style={{ padding: '36px 24px' }}>
                            <div className="empty-state-icon"><Sparkles size={22} /></div>
                            <p className="empty-state-title" style={{ fontSize: '14px' }}>No insights extracted yet</p>
                            <p className="empty-state-text" style={{ fontSize: '13px', maxWidth: '240px' }}>
                                Process a document to see tasks, risks, and decisions here.
                            </p>
                        </div>
                    ) : (
                        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {[
                                { label: 'High-priority tasks', value: tasks.filter(t => t.priority?.toLowerCase() === 'high').length, link: '/tasks', color: '#16a34a' },
                                { label: 'High-severity risks', value: highRisks, link: '/risks', color: '#dc2626' },
                                { label: 'Key decisions logged', value: decisions.length, link: '/decisions', color: '#9333ea' },
                            ].map(item => (
                                <Link
                                    key={item.label}
                                    to={item.link}
                                    style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        padding: '12px 16px', borderRadius: 'var(--radius-md)',
                                        background: 'var(--color-surface-raised)', border: '1px solid var(--color-surface-border)',
                                        textDecoration: 'none', transition: 'border-color 0.15s',
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.borderColor = '#bfdbfe'}
                                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-surface-border)'}
                                >
                                    <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>{item.label}</span>
                                    <span style={{ fontSize: '20px', fontWeight: 700, color: item.color }}>{item.value}</span>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Workflow Steps */}
            {docs.length === 0 && <WorkflowSteps />}
        </div>
    );
}
