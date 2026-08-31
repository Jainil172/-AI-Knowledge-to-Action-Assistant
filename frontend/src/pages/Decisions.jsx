import { Lightbulb, Search, Filter } from 'lucide-react';

export default function Decisions() {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out fill-mode-both">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Key Decisions</h1>
                <p className="text-gray-400">Important decisions extracted from your project knowledge base.</p>
            </div>

            <div className="glass-panel p-4 flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search decisions..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500/50 transition-all font-medium"
                    />
                </div>
                <button className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 rounded-lg transition-colors shrink-0">
                    <Filter className="h-4 w-4" />
                    Date: Newest
                </button>
            </div>

            <div className="glass-panel min-h-[400px] flex items-center justify-center p-8">
                <div className="text-center max-w-sm">
                    <Lightbulb className="h-12 w-12 text-gray-500 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium text-white mb-2">No decisions logged</h3>
                    <p className="text-sm text-gray-400">
                        The AI will extract formal decisions or agreements from your uploaded documents to track them here.
                    </p>
                </div>
            </div>
        </div>
    );
}
