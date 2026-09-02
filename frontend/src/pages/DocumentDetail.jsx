import { useState, useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FileText, Calendar, CheckSquare, ShieldAlert,
  Lightbulb, ArrowLeft, Sparkles, MessageSquare,
  Send, User, AlertCircle, Bookmark, FileSearch, Loader2, AlertTriangle
} from 'lucide-react';
import { documentsApi, ragApi } from '../services/api';

const SUGGESTED_QUESTIONS = [
  "What are the main actionable tasks?",
  "What are the highest priority risks?",
  "What key decisions were made?",
  "Are there any important deadlines?",
];

export default function DocumentDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    const fetchDoc = async () => {
      try {
        setIsLoading(true);
        const res = await documentsApi.get(id);
        setData(res.data);
      } catch {
        setError('Failed to load document details.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchDoc();
  }, [id]);

  const handleSend = async (textOverride) => {
    const query = textOverride || inputVal.trim();
    if (!query || isTyping) return;

    const userMsg = {
      id: Date.now(), role: 'user', content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, userMsg]);
    setInputVal('');
    setIsTyping(true);

    try {
      const askResponse = await ragApi.ask(id, query);
      setMessages(prev => [...prev, {
        id: Date.now() + 1, role: 'ai', content: askResponse.answer,
        sources: askResponse.sources || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        id: Date.now() + 1, role: 'ai', isError: true,
        content: err.message || 'Unable to generate an answer. Please try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setIsTyping(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', gap: '12px' }}>
        <div className="spinner" style={{ width: '28px', height: '28px' }} />
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>Loading document insights…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', gap: '12px' }}>
        <div className="empty-state-icon" style={{ background: '#fef2f2', borderColor: '#fecaca' }}>
          <AlertTriangle size={24} color="#dc2626" />
        </div>
        <p style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>{error || 'Document not found'}</p>
        <Link to="/documents" className="btn btn-secondary btn-sm">← Back to Documents</Link>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'risks', label: `Risks (${data.risks?.length || 0})` },
    { id: 'tasks', label: `Tasks (${data.tasks?.length || 0})` },
    { id: 'decisions', label: `Decisions (${data.decisions?.length || 0})` },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Back nav */}
      <Link to="/documents" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: 'var(--color-text-secondary)', fontWeight: 500, width: 'fit-content' }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--color-text-primary)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-secondary)'}>
        <ArrowLeft size={16} />Back to Knowledge Base
      </Link>

      {/* Document header card */}
      <div className="card" style={{ padding: '24px 28px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-lg)', background: '#eff6ff', border: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <FileText size={22} color="var(--color-primary)" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '4px' }}>
              <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>
                {data.originalName}
              </h1>
              <span className="badge badge-success">{data.status || 'Processed'}</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', fontSize: '13px', color: 'var(--color-text-muted)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={13} />
                {new Date(data.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
              <span>{((data.fileSize || 0) / (1024 * 1024)).toFixed(2)} MB</span>
              {data.pageCount > 0 && <span>{data.pageCount} pages</span>}
            </div>
          </div>
          {/* Quick stats */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', flexShrink: 0 }}>
            {[
              { val: data.tasks?.length || 0, label: 'Tasks', color: '#16a34a', bg: '#f0fdf4' },
              { val: data.risks?.length || 0, label: 'Risks', color: '#dc2626', bg: '#fef2f2' },
              { val: data.decisions?.length || 0, label: 'Decisions', color: '#9333ea', bg: '#faf5ff' },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center', padding: '8px 14px', background: s.bg, borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '18px', fontWeight: 700, color: s.color }}>{s.val}</div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: s.color, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {data.summary && (
          <div style={{ marginTop: '18px', padding: '14px 16px', background: 'var(--color-surface-raised)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-surface-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-primary)', marginBottom: '6px' }}>
              <Sparkles size={13} /> AI Summary
            </div>
            <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
              {data.summary}
            </p>
          </div>
        )}
      </div>

      {/* Two-column workspace */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '20px', alignItems: 'start' }}>
        {/* Left: Intelligence tabs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: '0', borderBottom: '1px solid var(--color-surface-border)', background: 'white', borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0', border: '1px solid var(--color-surface-border)', borderBottomColor: 'transparent' }}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '12px 18px', fontSize: '14px', fontWeight: 600,
                  border: 'none', background: 'none', cursor: 'pointer',
                  borderBottom: activeTab === tab.id ? '2px solid var(--color-primary)' : '2px solid transparent',
                  color: activeTab === tab.id ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  transition: 'color 0.15s',
                  whiteSpace: 'nowrap',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="card" style={{ borderRadius: '0 0 var(--radius-lg) var(--radius-lg)', padding: '20px' }}>
            {activeTab === 'overview' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[
                  {
                    icon: <CheckSquare size={16} color="#16a34a" />, label: 'Tasks', items: data.tasks || [], render: task => (
                      <div key={task.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px 12px', background: '#f0fdf4', borderRadius: 'var(--radius-md)', border: '1px solid #bbf7d0' }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#16a34a', flexShrink: 0, marginTop: '6px' }} />
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)' }}>{task.title}</div>
                          {task.priority && <span className="badge badge-success" style={{ marginTop: '4px' }}>{task.priority}</span>}
                        </div>
                      </div>
                    )
                  },
                  {
                    icon: <ShieldAlert size={16} color="#dc2626" />, label: 'Risks', items: data.risks || [], render: risk => (
                      <div key={risk.id} style={{ padding: '10px 12px', background: '#fef2f2', borderRadius: 'var(--radius-md)', border: '1px solid #fecaca' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span className="badge badge-danger">{risk.severity}</span>
                        </div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)' }}>{risk.title}</div>
                        {risk.description && <div style={{ fontSize: '13px', color: '#991b1b', marginTop: '4px' }}>{risk.description}</div>}
                      </div>
                    )
                  },
                  {
                    icon: <Lightbulb size={16} color="#9333ea" />, label: 'Decisions', items: data.decisions || [], render: dec => (
                      <div key={dec.id} style={{ padding: '10px 12px', background: '#faf5ff', borderRadius: 'var(--radius-md)', border: '1px solid #d8b4fe', borderLeft: '3px solid #9333ea' }}>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)' }}>{dec.title}</div>
                        {dec.description && <div style={{ fontSize: '13px', color: '#7e22ce', marginTop: '4px' }}>{dec.description}</div>}
                      </div>
                    )
                  },
                ].map(({ icon, label, items, render }) => items.length > 0 && (
                  <div key={label}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '13px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '10px' }}>
                      {icon} {label} ({items.length})
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {items.map(render)}
                    </div>
                  </div>
                ))}
                {!data.tasks?.length && !data.risks?.length && !data.decisions?.length && (
                  <div className="empty-state" style={{ padding: '40px 20px' }}>
                    <div className="empty-state-icon"><Sparkles size={22} /></div>
                    <p className="empty-state-title">No insights extracted</p>
                    <p className="empty-state-text">This document may not have contained enough analyzable content.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'tasks' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(data.tasks || []).length === 0
                  ? <div className="empty-state" style={{ padding: '40px 20px' }}><div className="empty-state-icon"><CheckSquare size={22} /></div><p className="empty-state-title">No tasks found</p></div>
                  : (data.tasks || []).map(task => (
                    <div key={task.id} style={{ padding: '12px 14px', background: 'var(--color-surface-raised)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-surface-border)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '4px' }}>{task.title}</div>
                        {task.description && <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>{task.description}</div>}
                        <div style={{ display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
                          {task.owner && <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>👤 {task.owner}</span>}
                          {task.deadline && <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>📅 {task.deadline}</span>}
                        </div>
                      </div>
                      {task.priority && (
                        <span className={`badge ${task.priority?.toLowerCase() === 'high' ? 'badge-danger' : task.priority?.toLowerCase() === 'medium' ? 'badge-warning' : 'badge-primary'}`} style={{ flexShrink: 0 }}>
                          {task.priority}
                        </span>
                      )}
                    </div>
                  ))
                }
              </div>
            )}

            {activeTab === 'risks' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(data.risks || []).length === 0
                  ? <div className="empty-state" style={{ padding: '40px 20px' }}><div className="empty-state-icon"><ShieldAlert size={22} /></div><p className="empty-state-title">No risks identified</p></div>
                  : (data.risks || []).map(risk => (
                    <div key={risk.id} style={{ padding: '12px 14px', background: '#fef2f2', borderRadius: 'var(--radius-md)', border: '1px solid #fecaca', borderLeft: '3px solid #dc2626' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <span className="badge badge-danger">{risk.severity} Severity</span>
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '4px' }}>{risk.title}</div>
                      {risk.description && <div style={{ fontSize: '13px', color: '#991b1b' }}>{risk.description}</div>}
                    </div>
                  ))
                }
              </div>
            )}

            {activeTab === 'decisions' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(data.decisions || []).length === 0
                  ? <div className="empty-state" style={{ padding: '40px 20px' }}><div className="empty-state-icon"><Lightbulb size={22} /></div><p className="empty-state-title">No decisions logged</p></div>
                  : (data.decisions || []).map(dec => (
                    <div key={dec.id} style={{ padding: '12px 14px', background: '#faf5ff', borderRadius: 'var(--radius-md)', border: '1px solid #d8b4fe', borderLeft: '3px solid #9333ea' }}>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '4px' }}>{dec.title}</div>
                      {dec.description && <div style={{ fontSize: '13px', color: '#7e22ce' }}>{dec.description}</div>}
                    </div>
                  ))
                }
              </div>
            )}
          </div>
        </div>

        {/* Right: Ask AI panel */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '600px', overflow: 'hidden' }}>
          {/* AI header */}
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--color-surface-border)', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Sparkles size={15} color="white" />
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-primary)' }}>Ask AI</div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Ask questions about this document</div>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {messages.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '14px', textAlign: 'center' }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#eff6ff', border: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MessageSquare size={22} color="var(--color-primary)" />
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>Ask about this document</div>
                  <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Get answers based on the document content.</div>
                </div>
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--color-text-muted)', marginBottom: '2px' }}>Suggested questions</div>
                  {SUGGESTED_QUESTIONS.map((q, i) => (
                    <button key={i} onClick={() => handleSend(q)}
                      style={{ padding: '9px 12px', background: 'var(--color-surface-raised)', border: '1px solid var(--color-surface-border)', borderRadius: 'var(--radius-md)', fontSize: '13px', color: 'var(--color-text-secondary)', cursor: 'pointer', textAlign: 'left', transition: 'border-color 0.15s, color 0.15s' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.color = 'var(--color-primary)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-surface-border)'; e.currentTarget.style.color = 'var(--color-text-secondary)'; }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map(msg => (
                <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row', maxWidth: '88%' }}>
                    <div style={{ width: 26, height: 26, borderRadius: '50%', background: msg.role === 'user' ? '#e2e8f0' : msg.isError ? '#fef2f2' : '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {msg.role === 'user' ? <User size={13} color="#64748b" /> : msg.isError ? <AlertCircle size={13} color="#dc2626" /> : <Sparkles size={13} color="var(--color-primary)" />}
                    </div>
                    <div>
                      <div className={msg.role === 'user' ? 'chat-bubble-user' : msg.isError ? 'chat-bubble-error' : 'chat-bubble-ai'}>
                        {msg.content}
                      </div>
                      {msg.role === 'ai' && !msg.isError && msg.sources?.length > 0 && (
                        <div style={{ marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Bookmark size={10} /> Sources
                          </div>
                          {msg.sources.map((src, idx) => (
                            <div key={idx} style={{ padding: '6px 10px', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 'var(--radius-sm)', fontSize: '12px', color: '#0c4a6e', display: 'flex', gap: '6px' }}>
                              <FileSearch size={12} style={{ flexShrink: 0, marginTop: '1px' }} />
                              <span style={{ fontStyle: 'italic' }}>"{src.text?.slice(0, 100)}{src.text?.length > 100 ? '…' : ''}"</span>
                            </div>
                          ))}
                        </div>
                      )}
                      <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '3px', textAlign: msg.role === 'user' ? 'right' : 'left' }}>{msg.timestamp}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
            {isTyping && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Sparkles size={13} color="var(--color-primary)" />
                </div>
                <div className="chat-bubble-ai" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 14px' }}>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <div className="typing-dot" />
                    <div className="typing-dot" />
                    <div className="typing-dot" />
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Analyzing…</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '12px', borderTop: '1px solid var(--color-surface-border)', flexShrink: 0 }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', border: '1px solid var(--color-surface-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden', transition: 'border-color 0.15s', background: 'var(--color-surface)' }}
              onFocusCapture={e => e.currentTarget.style.borderColor = 'var(--color-primary)'}
              onBlurCapture={e => e.currentTarget.style.borderColor = 'var(--color-surface-border)'}>
              <textarea
                ref={inputRef}
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="Ask a question about this document…"
                rows={1}
                style={{ flex: 1, border: 'none', outline: 'none', resize: 'none', padding: '10px 12px', fontSize: '14px', color: 'var(--color-text-primary)', background: 'transparent', lineHeight: 1.5, maxHeight: '100px', minHeight: '40px' }}
              />
              <button
                onClick={() => handleSend()}
                disabled={!inputVal.trim() || isTyping}
                style={{ padding: '8px 10px', marginBottom: '4px', marginRight: '4px', background: inputVal.trim() && !isTyping ? 'var(--color-primary)' : 'var(--color-surface-border)', borderRadius: 'var(--radius-sm)', border: 'none', cursor: inputVal.trim() && !isTyping ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s', flexShrink: 0 }}
                aria-label="Send message"
              >
                <Send size={15} color={inputVal.trim() && !isTyping ? 'white' : 'var(--color-text-muted)'} />
              </button>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '5px', paddingLeft: '2px' }}>
              Press Enter to send · Shift+Enter for new line
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
