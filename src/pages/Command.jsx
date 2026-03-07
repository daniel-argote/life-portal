const Command = ({ vault, logs }) => {
    return (
        <div className="space-y-10">
            <header>
                <h2 className="text-5xl font-black tracking-tighter dark:text-white">Command</h2>
                <p className="text-slate-400 font-bold mt-2 uppercase tracking-widest text-[10px]">Status: Operational</p>
            </header>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-indigo-600 p-10 rounded-[3rem] text-white shadow-2xl shadow-indigo-100 dark:shadow-none">
                    <div className="text-5xl font-black mb-2">{vault.length}</div>
                    <div className="font-bold opacity-60 uppercase tracking-widest text-xs">Knowledge Links</div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-10 rounded-[3rem] border border-slate-100 dark:border-slate-700 shadow-sm">
                    <div className="text-5xl font-black mb-2 dark:text-white">{logs.length}</div>
                    <div className="font-bold text-slate-300 uppercase tracking-widest text-xs">Activity Logs</div>
                </div>
            </div>
        </div>
    );
};

export default Command;