import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import Icon from '../components/Icon';
import DatePicker from '../components/DatePicker';
import { format } from 'date-fns';
import PageContainer from '../components/PageContainer';

const ActionGoals = ({ user, notify }) => {
    const [goals, setGoals] = useState([]);
    const [showAdd, setShowAdd] = useState(false);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({ title: '', description: '', target_date: '', status: 'active' });

    const fetchData = useCallback(async () => {
        if (!user) return;
        const { data: g } = await supabase.from('goals').select('*').order('target_date', { ascending: true });
        setGoals(g || []);
    }, [user]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!form.title) return;
        setLoading(true);
        const { error } = await supabase.from('goals').insert([{ ...form, user_id: user.id }]);
        if (!error) {
            setForm({ title: '', description: '', target_date: '', status: 'active' });
            setShowAdd(false);
            fetchData();
            notify('Goal initialized');
        }
        setLoading(false);
    };

    const deleteGoal = async (id) => {
        const { error } = await supabase.from('goals').delete().eq('id', id);
        if (!error) { fetchData(); notify('Goal archived'); }
    };

    return (
        <PageContainer>
            <div className="flex justify-between items-center">
                <h3 className="text-2xl font-black text-base-content">Strategic Goals</h3>
                <button onClick={() => setShowAdd(!showAdd)} className="bg-primary/10 text-primary px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-primary hover:text-primary-content transition-all">
                    <Icon name={showAdd ? "X" : "Plus"} size={18} />
                    {showAdd ? "Cancel" : "New Goal"}
                </button>
            </div>

            {showAdd && (
                <form onSubmit={handleAdd} className="bg-base-200 p-8 rounded-[2.5rem] border border-base-300 shadow-xl space-y-4">
                    <input placeholder="What's the milestone?" className="w-full bg-base-100 p-4 rounded-xl font-bold outline-none border-2 border-transparent focus:border-primary text-xl" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
                    <textarea placeholder="Describe the outcome..." className="w-full h-32 bg-base-100 p-4 rounded-xl font-bold outline-none resize-none" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
                    <div className="w-full md:w-64">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-600 ml-2 mb-1 block">Target Date</label>
                        <DatePicker value={form.target_date} onChange={(val) => setForm({...form, target_date: val})} />
                    </div>
                    <button disabled={loading} className="w-full bg-primary text-primary-content py-4 rounded-xl font-black shadow-lg">Activate Goal</button>
                </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {goals.map(goal => (
                    <div key={goal.id} className="bg-base-200 p-8 rounded-[2.5rem] border border-base-300 shadow-sm group hover:border-primary/30 transition-all">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="bg-primary/10 text-primary p-1.5 rounded-lg"><Icon name="Star" size={16} /></span>
                                    <h4 className="text-2xl font-black text-base-content">{goal.title}</h4>
                                </div>
                                {goal.target_date && <p className="text-[10px] font-black text-primary uppercase tracking-widest">Target: {format(new Date(goal.target_date.replace(/-/g, '/')), 'MMMM yyyy')}</p>}
                            </div>
                            <button onClick={() => deleteGoal(goal.id)} className="text-slate-600 hover:text-danger opacity-0 group-hover:opacity-100 transition-all p-2">
                                <Icon name="Trash2" size={20} />
                            </button>
                        </div>
                        <p className="text-sm font-bold text-slate-500 dark:text-slate-600 leading-relaxed">{goal.description}</p>
                    </div>
                ))}
            </div>
        </PageContainer>
    );
};

export default ActionGoals;
