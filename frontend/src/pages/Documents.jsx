import { UploadCloud, Search, Filter } from 'lucide-react';

export default function Documents() {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out fill-mode-both">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white">Documents</h1>
                    <p className="mt-1 text-gray-400">Manage and analyze your project files.</p>
                </div>
                <button className="flex items-center gap-2 px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium transition-colors shadow-lg shadow-indigo-500/25 shrink-0 w-fit">
                    <UploadCloud className="h-5 w-5" />
                    Upload PDF
                </button>
            </div>

            <div className="glass-panel p-4 flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search documents by name or content..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all font-medium"
                    />
                </div>
                <button className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 hover:text-white rounded-lg font-medium transition-colors shrink-0">
                    <Filter className="h-4 w-4" />
                    Filters
                </button>
            </div>

            <div className="glass-panel flex flex-col items-center justify-center min-h-[500px] text-center p-8">
                <div className="h-20 w-20 rounded-full bg-indigo-500/10 flex items-center justify-center mb-6">
                    <UploadCloud className="h-10 w-10 text-indigo-400" />
                </div>
                <h3 className="text-xl font-medium text-white mb-2">No documents found</h3>
                <p className="max-w-md text-gray-400 mb-8 leading-relaxed">
                    Start by uploading your first project document (PDF). Our AI will automatically extract intelligence and insights.
                </p>

                <div className="w-full max-w-xl mx-auto border-2 border-dashed border-white/10 rounded-2xl p-12 bg-white/5 hover:bg-white/10 hover:border-indigo-500/50 transition-all cursor-pointer group">
                    <div className="flex flex-col items-center">
                        <p className="text-sm font-medium text-gray-300 group-hover:text-white mb-1">
                            Click to browse or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">
                            PDF up to 10MB
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
