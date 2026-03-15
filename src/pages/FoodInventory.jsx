import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import Icon from '../components/Icon';
import EditableHeader from '../components/EditableHeader';

const FoodInventory = ({ user, notify, pageName, setPageName, showHeaders }) => {
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showAdd, setShowAdd] = useState(false);
    const [form, setForm] = useState({ item_name: '', quantity: '', unit: 'unit', category: 'Pantry' });
    const CATEGORIES = ['Produce', 'Dairy', 'Meat', 'Pantry', 'Freezer', 'Fridge', 'Other'];

    const fetchData = useCallback(async () => {
        if (!user) return;
        const { data } = await supabase.from('food_inventory').select('*').order('category', { ascending: true });
        setInventory(data || []);
    }, [user]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!form.item_name) return;
        setLoading(true);
        const { error } = await supabase.from('food_inventory').insert([{ ...form, user_id: user.id }]);
        if (!error) {
            setForm({ item_name: '', quantity: '', unit: 'unit', category: 'Pantry' });
            setShowAdd(false);
            fetchData();
            if (notify) notify('Inventory updated');
        }
        setLoading(false);
    };

    const deleteItem = async (id) => {
        const { error } = await supabase.from('food_inventory').delete().eq('id', id);
        if (!error) { fetchData(); if (notify) notify('Item removed'); }
    };

    return (
        <div className="space-y-8 pb-20">
            {showHeaders && (
                <EditableHeader value={pageName} onSave={setPageName} subtext="Kitchen Stock Tracking" />
            )}

            <div className="flex justify-between items-center">
                <h3 className="text-2xl font-black text-base-content">Pantry & Fridge</h3>
                <button onClick={() => setShowAdd(!showAdd)} className="bg-primary/10 text-primary px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-primary hover:text-primary-content transition-all">
                    <Icon name={showAdd ? "X" : "Plus"} size={18} />
                    {showAdd ? "Cancel" : "Add Item"}
                </button>
            </div>

            {showAdd && (
                <form onSubmit={handleAdd} className="bg-base-200 p-8 rounded-[2.5rem] border border-base-300 shadow-xl space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input placeholder="Item Name" className="w-full bg-base-100 p-4 rounded-xl font-bold outline-none border-2 border-transparent focus:border-primary" value={form.item_name} onChange={e => setForm({...form, item_name: e.target.value})} />
                        <select className="w-full bg-base-100 p-4 rounded-xl font-bold outline-none border-2 border-transparent focus:border-primary" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <input placeholder="Quantity (e.g. 2, 1/2)" className="w-full bg-base-100 p-4 rounded-xl font-bold outline-none border-2 border-transparent focus:border-primary" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} />
                        <input placeholder="Unit (e.g. lbs, boxes)" className="w-full bg-base-100 p-4 rounded-xl font-bold outline-none border-2 border-transparent focus:border-primary" value={form.unit} onChange={e => setForm({...form, unit: e.target.value})} />
                    </div>
                    <button disabled={loading} className="w-full bg-primary text-primary-content py-4 rounded-xl font-black shadow-lg">Save to Inventory</button>
                </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {CATEGORIES.map(cat => {
                    const items = inventory.filter(i => i.category === cat);
                    if (items.length === 0) return null;
                    return (
                        <div key={cat} className="bg-base-200 p-6 rounded-[2rem] border border-base-300 shadow-sm">
                            <h4 className="text-xs font-black uppercase tracking-widest text-primary mb-4 ml-2">{cat}</h4>
                            <div className="space-y-2">
                                {items.map(item => (
                                    <div key={item.id} className="bg-base-100/50 p-4 rounded-2xl flex justify-between items-center group transition-all hover:bg-base-100">
                                        <div>
                                            <p className="font-bold text-base-content">{item.item_name}</p>
                                            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{item.quantity} {item.unit}</p>
                                        </div>
                                        <button onClick={() => deleteItem(item.id)} className="text-slate-600 hover:text-danger opacity-0 group-hover:opacity-100 transition-all p-2">
                                            <Icon name="Trash2" size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default FoodInventory;
