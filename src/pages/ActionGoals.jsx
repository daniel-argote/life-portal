import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import Icon from '../components/Icon';
import DatePicker from '../components/DatePicker';
import { format } from 'date-fns';
import PageContainer from '../components/PageContainer';

const ActionGoals = ({ user, notify, todoLabels }) => {
    const [goals, setGoals] = useState([]);
    const [showAdd, setShowAdd] = useState(false);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({ title: '', description: '', target_date: '', status: 'active', label_ids: [] });

    const fetchGoals = useCallback(async () => {
        if (!user) return;
        const { data: g } = await supabase.from('goals').select('*').order('target_date', { ascending: true });
        setGoals(g || []);
    }, [user]);

    useEffect(() => { fetchGoals(); }, [fetchGoals]);

    const handleAdd = async () => {
        if (!form.title) return;
        setLoading(true);
        const { error } = await supabase.from('goals').insert([{ ...form, user_id: user.id }]);
        if (error) {
            notify(error, 'error');
        } else {
            setForm({ title: '', description: '', target_date: '', status: 'active', label_ids: [] });
            setShowAdd(false);
            fetchGoals();
            notify('Goal initialized');
        }
        setLoading(false);
    };

    const updateGoal = async (id, updates) => {
        setLoading(true);
        const { error } = await supabase.from('goals').update(updates).eq('id', id);
        if (error) {
            notify(error, 'error');
        } else {
            fetchGoals();
            notify('Goal strategy adjusted');
        }
        setLoading(false);
    };

    const deleteGoal = async (id) => {
        const { error } = await supabase.from('goals').delete().eq('id', id);
        if (error) {
            notify(error, 'error');
        } else {
            fetchGoals(); 
            notify('Goal archived'); 
        }
    };

    const toggleComplete = (goal) => {
        const newStatus = goal.status === 'achieved' ? 'active' : 'achieved';
        updateGoal(goal.id, { status: newStatus });
    };

    const toggleLabel = (labelId) => {
        const current = form.label_ids || [];
        const next = current.includes(labelId)
            ? current.filter(id => id !== labelId)
            : [...current, labelId];
        setForm({ ...form, label_ids: next });
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
                <form onSubmit={(e) => { e.preventDefault(); handleAdd(); }} className="bg-base-200 p-8 rounded-[2.5rem] border border-base-300 shadow-xl space-y-6">
                    <input placeholder="What's the milestone?" className="w-full bg-base-100 p-4 rounded-xl font-bold outline-none border-2 border-transparent focus:border-primary text-xl" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
                    
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Assign Labels</label>
                        <div className="flex flex-wrap gap-2">
                            {todoLabels.map(l => (
                                <button 
                                    key={l.id} 
                                    type="button"
                                    onClick={() => toggleLabel(l.id)}
                                    className={`px-3 py-1.5 rounded-lg font-bold text-[10px] uppercase transition-all flex items-center gap-2 ${form.label_ids?.includes(l.id) ? 'shadow-md scale-105' : 'opacity-40 grayscale hover:grayscale-0 hover:opacity-100'}`}
                                    style={{ backgroundColor: l.color, color: 'white' }}
                                >
                                    {l.name}
                                    {form.label_ids?.includes(l.id) && <Icon name="Check" size={10} />}
                                </button>
                            ))}
                        </div>
                    </div>

                    <textarea placeholder="Describe the outcome..." className="w-full h-32 bg-base-100 p-4 rounded-xl font-bold outline-none resize-none border-2 border-transparent focus:border-primary" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
                    
                    <div className="w-full md:w-64">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-600 ml-2 mb-1 block">Target Date</label>
                        <DatePicker value={form.target_date} onChange={(val) => setForm({...form, target_date: val})} />
                    </div>
                    <button disabled={loading} className="w-full bg-primary text-primary-content py-4 rounded-xl font-black shadow-lg">Activate Goal</button>
                </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {goals.map(goal => (
                    <div key={goal.id} className={`bg-base-200 p-8 rounded-[2.5rem] border-2 shadow-sm group transition-all flex flex-col ${goal.status === 'achieved' ? 'border-success/30' : 'border-base-300 hover:border-primary/30'}`}>
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex-1">
                                <div className="flex flex-wrap gap-1 mb-2">
                                    {goal.label_ids?.map(labelId => {
                                        const label = todoLabels.find(l => l.id === labelId);
                                        if (!label) return null;
                                        return <div key={labelId} className="px-2 py-0.5 rounded text-[8px] font-black text-white uppercase" style={{ backgroundColor: label.color }}>{label.name}</div>;
                                    })}
                                </div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className={`p-1.5 rounded-lg ${goal.status === 'achieved' ? 'bg-success/10 text-success' : 'bg-primary/10 text-primary'}`}>
                                        <Icon name={goal.status === 'achieved' ? "CheckCircle2" : "Star"} size={16} />
                                    </span>
                                    <h4 className={`text-2xl font-black ${goal.status === 'achieved' ? 'text-success' : 'text-base-content'}`}>{goal.title}</h4>
                                </div>
                                <div className="flex gap-4">
                                    {goal.target_date && <p className="text-[10px] font-black text-primary uppercase tracking-widest">Target: {format(new Date(goal.target_date.replace(/-/g, '/')), 'MMMM yyyy')}</p>}
                                    {goal.completed_at && <p className="text-[10px] font-black text-success uppercase tracking-widest">Achieved: {format(new Date(goal.completed_at), 'MMMM yyyy')}</p>}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => toggleComplete(goal)} className={`p-2 rounded-xl transition-all ${goal.status === 'achieved' ? 'text-success hover:bg-success/10' : 'text-slate-400 hover:text-success hover:bg-success/10'}`} title={goal.status === 'achieved' ? "Re-activate Goal" : "Mark as Achieved"}>
                                    <Icon name={goal.status === 'achieved' ? "RefreshCw" : "Check"} size={20} />
                                </button>
                                <button onClick={() => deleteGoal(goal.id)} className="text-slate-600 hover:text-danger opacity-0 group-hover:opacity-100 transition-all p-2">
                                    <Icon name="Trash2" size={20} />
                                </button>
                            </div>
                        </div>
                        <p className={`text-sm font-bold leading-relaxed flex-1 ${goal.status === 'achieved' ? 'text-slate-400 dark:text-slate-500' : 'text-slate-500 dark:text-slate-600'}`}>{goal.description}</p>
                    </div>
                ))}
            </div>
        </PageContainer>
    );
};

export default ActionGoals;
