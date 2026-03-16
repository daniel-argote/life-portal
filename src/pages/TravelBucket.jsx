import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import Icon from '../components/Icon';
import PageContainer from '../components/PageContainer';

const TravelBucket = ({ user, notify }) => {
    const [bucket, setBucket] = useState([]);
    const [showAdd, setShowAdd] = useState(false);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({ name: '', country: '', priority: 'medium', notes: '' });

    const fetchBucket = useCallback(async () => {
        if (!user) return;
        const { data } = await supabase.from('travel_bucket_list').select('*').order('priority', { ascending: false });
        setBucket(data || []);
    }, [user]);

    useEffect(() => { fetchBucket(); }, [fetchBucket]);

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!form.name) return;
        setLoading(true);
        const { error } = await supabase.from('travel_bucket_list').insert([{ ...form, user_id: user.id }]);
        if (!error) {
            setForm({ name: '', country: '', priority: 'medium', notes: '' });
            setShowAdd(false);
            fetchBucket();
            notify('Destination added to wishlist');
        }
        setLoading(false);
    };

    const toggleVisited = async (item) => {
        await supabase.from('travel_bucket_list').update({ is_visited: !item.is_visited }).eq('id', item.id);
        fetchBucket();
    };

    const deleteItem = async (id) => {
        await supabase.from('travel_bucket_list').delete().eq('id', id);
        fetchBucket();
        notify('Removed from list');
    };

    const priorityColors = {
        high: 'bg-danger text-white',
        medium: 'bg-primary text-primary-content',
        low: 'bg-base-300 text-slate-600'
    };

    return (
        <PageContainer>
            <div className="flex justify-between items-center">
                <h3 className="text-2xl font-black text-base-content">Travel Bucket List</h3>
                <button onClick={() => setShowAdd(!showAdd)} className="bg-primary/10 text-primary px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-primary hover:text-primary-content transition-all">
                    <Icon name={showAdd ? "X" : "Plus"} size={18} />
                    {showAdd ? "Cancel" : "Add Destination"}
                </button>
            </div>

            {showAdd && (
                <form onSubmit={handleAdd} className="bg-base-200 p-8 rounded-[2.5rem] border border-base-300 shadow-xl space-y-4 animate-in slide-in-from-top-4 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input placeholder="Destination Name (e.g. Kyoto)" className="w-full bg-base-100 p-4 rounded-xl font-bold outline-none border-2 border-transparent focus:border-primary" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                        <input placeholder="Country" className="w-full bg-base-100 p-4 rounded-xl font-bold outline-none border-2 border-transparent focus:border-primary" value={form.country} onChange={e => setForm({...form, country: e.target.value})} />
                    </div>
                    <div className="flex flex-col md:flex-row gap-4 items-center">
                        <div className="flex-1 w-full">
                            <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Priority</label>
                            <select className="w-full bg-base-100 p-4 rounded-xl font-bold outline-none" value={form.priority} onChange={e => setForm({...form, priority: e.target.value})}>
                                <option value="high">High Priority</option>
                                <option value="medium">Medium Priority</option>
                                <option value="low">Low Priority</option>
                            </select>
                        </div>
                        <div className="flex-[2] w-full">
                            <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Notes</label>
                            <input placeholder="Why do you want to go?" className="w-full bg-base-100 p-4 rounded-xl font-bold outline-none border-2 border-transparent focus:border-primary" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
                        </div>
                    </div>
                    <button disabled={loading} className="w-full bg-primary text-primary-content py-4 rounded-xl font-black shadow-lg">Add to My Dreams</button>
                </form>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {bucket.map(item => (
                    <div key={item.id} className={`bg-base-200 p-8 rounded-[2.5rem] border border-base-300 shadow-sm group hover:border-primary/30 transition-all flex flex-col relative ${item.is_visited ? 'opacity-50 grayscale' : ''}`}>
                        <div className="flex justify-between items-start mb-4">
                            <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded ${priorityColors[item.priority]}`}>
                                {item.priority}
                            </span>
                            <div className="flex gap-2">
                                <button onClick={() => toggleVisited(item)} className={`p-2 rounded-xl transition-all ${item.is_visited ? 'bg-success text-white' : 'bg-base-300 text-slate-400 hover:text-success'}`}>
                                    <Icon name="Check" size={16} />
                                </button>
                                <button onClick={() => deleteItem(item.id)} className="p-2 rounded-xl bg-base-300 text-slate-400 hover:text-danger opacity-0 group-hover:opacity-100 transition-all">
                                    <Icon name="Trash2" size={16} />
                                </button>
                            </div>
                        </div>
                        <h4 className="text-2xl font-black text-base-content leading-tight">{item.name}</h4>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1 mb-4">{item.country}</p>
                        {item.notes && (
                            <p className="text-sm font-bold text-slate-600 line-clamp-3 italic mt-auto">&quot;{item.notes}&quot;</p>
                        )}
                    </div>
                ))}
                {bucket.length === 0 && !showAdd && <div className="sm:col-span-2 lg:col-span-3 p-20 text-center text-slate-400 font-bold border-2 border-dashed border-base-300 rounded-[3rem]">Your travel dreams start here. Add your first destination!</div>}
            </div>
        </PageContainer>
    );
};

export default TravelBucket;
