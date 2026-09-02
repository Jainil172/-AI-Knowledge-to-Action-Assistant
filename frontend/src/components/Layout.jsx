import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, FileText, CheckSquare, ShieldAlert,
    Lightbulb, LogOut, UploadCloud, Menu, X, Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/documents', label: 'Knowledge', icon: FileText },
    { to: '/upload', label: 'Add Document', icon: UploadCloud },
    { to: '/tasks', label: 'Tasks', icon: CheckSquare },
    { to: '/risks', label: 'Risks', icon: ShieldAlert },
    { to: '/decisions', label: 'Decisions', icon: Lightbulb },
];

export default function Layout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const SidebarContent = () => (
        <>
            {/* Logo */}
            <div className="sidebar-logo">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                        width: '34px', height: '34px', borderRadius: '9px',
                        background: 'var(--color-primary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0
                    }}>
                        <Sparkles size={18} color="white" />
                    </div>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--color-text-primary)', lineHeight: 1.2 }}>
                            Knowledge
                        </div>
                        <div style={{ fontWeight: 600, fontSize: '11px', color: 'var(--color-primary)', lineHeight: 1.2 }}>
                            to Action
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="sidebar-nav">
                <div className="sidebar-section-label">Menu</div>
                {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
                    <NavLink
                        key={to}
                        to={to}
                        end={to === '/'}
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                        onClick={() => setMobileOpen(false)}
                    >
                        <Icon size={17} className="nav-icon" />
                        <span className="nav-label">{label}</span>
                    </NavLink>
                ))}
            </nav>

            {/* Footer: User info + logout */}
            <div className="sidebar-footer">
                {user && (
                    <div style={{ marginBottom: '8px', padding: '10px 12px', background: 'var(--color-surface-raised)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-surface-border)' }}>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {user.name || user.email}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {user.email}
                        </div>
                    </div>
                )}
                <button
                    onClick={handleLogout}
                    className="nav-item"
                    style={{ width: '100%', border: 'none', background: 'none', textAlign: 'left', color: '#ef4444' }}
                >
                    <LogOut size={17} style={{ flexShrink: 0 }} />
                    <span>Sign Out</span>
                </button>
            </div>
        </>
    );

    return (
        <div className="app-layout">
            {/* Desktop sidebar */}
            <aside className="sidebar" aria-label="Main navigation">
                <SidebarContent />
            </aside>

            {/* Mobile sidebar */}
            {mobileOpen && (
                <div className="mobile-sidebar-overlay" onClick={() => setMobileOpen(false)} />
            )}
            <aside
                className={`sidebar ${mobileOpen ? 'open' : ''}`}
                style={{ display: 'none' }}
                aria-label="Mobile navigation"
            >
                <SidebarContent />
            </aside>

            {/* Main */}
            <div className="main-content">
                {/* Mobile topbar */}
                <header
                    className="topbar"
                    style={{ display: 'none' }}
                    id="mobile-topbar"
                >
                    <button
                        onClick={() => setMobileOpen(v => !v)}
                        style={{ background: 'none', border: 'none', padding: '4px', color: 'var(--color-text-secondary)', display: 'flex' }}
                        aria-label="Toggle menu"
                    >
                        {mobileOpen ? <X size={22} /> : <Menu size={22} />}
                    </button>
                    <span style={{ fontWeight: 700, fontSize: '15px' }}>Knowledge to Action</span>
                </header>

                <main className="page-content page-enter">
                    <Outlet />
                </main>
            </div>

            {/* Mobile styles injected via style tag */}
            <style>{`
        @media (max-width: 768px) {
          #mobile-topbar { display: flex !important; }
          .sidebar { display: flex !important; }
        }
        @media (min-width: 769px) {
          .sidebar { display: flex !important; transform: none !important; }
          #mobile-topbar { display: none !important; }
        }
      `}</style>
        </div>
    );
}
