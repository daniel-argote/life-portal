import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import Icon from '../components/Icon';
import PageContainer from '../components/PageContainer';
import { startOfWeek, addDays, isWithinInterval, startOfDay, endOfDay } from 'date-fns';

const FoodJournal = ({ user, notify }) => {
    const [journalItems, setJournalItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({ meal: 'Breakfast', content: '', calories: '', is_home_cooked: false });

    const fetchData = useCallback(async () => {
        if (!user) return;
        const { data } = await supabase.from('food').select('*').order('created_at', { ascending: false });
        setJournalItems(data || []);
    }, [user]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.content) return;
        setLoading(true);
        const { error } = await supabase.from('food').insert([{ 
            ...form,
            calories: form.calories ? parseInt(form.calories) : null,
            user_id: user.id 
        }]);
        
        if (!error) {
            setForm({ meal: 'Breakfast', content: '', calories: '', is_home_cooked: false });
            fetchData();
            if (notify) notify('Food record saved');
        }
        setLoading(false);
    };

    const deleteItem = async (id) => {
        const { error } = await supabase.from('food').delete().eq('id', id);
        if (!error) { fetchData(); if (notify) notify('Record deleted'); }
    };

    const start = startOfWeek(new Date());
    const end = addDays(start, 6);
    const weekMeals = journalItems.filter(item => {
        const d = new Date(item.created_at);
        return isWithinInterval(d, { start: startOfDay(start), end: endOfDay(end) });
    });
    const homeCookedCount = weekMeals.filter(m => m.is_home_cooked).length;

    return (
        <PageContainer>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                    <form onSubmit={handleSubmit} className="bg-base-200 p-6 rounded-[2rem] border border-base-300 shadow-sm flex flex-col gap-4">
                        <div className="flex flex-col md:flex-row gap-4">
                            <select
                                className="bg-base-100 p-4 rounded-xl font-bold outline-none text-base-content min-w-[140px]"
                                value={form.meal}
                                onChange={e => setForm({ ...form, meal: e.target.value })}
                            >
                                <option>Breakfast</option>
                                <option>Lunch</option>
                                <option>Dinner</option>
                                <option>Snack</option>
                                <option>Drink</option>
                            </select>
                            <input
                                type="text"
                                placeholder="What did you eat?"
                                className="flex-1 bg-base-100 p-4 rounded-xl font-bold outline-none text-base-content border-2 border-transparent focus:border-primary transition-all"
                                value={form.content}
                                onChange={e => setForm({ ...form, content: e.target.value })}
                            />
                            <input
                                type="number"
                                placeholder="kcal"
                                className="w-full md:w-32 bg-base-100 p-4 rounded-xl font-bold outline-none text-base-content border-2 border-transparent focus:border-primary transition-all"
                                value={form.calories}
                                onChange={e => setForm({ ...form, calories: e.target.value })}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <button 
                                type="button"
                                onClick={() => setForm({...form, is_home_cooked: !form.is_home_cooked})}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all border-2
                                    ${form.is_home_cooked ? 'bg-primary/10 border-primary text-primary' : 'bg-base-100 border-transparent text-slate-600'}`}
                            >
                                <Icon name="Flame" size={18} />
                                Home Cooked
                            </button>
                            <button disabled={loading} className="bg-primary text-primary-content p-4 rounded-xl font-bold shadow-lg hover:scale-105 transition-transform disabled:opacity-50">
                                <Icon name="Plus" size={24} />
                            </button>
                        </div>
                    </form>
                </div>
                <div className="bg-primary/5 border border-primary/10 p-8 rounded-[2rem] flex flex-col items-center justify-center text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">Home Cooked This Week</p>
                    <div className="text-6xl font-black text-primary">{homeCookedCount}</div>
                    <p className="text-xs font-bold text-slate-600 mt-2">Meals prepared with care</p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {journalItems.map(item => (
                    <div key={item.id} className="bg-base-200 p-6 rounded-[2rem] border border-base-300 flex justify-between items-center group shadow-sm transition-all hover:border-primary/30">
                        <div className="flex-1">
                            <div className="flex justify-between items-start mb-1">
                                <div className="flex items-center gap-2">
                                    <p className="text-xs font-black text-slate-600 uppercase tracking-widest">{item.meal}</p>
                                    {item.is_home_cooked && <Icon name="Flame" size={12} className="text-primary" />}
                                </div>
                                {item.calories && <p className="text-xs font-black text-primary uppercase tracking-widest">{item.calories} kcal</p>}
                            </div>
                            <p className="text-xl font-bold text-base-content">{item.content}</p>
                            <p className="text-[10px] font-bold text-slate-600 mt-2">{new Date(item.created_at).toLocaleDateString()} {new Date(item.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                        </div>
                        <button onClick={() => deleteItem(item.id)} className="text-slate-600 hover:text-danger opacity-0 group-hover:opacity-100 transition-all ml-4 p-2">
                            <Icon name="Trash2" size={20} />
                        </button>
                    </div>
                ))}
            </div>
        </PageContainer>
    );
};

export default FoodJournal;
