import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import Icon from '../components/Icon';
import PageContainer from '../components/PageContainer';
import { format, differenceInDays, parseISO } from 'date-fns';

const ActionChores = ({ user, notify }) => {
    const [chores, setChores] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showAdd, setShowAdd] = useState(false);
    const [form, setForm] = useState({ title: '', frequency: 'weekly', description: '' });

    const fetchChores = useCallback(async () => {
        if (!user) return;
        const { data } = await supabase.from('chores').select('*').order('created_at', { ascending: true });
        setChores(data || []);
    }, [user]);

    useEffect(() => { fetchChores(); }, [fetchChores]);

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!form.title) return;
        setLoading(true);
        const { error } = await supabase.from('chores').insert([{ ...form, user_id: user.id }]);
        if (!error) {
            setForm({ title: '', frequency: 'weekly', description: '' });
            setShowAdd(false);
            fetchChores();
            notify('Chore added');
        }
        setLoading(false);
    };

    const completeChore = async (chore) => {
        const now = new Date().toISOString();
        const { error: histError } = await supabase.from('chore_history').insert([{ chore_id: chore.id, user_id: user.id, completed_at: now }]);
        if (!histError) {
            await supabase.from('chores').update({ last_completed: now }).eq('id', chore.id);
            fetchChores();
            notify('Chore completed!');
        }
    };

    const deleteChore = async (id) => {
        const { error } = await supabase.from('chores').delete().eq('id', id);
        if (!error) { fetchChores(); notify('Chore removed'); }
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
            <div className="flex justify-between items-center">
                <h3 className="text-2xl font-black text-base-content">Chore Tracker</h3>
                <button onClick={() => setShowAdd(!showAdd)} className="bg-primary/10 text-primary px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-primary hover:text-primary-content transition-all">
                    <Icon name={showAdd ? "X" : "Plus"} size={18} />
                    {showAdd ? "Cancel" : "Add Chore"}
                </button>
            </div>

            {showAdd && (
                <form onSubmit={handleAdd} className="bg-base-200 p-8 rounded-[2.5rem] border border-base-300 shadow-xl space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input placeholder="Chore Title (e.g. Wash Bed Sheets)" className="w-full bg-base-100 p-4 rounded-xl font-bold outline-none border-2 border-transparent focus:border-primary" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
                        <select className="w-full bg-base-100 p-4 rounded-xl font-bold outline-none" value={form.frequency} onChange={e => setForm({...form, frequency: e.target.value})}>
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="biweekly">Bi-weekly</option>
                            <option value="monthly">Monthly</option>
                            <option value="quarterly">Quarterly</option>
                            <option value="yearly">Yearly</option>
                        </select>
                    </div>
                    <input placeholder="Short description or notes..." className="w-full bg-base-100 p-4 rounded-xl font-bold outline-none border-2 border-transparent focus:border-primary" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
                    <button disabled={loading} className="w-full bg-primary text-primary-content py-4 rounded-xl font-black shadow-lg">Set Recurrence</button>
                </form>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {chores.map(chore => {
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
                                    Complete Task
                                </button>
                            </div>
                        </div>
                    );
                })}
                {chores.length === 0 && !showAdd && <div className="sm:col-span-2 lg:col-span-3 p-20 text-center text-slate-400 font-bold border-2 border-dashed border-base-300 rounded-[3rem]">Everything is clean! Add a chore to start tracking.</div>}
            </div>
        </PageContainer>
    );
};

export default ActionChores;
