import { Terminal } from 'lucide-react';



export default function Home() {
    return (
        <div className="flex-1 flex flex-col items-center justify-center p-10 text-center select-none">
            <div className="w-20 h-20 bg-slate-800 rounded-2xl flex items-center justify-center mb-6 shadow-2xl shadow-blue-900/20">
                <Terminal className="w-10 h-10 text-blue-500" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-3">Welcome to SQL Playground</h1>
            <p className="text-slate-400 max-w-md">
                Select a session from the sidebar or start a new one to begin practicing your SQL queries against the live database.
            </p>
        </div>
    );
}
