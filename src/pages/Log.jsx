import Icon from '../components/Icon';
import PageContainer from '../components/PageContainer';

const Log = ({ logs, input, setInput, addLog, deleteItem }) => {
    return (
        <PageContainer className="max-w-2xl mx-auto">
            <form onSubmit={(e) => { e.preventDefault(); addLog(); }} className="relative">
                <input value={input} onChange={e => setInput(e.target.value)} className="w-full pl-8 pr-24 py-6 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[2.5rem] outline-none shadow-xl shadow-slate-200/50 dark:shadow-none font-bold text-lg dark:text-white" placeholder="New update..." />
                <button type="submit" aria-label="Add Log Entry" className="absolute right-3 top-3 bottom-3 aspect-square bg-slate-900 text-white rounded-[1.8rem] flex items-center justify-center hover:bg-black transition-all active:scale-95"><Icon name="Plus" size={28} /></button>
            </form>
            <div className="space-y-6 relative before:absolute before:left-4 before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-100 dark:before:bg-slate-800">
                {logs.map(l => (
                    <div key={l.id} className="group relative pl-12">
                        <div className="absolute left-0 top-6 w-8 h-8 rounded-full bg-white dark:bg-slate-800 border-4 border-[#F8FAFC] dark:border-slate-900 shadow-sm flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-indigo-600"></div>
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-700 flex justify-between items-center group shadow-sm transition-all hover:shadow-md">
                            <div>
                                <p className="font-bold text-slate-700 dark:text-slate-200 text-lg leading-tight">{l.content}</p>
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2 block">{new Date(l.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <button onClick={() => deleteItem('logs', l.id)} className="opacity-0 group-hover:opacity-100 text-slate-200 hover:text-red-500 transition-all"><Icon name="Trash2" size={16} /></button>
                        </div>
                    </div>
                ))}
            </div>
        </PageContainer>
    );
};

export default Log;