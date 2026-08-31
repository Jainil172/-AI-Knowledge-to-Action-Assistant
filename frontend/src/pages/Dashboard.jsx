import { ArrowUpRight, FileText, CheckSquare, AlertTriangle, Lightbulb } from 'lucide-react';

const stats = [
  { name: 'Total Documents', value: '0', icon: FileText, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  { name: 'Active Tasks', value: '0', icon: CheckSquare, color: 'text-green-400', bg: 'bg-green-500/10' },
  { name: 'Identified Risks', value: '0', icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  { name: 'Key Decisions', value: '0', icon: Lightbulb, color: 'text-purple-400', bg: 'bg-purple-500/10' },
];

export default function Dashboard() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out fill-mode-both">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Dashboard</h1>
        <p className="mt-2 text-lg text-gray-400">Welcome to your AI Knowledge-to-Action assistant overview.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.name}
              className="glass-panel p-6 flex flex-col hover:border-white/20 transition-colors duration-300 relative group overflow-hidden"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/5 group-hover:scale-150 transition-transform duration-700 blur-2xl"></div>
              <div className="flex items-center gap-4 relative z-10">
                <div className={`p-3 rounded-2xl ${stat.bg} shadow-inner`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-400 truncate">{stat.name}</p>
                  <p className="mt-1 text-3xl font-semibold tracking-tight text-white">{stat.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-panel p-6 min-h-[400px] flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Recent Documents</h2>
            <button className="text-sm font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors">
              View all <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border border-dashed border-white/10 rounded-xl bg-white/5">
            <FileText className="h-10 w-10 text-gray-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-300">No documents yet</h3>
            <p className="mt-2 text-sm text-gray-500 max-w-sm">
              Upload your first project document to let the AI extract tasks, risks, and insights automatically.
            </p>
            <button className="mt-6 px-6 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium transition-colors shadow-lg shadow-indigo-500/25">
              Upload Document
            </button>
          </div>
        </div>

        <div className="glass-panel p-6 min-h-[400px] flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Action Items</h2>
            <button className="text-sm font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors">
              View all <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border border-dashed border-white/10 rounded-xl bg-white/5">
            <CheckSquare className="h-10 w-10 text-gray-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-300">All caught up</h3>
            <p className="mt-2 text-sm text-gray-500 max-w-sm">
              No pending tasks have been extracted. Upload more informative documents to populate this feed.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
