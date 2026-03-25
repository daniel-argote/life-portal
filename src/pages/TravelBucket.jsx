import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import Icon from '../components/Icon';
import PageContainer from '../components/PageContainer';

const TravelBucket = ({ user, notify, config = {} }) => {
    const [bucketList, setBucketList] = useState([]);
    const [showAdd, setShowAdd] = useState(false);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({ name: '', country: '', priority: 'medium', category: 'dream', notes: '' });

    // Use labels from config, with hardcoded fallbacks for safety
    const PRIORITIES = config.travelBucketPriorities || ['low', 'medium', 'high'];
    const CATEGORIES = config.travelBucketCategories || ['dream', 'attainable', 'local'];

    const fetchBucket = useCallback(async () => {
        if (!user) return;
        const { data } = await supabase.from('travel_bucket_list').select('*').order('priority', { ascending: false });
        setBucketList(data || []);
    }, [user]);

    useEffect(() => { fetchBucket(); }, [fetchBucket]);

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!form.name) return;
        setLoading(true);
        const { error } = await supabase.from('travel_bucket_list').insert([{ ...form, user_id: user.id }]);
        if (!error) {
            setForm({ name: '', country: '', priority: PRIORITIES[1] || 'medium', category: CATEGORIES[0] || 'dream', notes: '' });
            setShowAdd(false);
            fetchBucket();
            notify('Added to bucket list');
        }
        setLoading(false);
    };

    const toggleVisited = async (item) => {
        await supabase.from('travel_bucket_list').update({ is_visited: !item.is_packed }).eq('id', item.id);
        fetchBucket();
    };

    const deleteItem = async (id) => {
        await supabase.from('travel_bucket_list').delete().eq('id', id);
        fetchBucket();
    };

    const updateItem = async (id, updates) => {
        await supabase.from('travel_bucket_list').update(updates).eq('id', id);
        fetchBucket();
    };

    return (
        <PageContainer>
            <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black text-base-content">Travel Bucket List</h3>
                <button onClick={() => setShowAdd(!showAdd)} className="bg-primary/10 text-primary px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-primary hover:text-primary-content transition-all shadow-lg">
                    <Icon name={showAdd ? "X" : "Plus"} size={18} />
                    {showAdd ? "Cancel" : "Add Destination"}
                </button>
            </div>

            {showAdd && (
                <form onSubmit={handleAdd} className="bg-base-200 p-8 rounded-[2.5rem] border border-base-300 shadow-xl space-y-4 animate-in slide-in-from-top-4 duration-300 mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input placeholder="Destination Name" className="w-full bg-base-100 p-4 rounded-xl font-bold outline-none border-2 border-transparent focus:border-primary" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                        <input placeholder="Country" className="w-full bg-base-100 p-4 rounded-xl font-bold outline-none border-2 border-transparent focus:border-primary" value={form.country} onChange={e => setForm({...form, country: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <select className="w-full bg-base-100 p-4 rounded-xl font-bold outline-none" value={form.priority} onChange={e => setForm({...form, priority: e.target.value})}>
                            {PRIORITIES.map(p => <option key={p} value={p}>{p.toUpperCase()}</option>)}
                        </select>
                        <select className="w-full bg-base-100 p-4 rounded-xl font-bold outline-none" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                            {CATEGORIES.map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
                        </select>
                    </div>
                    <textarea placeholder="Why do you want to go here?" className="w-full bg-base-100 p-4 rounded-xl font-bold outline-none border-2 border-transparent focus:border-primary" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
                    <button disabled={loading} className="w-full bg-primary text-primary-content py-4 rounded-xl font-black shadow-lg">Save Dream</button>
                </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {CATEGORIES.map(cat => {
                    const items = bucketList.filter(i => i.category === cat);
                    if (items.length === 0) return null;

                    return (
                        <div key={cat} className="space-y-6">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary ml-4 px-3 py-1 bg-primary/5 rounded-full w-fit">{cat}</h4>
                            {items.map(item => (
                                <div key={item.id} className={`bg-base-200 p-8 rounded-[3rem] border border-base-300 group transition-all hover:border-primary/30 relative overflow-hidden ${item.is_visited ? 'opacity-60' : ''} shadow-sm hover:shadow-xl`}>
                                    <div className="flex justify-between items-start mb-4">
                                        <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg ${item.priority === (PRIORITIES[2] || 'high') ? 'bg-danger/10 text-danger' : 'bg-base-300 text-slate-500'}`}>{item.priority}</span>
                                        <div className="flex gap-2">
                                            <button onClick={() => toggleVisited(item)} className={`transition-all ${item.is_visited ? 'text-success' : 'text-slate-400 hover:text-success'}`}><Icon name={item.is_visited ? "CheckCircle2" : "Circle"} size={18} /></button>
                                            <button onClick={() => deleteItem(item.id)} className="text-slate-400 hover:text-danger opacity-0 group-hover:opacity-100 transition-all"><Icon name="Trash2" size={18} /></button>
                                        </div>
                                    </div>
                                    <h4 className={`text-2xl font-black text-base-content leading-tight ${item.is_visited ? 'line-through' : ''}`}>{item.name}</h4>
                                    <p className="text-sm font-bold text-slate-500 mb-6 flex items-center gap-2">
                                        <Icon name="MapPin" size={14} />
                                        {item.country}
                                    </p>
                                    
                                    {item.notes && <p className="text-xs font-medium text-slate-400 italic bg-base-100/50 p-4 rounded-2xl border border-base-300/50 leading-relaxed">{item.notes}</p>}
                                    
                                    <div className="mt-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                        <select 
                                            className="bg-base-100 text-[9px] font-black uppercase px-3 py-2 rounded-xl outline-none cursor-pointer border border-base-300 shadow-sm"
                                            value={item.category}
                                            onChange={(e) => updateItem(item.id, { category: e.target.value })}
                                        >
                                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                        <select 
                                            className="bg-base-100 text-[9px] font-black uppercase px-3 py-2 rounded-xl outline-none cursor-pointer border border-base-300 shadow-sm"
                                            value={item.priority}
                                            onChange={(e) => updateItem(item.id, { priority: e.target.value })}
                                        >
                                            {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                                        </select>
                                    </div>
                                </div>
                            ))}
                        </div>
                    );
                })}
                {bucketList.length === 0 && !showAdd && <div className="md:col-span-3 p-20 text-center text-slate-400 font-bold border-2 border-dashed border-base-300 rounded-[3rem]">Your travel dreams start here. Add your first destination!</div>}
            </div>
        </PageContainer>
    );
};

export default TravelBucket;
