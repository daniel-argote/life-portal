import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import Icon from '../components/Icon';
import PageContainer from '../components/PageContainer';
import { format, differenceInDays, parseISO } from 'date-fns';

const ActionChores = ({ user, notify }) => {
    const [chores, setChores] = useState([]);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showAdd, setShowAdd] = useState(false);
    const [form, setForm] = useState({ title: '', frequency: 'weekly', description: '', is_recurring: true });

    const fetchData = useCallback(async () => {
        if (!user) return;
        const { data: c } = await supabase.from('chores').select('*').order('created_at', { ascending: true });
        const { data: h } = await supabase.from('chore_history')
            .select('*, chores(title)')
            .order('completed_at', { ascending: false })
            .limit(10);
        
        setChores(c || []);
        setHistory(h || []);
    }, [user]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!form.title) return;
        setLoading(true);
        const { error } = await supabase.from('chores').insert([{ ...form, user_id: user.id }]);
        if (!error) {
            setForm({ title: '', frequency: 'weekly', description: '', is_recurring: true });
            setShowAdd(false);
            fetchData();
            notify('Chore added');
        }
        setLoading(false);
    };

    const completeChore = async (chore) => {
        const now = new Date().toISOString();
        const { error: histError } = await supabase.from('chore_history').insert([{ chore_id: chore.id, user_id: user.id, completed_at: now }]);
        if (!histError) {
            const updates = { last_completed: now };
            if (!chore.is_recurring) updates.status = 'completed';
            
            await supabase.from('chores').update(updates).eq('id', chore.id);
            fetchData();
            notify('Chore completed!');
        }
    };

    const deleteChore = async (id) => {
        const { error } = await supabase.from('chores').delete().eq('id', id);
        if (!error) { fetchData(); notify('Chore removed'); }
    };

    const getStatus = (chore) => {
        if (!chore.last_completed) return { label: 'Never', color: 'text-danger', urgency: 100 };
        
        const last = parseISO(chore.last_completed);
        const daysSince = differenceInDays(new Date(), last);
        
        const freqMap = { daily: 1, weekly: 7, biweekly: 14, monthly: 30, quarterly: 90, yearly: 365 };
        const threshold = freqMap[chore.frequency] || 7;
        
        if (daysSince >= threshold) return { label: 'Overdue', color: 'text-danger', urgency: daysSince / threshold };
        if (daysSince >= threshold * 0.8) return { label: 'Due Soon', color: 'text-warning', urgency: daysSince / threshold };
        return { label: 'Clean', color: 'text-success', urgency: daysSince / threshold };
    };

    return (
        <PageContainer>
            <div className="flex justify-between items-center mb-8">
                <h3 className="text-3xl font-black text-base-content tracking-tighter">Maintenance & Chores</h3>
                <button onClick={() => setShowAdd(!showAdd)} className="bg-primary/10 text-primary px-6 py-3 rounded-2xl font-black flex items-center gap-2 hover:bg-primary hover:text-primary-content transition-all shadow-sm">
                    <Icon name={showAdd ? "X" : "Plus"} size={20} />
                    {showAdd ? "Cancel" : "New Duty"}
                </button>
            </div>

            {showAdd && (
                <form onSubmit={handleAdd} className="bg-base-200 p-8 rounded-[3rem] border border-base-300 shadow-xl space-y-6 mb-12 animate-in slide-in-from-top-4 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Duty Title</label>
                            <input placeholder="e.g. Deep Clean Kitchen" className="w-full bg-base-100 p-4 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-primary transition-all" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Frequency Type</label>
                            <div className="flex bg-base-100 p-1 rounded-2xl">
                                <button type="button" onClick={() => setForm({...form, is_recurring: true})} className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${form.is_recurring ? 'bg-primary text-primary-content shadow-md' : 'text-slate-500 hover:bg-base-200'}`}>Recurring</button>
                                <button type="button" onClick={() => setForm({...form, is_recurring: false})} className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${!form.is_recurring ? 'bg-primary text-primary-content shadow-md' : 'text-slate-500 hover:bg-base-200'}`}>One-off</button>
                            </div>
                        </div>
                    </div>
                    
                    {form.is_recurring && (
                        <div className="space-y-2 animate-in fade-in duration-300">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Interval</label>
                            <select className="w-full bg-base-100 p-4 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-primary transition-all" value={form.frequency} onChange={e => setForm({...form, frequency: e.target.value})}>
                                <option value="daily">Daily</option>
                                <option value="weekly">Weekly</option>
                                <option value="biweekly">Bi-weekly</option>
                                <option value="monthly">Monthly</option>
                                <option value="quarterly">Quarterly</option>
                                <option value="yearly">Yearly</option>
                            </select>
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Context/Notes</label>
                        <input placeholder="Short description or notes..." className="w-full bg-base-100 p-4 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-primary transition-all" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
                    </div>
                    <button disabled={loading} className="w-full bg-primary text-primary-content py-5 rounded-2xl font-black uppercase tracking-widest shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all">Initialize Duty</button>
                </form>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2 space-y-12">
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <span className="bg-indigo-500/10 text-indigo-500 p-2 rounded-xl"><Icon name="RotateCcw" size={20} /></span>
                            <h4 className="text-xl font-black text-base-content uppercase tracking-tighter">Active Maintenance</h4>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {chores.filter(c => c.is_recurring).map(chore => {
                                const status = getStatus(chore);
                                return (
                                    <div key={chore.id} className="bg-base-200 p-8 rounded-[2.5rem] border border-base-300 group hover:border-primary/30 transition-all flex flex-col shadow-sm">
                                        <div className="flex justify-between items-start mb-4">
                                            <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded bg-base-300 ${status.color}`}>
                                                {status.label}
                                            </span>
                                            <button onClick={() => deleteChore(chore.id)} className="text-slate-400 hover:text-danger opacity-0 group-hover:opacity-100 transition-all p-1">
                                                <Icon name="Trash2" size={16} />
                                            </button>
                                        </div>
                                        <h4 className="text-xl font-black text-base-content mb-1 leading-tight">{chore.title}</h4>
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">{chore.frequency}</p>
                                        
                                        <div className="mt-auto space-y-4">
                                            <div className="bg-base-100/50 p-3 rounded-xl">
                                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter mb-1">Last Completed</p>
                                                <p className="text-xs font-bold text-base-content">{chore.last_completed ? format(parseISO(chore.last_completed), 'MMM do, yyyy') : 'Never'}</p>
                                            </div>
                                            <button onClick={() => completeChore(chore)} className="w-full py-3 bg-primary text-primary-content rounded-xl font-black text-xs uppercase tracking-widest shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all">
                                                Log Completion
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <span className="bg-amber-500/10 text-amber-500 p-2 rounded-xl"><Icon name="Zap" size={20} /></span>
                            <h4 className="text-xl font-black text-base-content uppercase tracking-tighter">One-Off Tasks</h4>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {chores.filter(c => !c.is_recurring && c.status !== 'completed').map(chore => (
                                <div key={chore.id} className="bg-base-200 p-6 rounded-[2rem] border border-base-300 group hover:border-primary/30 transition-all flex items-center justify-between shadow-sm">
                                    <div className="flex-1">
                                        <h4 className="font-bold text-base-content leading-tight">{chore.title}</h4>
                                        {chore.description && <p className="text-[10px] text-slate-500 mt-1">{chore.description}</p>}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => completeChore(chore)} className="p-3 bg-success/10 text-success rounded-xl hover:bg-success hover:text-success-content transition-all">
                                            <Icon name="Check" size={20} />
                                        </button>
                                        <button onClick={() => deleteChore(chore.id)} className="p-3 text-slate-400 hover:text-danger opacity-0 group-hover:opacity-100 transition-all">
                                            <Icon name="Trash2" size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {chores.filter(c => !c.is_recurring && c.status !== 'completed').length === 0 && (
                                <p className="text-sm font-bold text-slate-400 italic">No pending one-off tasks.</p>
                            )}
                        </div>
                    </section>
                </div>

                <aside>
                    <div className="sticky top-8">
                        <div className="bg-slate-900 text-white rounded-[3rem] overflow-hidden shadow-2xl border-4 border-slate-800">
                            <header className="bg-slate-800 p-6 flex items-center justify-between">
                                <div>
                                    <h4 className="font-black uppercase tracking-widest text-[10px] text-slate-400">Service Ledger</h4>
                                    <p className="text-xl font-black">Duty Log</p>
                                </div>
                                <Icon name="ClipboardList" className="text-slate-500" size={32} />
                            </header>
                            <div className="p-2">
                                <div className="space-y-1">
                                    {history.map((log, i) => (
                                        <div key={log.id} className={`p-4 rounded-2xl flex items-center justify-between ${i % 2 === 0 ? 'bg-slate-800/30' : ''}`}>
                                            <div className="flex-1">
                                                <p className="text-xs font-bold text-slate-100">{log.chores?.title}</p>
                                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{format(parseISO(log.completed_at), 'MMM do @ HH:mm')}</p>
                                            </div>
                                            <div className="w-1.5 h-1.5 rounded-full bg-success shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                                        </div>
                                    ))}
                                    {history.length === 0 && (
                                        <div className="p-8 text-center text-slate-600 font-bold italic text-sm">No entries recorded.</div>
                                    )}
                                </div>
                            </div>
                            <footer className="bg-slate-800/50 p-4 text-center">
                                <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em]">Verified Operational Record</p>
                            </footer>
                        </div>
                    </div>
                </aside>
            </div>
        </PageContainer>
    );
};

export default ActionChores;
