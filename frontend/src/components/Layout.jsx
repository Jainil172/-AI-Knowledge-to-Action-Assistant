import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Files,
  CheckCircle2,
  ShieldAlert,
  Zap,
  Menu,
  Hexagon,
  Search,
  Bell,
  X,
  Sparkles,
  Command
} from 'lucide-react';
import { useState, useEffect } from 'react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Documents', href: '/documents', icon: Files },
  { name: 'Tasks', href: '/tasks', icon: CheckCircle2 },
  { name: 'Risks', href: '/risks', icon: ShieldAlert },
  { name: 'Decisions', href: '/decisions', icon: Zap },
];

const pageMetadata = {
  '/': { title: 'Overview', subtitle: 'Project intelligence and vital metrics at a glance.' },
  '/documents': { title: 'Knowledge Base', subtitle: 'Upload and analyze project files with AI.' },
  '/tasks': { title: 'Action Items', subtitle: 'Automated task extraction and tracking.' },
  '/risks': { title: 'Risk Intelligence', subtitle: 'AI-identified vulnerabilities and timelines.' },
  '/decisions': { title: 'Key Decisions', subtitle: 'Architectural and project milestones extracted.' }
};

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const currentMeta = pageMetadata[location.pathname] || { title: 'Assistant', subtitle: 'AI Knowledge-to-Action' };

  // Close sidebar on route change for mobile
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[var(--color-background)] font-sans antialiased">

      {/* Mobile sidebar backdrop */}
      <AnimatePresence mode="wait">
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 lg:w-[280px] flex flex-col transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:flex shrink-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <div className="flex-1 flex flex-col glass-panel m-0 lg:m-4 lg:rounded-2xl border-x-0 lg:border-x border-y-0 lg:border-y h-full overflow-hidden">

          {/* Brand/Logo Area */}
          <div className="flex items-center h-20 px-6 shrink-0 relative">
            <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/10 to-transparent pointer-events-none" />
            <div className="flex items-center gap-3 relative z-10 w-full justify-between lg:justify-start">
              <div className="flex items-center gap-3">
                <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20">
                  <Hexagon className="h-6 w-6 text-white stroke-[1.5]" />
                </div>
                <span className="text-xl font-bold tracking-tight text-white">
                  VendorLens
                </span>
              </div>
              <button className="lg:hidden text-gray-400 hover:text-white" onClick={() => setSidebarOpen(false)}>
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className="relative group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 outline-none"
                >
                  {isActive && (
                    <motion.div
                      layoutId="active-nav"
                      className="absolute inset-0 bg-white/10 border border-white/10 rounded-xl shadow-[0_0_15px_rgba(255,255,255,0.05)]"
                      initial={false}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <div className="relative z-10 flex items-center w-full">
                    <Icon
                      className={`mr-3 shrink-0 h-5 w-5 transition-colors duration-300 ${isActive ? 'text-indigo-400' : 'text-zinc-500 group-hover:text-zinc-300'
                        }`}
                    />
                    <span className={`transition-colors duration-300 ${isActive ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-100'
                      }`}>
                      {item.name}
                    </span>
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* User Profile Section */}
          <div className="p-4 mt-auto">
            <div className="glass-panel p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer border border-white/5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 shrink-0 rounded-full bg-gradient-to-tr from-zinc-800 to-zinc-700 flex items-center justify-center border border-zinc-600">
                  <span className="font-semibold text-zinc-300 text-sm">JL</span>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium text-white truncate">Jainil AI</span>
                  <span className="text-xs text-zinc-500 truncate">Workspace Admin</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">

        {/* Top Header */}
        <header className="h-20 shrink-0 flex items-center justify-between px-6 lg:px-10 z-30 transition-all">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 text-zinc-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
            >
              <Menu className="h-6 w-6" />
            </button>

            <div className="flex flex-col justify-center h-full">
              <motion.h1
                key={`title-${location.pathname}`}
                initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                className="text-xl font-semibold text-white tracking-tight"
              >
                {currentMeta.title}
              </motion.h1>
              <motion.p
                key={`sub-${location.pathname}`}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
                className="text-sm text-zinc-500 hidden sm:block"
              >
                {currentMeta.subtitle}
              </motion.p>
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-5">
            {/* Search Component placeholder */}
            <div className="hidden md:flex items-center px-4 py-2 bg-zinc-900/50 border border-white/5 rounded-full hover:border-white/10 transition-colors cursor-text group w-64 ring-offset-background focus-within:ring-2 focus-within:ring-indigo-500/30">
              <Search className="h-4 w-4 text-zinc-500 mr-2 group-focus-within:text-indigo-400 transition-colors" />
              <input
                placeholder="Search resources..."
                className="bg-transparent border-none outline-none text-sm text-zinc-200 placeholder:text-zinc-600 w-full"
              />
              <div className="flex items-center gap-1 ml-2">
                <kbd className="hidden lg:inline-flex items-center justify-center rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-medium text-zinc-400 border border-zinc-700">
                  <Command className="h-3 w-3 mr-0.5" /> K
                </kbd>
              </div>
            </div>

            <button className="relative p-2.5 text-zinc-400 hover:text-white rounded-full hover:bg-white/5 transition-colors">
              <Bell className="h-5 w-5" />
              <span className="absolute top-2 right-2.5 h-2 w-2 rounded-full bg-indigo-500 border-2 border-zinc-950"></span>
            </button>

            <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white rounded-full transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 text-sm font-medium transform hover:-translate-y-0.5">
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">Ask AI</span>
            </button>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden relative scroll-smooth p-6 lg:p-10 pt-2 lg:pt-4">
          <div className="mx-auto max-w-6xl w-full h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
