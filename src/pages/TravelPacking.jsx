import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import Icon from '../components/Icon';
import PageContainer from '../components/PageContainer';

const TravelPacking = ({ user, notify, travelTrips = [] }) => {
    const [packingList, setPackingList] = useState([]);
    const [showAdd, setShowAdd] = useState(false);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({ item_name: '', category: 'general', trip_id: '' });

    const CATEGORIES = ['general', 'clothing', 'electronics', 'toiletries', 'documents', 'gear'];

    const fetchPacking = useCallback(async () => {
        if (!user) return;
        const { data } = await supabase.from('travel_packing').select('*').order('category', { ascending: true });
        setPackingList(data || []);
    }, [user]);

    useEffect(() => { fetchPacking(); }, [fetchPacking]);

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!form.item_name) return;
        setLoading(true);
        const { error } = await supabase.from('travel_packing').insert([{ ...form, user_id: user.id, trip_id: form.trip_id || null }]);
        if (!error) {
            setForm({ item_name: '', category: 'general', trip_id: '' });
            setShowAdd(false);
            fetchPacking();
            notify('Item added to packing list');
        }
        setLoading(false);
    };

    const togglePacked = async (item) => {
        await supabase.from('travel_packing').update({ is_packed: !item.is_packed }).eq('id', item.id);
        fetchPacking();
    };

    const deleteItem = async (id) => {
        await supabase.from('travel_packing').delete().eq('id', id);
        fetchPacking();
    };

    return (
        <PageContainer>
            <div className="flex justify-between items-center">
                <h3 className="text-2xl font-black text-base-content">Packing Checklists</h3>
                <button onClick={() => setShowAdd(!showAdd)} className="bg-primary/10 text-primary px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-primary hover:text-primary-content transition-all">
                    <Icon name={showAdd ? "X" : "Plus"} size={18} />
                    {showAdd ? "Cancel" : "Add Item"}
                </button>
            </div>

            {showAdd && (
                <form onSubmit={handleAdd} className="bg-base-200 p-8 rounded-[2.5rem] border border-base-300 shadow-xl space-y-4 animate-in slide-in-from-top-4 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input placeholder="Item Name (e.g. Passport)" className="w-full bg-base-100 p-4 rounded-xl font-bold outline-none border-2 border-transparent focus:border-primary" value={form.item_name} onChange={e => setForm({...form, item_name: e.target.value})} />
                        <select className="w-full bg-base-100 p-4 rounded-xl font-bold outline-none" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                            {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Link to Trip (Optional)</label>
                        <select className="w-full bg-base-100 p-4 rounded-xl font-bold outline-none mt-1" value={form.trip_id} onChange={e => setForm({...form, trip_id: e.target.value})}>
                            <option value="">General Packing</option>
                            {travelTrips.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                    </div>
                    <button disabled={loading} className="w-full bg-primary text-primary-content py-4 rounded-xl font-black shadow-lg">Add to List</button>
                </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {CATEGORIES.map(cat => {
                    const items = packingList.filter(i => i.category === cat);
                    if (items.length === 0) return null;
                    const packedCount = items.filter(i => i.is_packed).length;

                    return (
                        <div key={cat} className="bg-base-200 p-6 rounded-[2.5rem] border border-base-300 shadow-sm">
                            <div className="flex justify-between items-center mb-4 px-2">
                                <h4 className="text-xs font-black uppercase tracking-widest text-primary">{cat}</h4>
                                <span className="text-[10px] font-black text-slate-400">{packedCount}/{items.length}</span>
                            </div>
                            <div className="space-y-2">
                                {items.map(item => (
                                    <div key={item.id} className="bg-base-100/50 p-4 rounded-2xl flex justify-between items-center group transition-all hover:bg-base-100">
                                        <button onClick={() => togglePacked(item)} className="flex items-center gap-3 flex-1 text-left">
                                            <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${item.is_packed ? 'bg-success border-success text-white' : 'border-base-300'}`}>
                                                {item.is_packed && <Icon name="Check" size={12} />}
                                            </div>
                                            <span className={`font-bold text-sm ${item.is_packed ? 'text-slate-400 line-through' : 'text-base-content'}`}>{item.item_name}</span>
                                        </button>
                                        <button onClick={() => deleteItem(item.id)} className="text-slate-400 hover:text-danger opacity-0 group-hover:opacity-100 transition-all p-1">
                                            <Icon name="Trash2" size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
                {packingList.length === 0 && !showAdd && <div className="sm:col-span-2 lg:col-span-3 p-20 text-center text-slate-400 font-bold border-2 border-dashed border-base-300 rounded-[3rem]">Packing light? Add items to your checklist to stay organized.</div>}
            </div>
        </PageContainer>
    );
};

export default TravelPacking;
