import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import Icon from '../components/Icon';
import PageContainer from '../components/PageContainer';
import { format } from 'date-fns';

const FoodTopLists = ({ user, notify }) => {
    const [lists, setLists] = useState([]);
    const [selectedList, setSelectedList] = useState(null);

    const EditItemModal = ({ item, onClose, onSave }) => {
        const [form, setForm] = useState({ ...item });

        return (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
                <div className="bg-white dark:bg-slate-800 w-full max-w-4xl rounded-[3rem] shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden flex flex-col max-h-[90vh]">
                    <header className="p-8 pb-4 flex justify-between items-start">
                        <div>
                            <h3 className="text-3xl font-black dark:text-white leading-none">Adjust Entry</h3>
                            <p className="text-[10px] font-black uppercase tracking-widest text-primary">Mission Debrief</p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl transition-all">
                            <Icon name="X" size={24} />
                        </button>
                    </header>
                    <div className="flex-1 overflow-y-auto p-8 pt-4 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Establishment</label>
                                    <input className="w-full bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl font-bold" value={form.restaurant_name} onChange={e => setForm({...form, restaurant_name: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">The Dish</label>
                                    <input className="w-full bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl font-bold" value={form.dish_name} onChange={e => setForm({...form, dish_name: e.target.value})} />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Flavor Profile ({form.rating_flavor}/10)</label>
                                    <input type="range" min="1" max="10" className="w-full accent-primary" value={form.rating_flavor} onChange={e => setForm({...form, rating_flavor: parseInt(e.target.value)})} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Economic Value ({form.rating_value}/10)</label>
                                    <input type="range" min="1" max="10" className="w-full accent-primary" value={form.rating_value} onChange={e => setForm({...form, rating_value: parseInt(e.target.value)})} />
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Review Notes</label>
                            <textarea className="w-full h-32 bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl font-bold resize-none" value={form.review_notes} onChange={e => setForm({...form, review_notes: e.target.value})} />
                        </div>
                    </div>
                    <footer className="p-8 bg-slate-50 dark:bg-slate-900/50 flex gap-3">
                        <button onClick={onClose} className="flex-1 px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-800 transition-all">Cancel</button>
                        <button onClick={() => onSave(item.id, form)} className="flex-[2] bg-primary text-primary-content px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg">Commit Adjustments</button>
                    </footer>
                </div>
            </div>
        );
    };

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showAddList, setShowAddList] = useState(false);
    const [showAddItem, setShowAddItem] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    
    const [listForm, setListForm] = useState({ category_name: '', description: '' });
    const [itemForm, setItemForm] = useState({
        restaurant_name: '',
        dish_name: '',
        location_name: '',
        rating_flavor: 5,
        rating_value: 5,
        rating_vibe: 5,
        price_point: 2,
        must_try_other_dishes: '',
        review_notes: '',
        visited_at: format(new Date(), 'yyyy-MM-dd'),
        photo_url: ''
    });

    const fetchLists = useCallback(async () => {
        if (!user) return;
        const { data, error } = await supabase.from('food_top_lists').select('*').order('category_name');
        if (error) notify(error, 'error');
        setLists(data || []);
    }, [user, notify]);

    const fetchItems = useCallback(async (listId) => {
        const { data, error } = await supabase.from('food_top_list_items')
            .select('*')
            .eq('list_id', listId)
            .order('rating_flavor', { ascending: false });
        if (error) notify(error, 'error');
        setItems(data || []);
    }, [notify]);

    useEffect(() => { fetchLists(); }, [fetchLists]);

    useEffect(() => {
        if (selectedList) fetchItems(selectedList.id);
    }, [selectedList, fetchItems]);

    const handleAddList = async () => {
        if (!listForm.category_name) return;
        setLoading(true);
        const { data, error } = await supabase.from('food_top_lists').insert([{ ...listForm, user_id: user.id }]).select();
        if (error) {
            notify(error, 'error');
        } else if (data) {
            setListForm({ category_name: '', description: '' });
            setShowAddList(false);
            fetchLists();
            setSelectedList(data[0]);
            notify('Category initialized');
        }
        setLoading(false);
    };

    const handleAddItem = async () => {
        if (!itemForm.restaurant_name || !selectedList) return;
        setLoading(true);
        const { error } = await supabase.from('food_top_list_items').insert([{ 
            ...itemForm, 
            list_id: selectedList.id, 
            user_id: user.id 
        }]);
        if (error) {
            notify(error, 'error');
        } else {
            setItemForm({
                restaurant_name: '', dish_name: '', location_name: '',
                rating_flavor: 5, rating_value: 5, rating_vibe: 5,
                price_point: 2, must_try_other_dishes: '', review_notes: '',
                visited_at: format(new Date(), 'yyyy-MM-dd'), photo_url: ''
            });
            setShowAddItem(false);
            fetchItems(selectedList.id);
            notify('Entry recorded');
        }
        setLoading(false);
    };

    const updateItem = async (id, updates) => {
        setLoading(true);
        const { error } = await supabase.from('food_top_list_items').update(updates).eq('id', id);
        if (error) {
            notify(error, 'error');
        } else {
            fetchItems(selectedList.id);
            setEditingItem(null);
            notify('Entry adjusted');
        }
        setLoading(false);
    };

    const deleteItem = async (id) => {
        if (!window.confirm("Archive this culinary record?")) return;
        const { error } = await supabase.from('food_top_list_items').delete().eq('id', id);
        if (error) {
            notify(error, 'error');
        } else {
            fetchItems(selectedList.id);
            notify('Entry archived');
        }
    };

    const renderStars = (rating) => (
        <div className="flex gap-0.5">
            {[...Array(10)].map((_, i) => (
                <div key={i} className={`w-1.5 h-3 rounded-full ${i < rating ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700'}`} />
            ))}
        </div>
    );

    const deleteList = async (id) => {
        if (!window.confirm("Delete this entire category and all its rankings? This cannot be undone.")) return;
        const { error } = await supabase.from('food_top_lists').delete().eq('id', id);
        if (error) {
            notify(error, 'error');
        } else {
            setSelectedList(null);
            fetchLists();
            notify('Category archived');
        }
    };

    return (
        <PageContainer>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h3 className="text-3xl font-black text-base-content tracking-tighter">Culinary Standings</h3>
                    <p className="text-slate-500 font-bold text-sm">Your personal hall of fame for the best eats.</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    {selectedList && (
                        <button onClick={() => deleteList(selectedList.id)} className="p-3 bg-danger/10 text-danger rounded-2xl hover:bg-danger hover:text-white transition-all">
                            <Icon name="Trash2" size={24} />
                        </button>
                    )}
                    <button onClick={() => setShowAddList(!showAddList)} className="bg-primary/10 text-primary px-6 py-3 rounded-2xl font-black flex items-center gap-2 hover:bg-primary hover:text-primary-content transition-all shadow-sm flex-1 md:flex-none">
                        <Icon name={showAddList ? "X" : "Plus"} size={20} />
                        {showAddList ? "Cancel" : "New Category"}
                    </button>
                </div>
            </div>

            {showAddList && (
                <form onSubmit={(e) => { e.preventDefault(); handleAddList(); }} className="bg-base-200 p-8 rounded-[3rem] border border-base-300 shadow-xl space-y-4 mb-8 animate-in slide-in-from-top-4 duration-300">
                    <input placeholder="Category (e.g. Reubens, Best Burgers)" className="w-full bg-base-100 p-4 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-primary transition-all text-xl" value={listForm.category_name} onChange={e => setListForm({...listForm, category_name: e.target.value})} />
                    <input placeholder="Short description..." className="w-full bg-base-100 p-4 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-primary transition-all" value={listForm.description} onChange={e => setListForm({...listForm, description: e.target.value})} />
                    <button disabled={loading} className="w-full bg-primary text-primary-content py-4 rounded-2xl font-black uppercase tracking-widest shadow-lg">Create Standings</button>
                </form>
            )}

            <div className="flex flex-wrap gap-2 mb-8">
                {lists.map(list => (
                    <button key={list.id} onClick={() => setSelectedList(list)} className={`px-6 py-3 rounded-2xl font-black text-sm uppercase tracking-widest transition-all ${selectedList?.id === list.id ? 'bg-primary text-primary-content shadow-lg scale-105' : 'bg-base-200 text-slate-500 hover:bg-base-300'}`}>
                        {list.category_name}
                    </button>
                ))}
            </div>

            {selectedList ? (
                <div className="space-y-8 animate-in fade-in duration-500">
                    <div className="flex justify-between items-end">
                        <div>
                            <h4 className="text-4xl font-black text-base-content tracking-tighter">{selectedList.category_name}</h4>
                            <p className="text-slate-500 font-bold italic">{selectedList.description || "The definitive ranking."}</p>
                        </div>
                        <button onClick={() => setShowAddItem(!showAddItem)} className="bg-indigo-500 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 hover:scale-105 transition-all shadow-lg">
                            <Icon name={showAddItem ? "X" : "Utensils"} size={20} />
                            {showAddItem ? "Cancel" : "Add Contender"}
                        </button>
                    </div>

                    {showAddItem && (
                        <form onSubmit={(e) => { e.preventDefault(); handleAddItem(); }} className="bg-base-200 p-8 rounded-[3rem] border-2 border-indigo-500/20 shadow-xl space-y-6 animate-in slide-in-from-top-4 duration-300">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Establishment Name</label>
                                        <input required placeholder="e.g. Katz's Delicatessen" className="w-full bg-base-100 p-4 rounded-2xl font-bold outline-none" value={itemForm.restaurant_name} onChange={e => setItemForm({...itemForm, restaurant_name: e.target.value})} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">The Dish</label>
                                        <input placeholder="e.g. Classic Pastrami on Rye" className="w-full bg-base-100 p-4 rounded-2xl font-bold outline-none" value={itemForm.dish_name} onChange={e => setItemForm({...itemForm, dish_name: e.target.value})} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Location/Address</label>
                                        <input placeholder="e.g. Lower East Side, NY" className="w-full bg-base-100 p-4 rounded-2xl font-bold outline-none" value={itemForm.location_name} onChange={e => setItemForm({...itemForm, location_name: e.target.value})} />
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Flavor Profile ({itemForm.rating_flavor}/10)</label>
                                            {renderStars(itemForm.rating_flavor)}
                                        </div>
                                        <input type="range" min="1" max="10" className="w-full accent-primary" value={itemForm.rating_flavor} onChange={e => setItemForm({...itemForm, rating_flavor: parseInt(e.target.value)})} />
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Economic Value ({itemForm.rating_value}/10)</label>
                                            {renderStars(itemForm.rating_value)}
                                        </div>
                                        <input type="range" min="1" max="10" className="w-full accent-primary" value={itemForm.rating_value} onChange={e => setItemForm({...itemForm, rating_value: parseInt(e.target.value)})} />
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Vibe/Ambiance ({itemForm.rating_vibe}/10)</label>
                                            {renderStars(itemForm.rating_vibe)}
                                        </div>
                                        <input type="range" min="1" max="10" className="w-full accent-primary" value={itemForm.rating_vibe} onChange={e => setItemForm({...itemForm, rating_vibe: parseInt(e.target.value)})} />
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Price Point</label>
                                    <div className="flex gap-2">
                                        {[1, 2, 3, 4].map(p => (
                                            <button key={p} type="button" onClick={() => setItemForm({...itemForm, price_point: p})} className={`flex-1 py-3 rounded-xl font-black text-lg transition-all ${itemForm.price_point === p ? 'bg-indigo-500 text-white' : 'bg-base-100 text-slate-400'}`}>
                                                {'$'.repeat(p)}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Side Missions (Must-try sides/drinks)</label>
                                    <input placeholder="e.g. The Matzah Ball Soup is a sleeper hit." className="w-full bg-base-100 p-4 rounded-2xl font-bold outline-none" value={itemForm.must_try_other_dishes} onChange={e => setItemForm({...itemForm, must_try_other_dishes: e.target.value})} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Review Notes</label>
                                <textarea placeholder="Describe the experience..." className="w-full h-24 bg-base-100 p-4 rounded-2xl font-bold outline-none resize-none" value={itemForm.review_notes} onChange={e => setItemForm({...itemForm, review_notes: e.target.value})} />
                            </div>
                            <button disabled={loading} className="w-full bg-indigo-500 text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-lg hover:scale-[1.01] transition-all">Record Experience</button>
                        </form>
                    )}

                    <div className="space-y-4">
                        {items.map((item, index) => (
                            <div key={item.id} className="bg-base-200 rounded-[2.5rem] overflow-hidden border border-base-300 shadow-sm hover:border-primary/30 transition-all group flex flex-col md:flex-row relative">
                                <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-all z-10">
                                    <button onClick={() => setEditingItem(item)} className="p-2 bg-white/90 dark:bg-slate-800/90 rounded-xl shadow-lg hover:text-primary transition-all">
                                        <Icon name="Edit3" size={18} />
                                    </button>
                                    <button onClick={() => deleteItem(item.id)} className="p-2 bg-white/90 dark:bg-slate-800/90 rounded-xl shadow-lg hover:text-danger transition-all">
                                        <Icon name="Trash2" size={18} />
                                    </button>
                                </div>
                                <div className="w-full md:w-48 bg-slate-300 dark:bg-slate-800 flex items-center justify-center relative">
                                    {item.photo_url ? (
                                        <img src={item.photo_url} alt={item.dish_name} className="w-full h-full object-cover" />
                                    ) : (
                                        <Icon name="Image" size={32} className="text-slate-400" />
                                    )}
                                    <div className="absolute top-4 left-4 w-10 h-10 bg-black text-white rounded-full flex items-center justify-center font-black text-xl border-2 border-white/20">
                                        {index + 1}
                                    </div>
                                </div>
                                <div className="flex-1 p-8">
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 pr-12">
                                        <div>
                                            <h5 className="text-2xl font-black text-base-content leading-none">{item.restaurant_name}</h5>
                                            <p className="text-slate-500 font-bold mt-1 flex items-center gap-1">
                                                <Icon name="MapPin" size={12} /> {item.location_name || "Unknown Location"}
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Flavor Score</span>
                                                <span className="text-2xl font-black text-primary">{item.rating_flavor}</span>
                                            </div>
                                            <div className="flex gap-1">{renderStars(item.rating_flavor)}</div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-base-300/50">
                                        <div>
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Details</p>
                                            <p className="text-xs font-bold text-base-content uppercase tracking-widest flex items-center gap-2">
                                                <span className="text-indigo-500">{'$'.repeat(item.price_point)}</span>
                                                <span className="w-1 h-1 rounded-full bg-slate-300" />
                                                {item.dish_name || "Category Standard"}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Metrics</p>
                                            <div className="space-y-1">
                                                <div className="flex justify-between text-[10px] font-bold">
                                                    <span className="text-slate-500">VALUE</span>
                                                    <span className="text-base-content">{item.rating_value}/10</span>
                                                </div>
                                                <div className="flex justify-between text-[10px] font-bold">
                                                    <span className="text-slate-500">VIBE</span>
                                                    <span className="text-base-content">{item.rating_vibe}/10</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Side Mission</p>
                                            <p className="text-[10px] font-bold text-slate-600 line-clamp-2 italic">
                                                {item.must_try_other_dishes || "No extra intel recorded."}
                                            </p>
                                        </div>
                                    </div>
                                    {item.review_notes && (
                                        <p className="mt-6 text-sm font-bold text-slate-500 bg-base-100/50 p-4 rounded-2xl italic leading-relaxed">
                                            &ldquo;{item.review_notes}&rdquo;
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="p-20 text-center bg-base-200 border-4 border-dashed border-base-300 rounded-[4rem]">
                    <Icon name="Trophy" size={64} className="mx-auto text-slate-300 mb-6" />
                    <h4 className="text-2xl font-black text-slate-400">Select a Category to View Rankings</h4>
                    <p className="text-slate-400 font-bold max-w-xs mx-auto mt-2">Create your personal hall of fame for the best meals you&apos;ve ever had.</p>
                </div>
            )}
            {editingItem && <EditItemModal item={editingItem} onClose={() => setEditingItem(null)} onSave={updateItem} />}
        </PageContainer>
    );
};

export default FoodTopLists;
