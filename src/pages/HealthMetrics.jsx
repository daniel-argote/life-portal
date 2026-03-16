import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import Icon from '../components/Icon';
import PageContainer from '../components/PageContainer';

const HealthMetrics = ({ user, notify }) => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({ metric: 'Weight', value: '' });

    const fetchData = useCallback(async () => {
        if (!user) return;
        const { data } = await supabase.from('health').select('*').order('created_at', { ascending: false });
        setItems(data || []);
    }, [user]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.value) return;
        setLoading(true);
        const { error } = await supabase.from('health').insert([{ ...form, user_id: user.id }]);
        if (!error) {
            setForm({ ...form, value: '' });
            fetchData();
            if (notify) notify('Health record saved');
        }
        setLoading(false);
    };

    const deleteItem = async (id) => {
        const { error } = await supabase.from('health').delete().eq('id', id);
        if (!error) { fetchData(); if (notify) notify('Record deleted'); }
    };

    return (
        <PageContainer>
            <form onSubmit={handleSubmit} className="bg-base-200 p-6 rounded-[2rem] border border-base-300 shadow-sm flex flex-col md:flex-row gap-4">
                <select
                    className="bg-base-100 p-4 rounded-xl font-bold outline-none text-base-content min-w-[140px]"
                    value={form.metric}
                    onChange={e => setForm({ ...form, metric: e.target.value })}
                >
                    <option>Weight</option>
                    <option>Steps</option>
                    <option>Sleep</option>
                    <option>Water</option>
                    <option>Mood</option>
                </select>
                <input
                    type="text"
                    placeholder="Value (e.g. 180 lbs)"
                    className="flex-1 bg-base-100 p-4 rounded-xl font-bold outline-none text-base-content border-2 border-transparent focus:border-primary transition-all"
                    value={form.value}
                    onChange={e => setForm({ ...form, value: e.target.value })}
                />
                <button disabled={loading} className="bg-primary text-primary-content p-4 rounded-xl font-bold shadow-lg hover:scale-105 transition-transform disabled:opacity-50">
                    <Icon name="Plus" size={24} />
                </button>
            </form>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {items.map(item => (
                    <div key={item.id} className="bg-base-200 p-6 rounded-[2rem] border border-base-300 flex justify-between items-center group shadow-sm transition-all hover:border-primary/30">
                        <div>
                            <p className="text-xs font-black text-slate-600 uppercase tracking-widest mb-1">{item.metric}</p>
                            <p className="text-2xl font-black text-base-content">{item.value}</p>
                            <p className="text-[10px] font-bold text-slate-600 mt-2">{new Date(item.created_at).toLocaleDateString()} {new Date(item.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                        </div>
                        <button onClick={() => deleteItem(item.id)} className="text-slate-600 hover:text-danger opacity-0 group-hover:opacity-100 transition-all">
                            <Icon name="Trash2" size={20} />
                        </button>
                    </div>
                ))}
            </div>
        </PageContainer>
    );
};

export default HealthMetrics;
