import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import Icon from '../components/Icon';
import PageContainer from '../components/PageContainer';

const TravelPacking = ({ user, notify, travelTrips = [] }) => {
    const [packingList, setPackingList] = useState([]);
    const [showAdd, setShowAdd] = useState(false);
    const [loading, setLoading] = useState(false);
    const [mode, setMode] = useState('vault'); // 'vault' or 'templates'
    const [filterTripId, setFilterTripId] = useState('all');
    const [editingId, setEditingId] = useState(null);
    const [showVaultPicker, setShowVaultPicker] = useState(null); // template name to pick for
    const [form, setForm] = useState({ item_name: '', category: 'general', trip_id: '', is_template: false, template_name: '', quantity: 1 });

    const CATEGORIES = ['general', 'clothing', 'electronics', 'toiletries', 'documents', 'gear'];

    const SMART_MAPPING = {
        passport: 'documents', visa: 'documents', ticket: 'documents', insurance: 'documents',
        shirt: 'clothing', pants: 'clothing', socks: 'clothing', underwear: 'clothing', jacket: 'clothing',
        phone: 'electronics', laptop: 'electronics', charger: 'electronics', camera: 'electronics',
        toothbrush: 'toiletries', toothpaste: 'toiletries', soap: 'toiletries', shampoo: 'toiletries',
        tent: 'gear', pack: 'gear', boots: 'gear', stove: 'gear'
    };

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

        // Smart Category Detection
        let finalCategory = form.category;
        if (finalCategory === 'general') {
            const lowerName = form.item_name.toLowerCase();
            const found = Object.keys(SMART_MAPPING).find(key => lowerName.includes(key));
            if (found) finalCategory = SMART_MAPPING[found];
        }

        const finalTripId = form.trip_id || (filterTripId !== 'all' && filterTripId !== 'general' ? filterTripId : null);
        const { error } = await supabase.from('travel_packing').insert([{ 
            ...form, 
            category: finalCategory,
            user_id: user.id, 
            trip_id: mode === 'vault' ? (finalTripId || null) : null,
            is_template: mode === 'templates',
            template_name: mode === 'templates' ? (form.template_name || 'General') : null
        }]);

        if (!error) {
            setForm({ item_name: '', category: 'general', trip_id: '', is_template: false, template_name: '', quantity: 1 });
            setShowAdd(false);
            fetchPacking();
            notify(mode === 'templates' ? 'Added to Template' : 'Added to Gear Vault');
        }
        setLoading(false);
    };

    const updateItem = async (id, updates) => {
        await supabase.from('travel_packing').update(updates).eq('id', id);
        fetchPacking();
    };

    const deleteItem = async (id) => {
        await supabase.from('travel_packing').delete().eq('id', id);
        fetchPacking();
    };

    const renameTemplate = async (oldName, newName) => {
        if (!newName || oldName === newName) return;
        await supabase.from('travel_packing').update({ template_name: newName }).eq('template_name', oldName).eq('is_template', true);
        fetchPacking();
        notify(`Template renamed to ${newName}`);
    };

    const cloneToTemplate = async (item, templateName) => {
        const { error } = await supabase.from('travel_packing').insert([{
            user_id: user.id,
            item_name: item.item_name,
            category: item.category,
            quantity: item.quantity,
            is_template: true,
            template_name: templateName
        }]);
        if (!error) {
            fetchPacking();
            notify(`Added ${item.item_name} to ${templateName}`);
        }
    };

    // Filtered list logic
    const filteredList = packingList.filter(item => {
        if (mode === 'templates') return item.is_template;
        if (item.is_template) return false;
        if (filterTripId === 'all') return true;
        if (filterTripId === 'general') return !item.trip_id;
        return item.trip_id === filterTripId;
    });

    const templates = [...new Set(packingList.filter(i => i.is_template).map(i => i.template_name))];
    
    const gearVaultUnique = [];
    const seen = new Set();
    packingList.forEach(i => {
        if (!i.is_template && !seen.has(i.item_name)) {
            gearVaultUnique.push(i);
            seen.add(i.item_name);
        }
    });

    return (
        <PageContainer>
            {/* New Tabbed Navigation */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-10 border-b border-base-300 pb-8">
                <div className="flex gap-2 p-1.5 bg-base-200 rounded-[2rem] border border-base-300 shadow-inner">
                    <button 
                        onClick={() => setMode('vault')}
                        className={`px-8 py-4 rounded-[1.5rem] flex items-center gap-3 transition-all ${mode === 'vault' ? 'bg-primary text-primary-content shadow-lg' : 'text-slate-500 hover:bg-base-300 hover:text-primary'}`}
                    >
                        <Icon name="Package" size={20} />
                        <div className="text-left">
                            <p className="text-sm font-black leading-tight">Gear Vault</p>
                            <p className={`text-[9px] font-bold uppercase tracking-widest opacity-60 ${mode === 'vault' ? 'text-primary-content' : 'text-slate-400'}`}>Master Inventory</p>
                        </div>
                    </button>
                    <button 
                        onClick={() => setMode('templates')}
                        className={`px-8 py-4 rounded-[1.5rem] flex items-center gap-3 transition-all ${mode === 'templates' ? 'bg-primary text-primary-content shadow-lg' : 'text-slate-500 hover:bg-base-300 hover:text-primary'}`}
                    >
                        <Icon name="ClipboardList" size={20} />
                        <div className="text-left">
                            <p className="text-sm font-black leading-tight">Templates</p>
                            <p className={`text-[9px] font-bold uppercase tracking-widest opacity-60 ${mode === 'templates' ? 'text-primary-content' : 'text-slate-400'}`}>Trip Blueprints</p>
                        </div>
                    </button>
                </div>

                <button 
                    onClick={() => setShowAdd(!showAdd)} 
                    className={`px-8 py-4 rounded-[1.5rem] font-black flex items-center gap-3 transition-all shadow-lg hover:scale-105 active:scale-95 ${showAdd ? 'bg-base-200 text-slate-500 border border-base-300' : 'bg-primary text-primary-content'}`}
                >
                    <Icon name={showAdd ? "X" : "Plus"} size={20} />
                    {showAdd ? "Cancel" : `Create ${mode === 'templates' ? 'Template Item' : 'Vault Item'}`}
                </button>
            </div>

            {mode === 'vault' && (
                <div className="flex flex-wrap gap-2 mb-8 animate-in slide-in-from-left-4 duration-300">
                    <button 
                        onClick={() => setFilterTripId('all')}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterTripId === 'all' ? 'bg-primary text-primary-content shadow-lg' : 'bg-base-200 text-slate-500 hover:bg-base-300'}`}
                    >
                        All Gear
                    </button>
                    <button 
                        onClick={() => setFilterTripId('general')}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterTripId === 'general' ? 'bg-primary text-primary-content shadow-lg' : 'bg-base-200 text-slate-500 hover:bg-base-300'}`}
                    >
                        Unlinked Items
                    </button>
                    {travelTrips.map(trip => (
                        <button 
                            key={trip.id}
                            onClick={() => setFilterTripId(trip.id)}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterTripId === trip.id ? 'bg-primary text-primary-content shadow-lg' : 'bg-base-200 text-slate-500 hover:bg-base-300'}`}
                        >
                            {trip.name}
                        </button>
                    ))}
                </div>
            )}

            {showAdd && (
                <form onSubmit={handleAdd} className="bg-base-200 p-8 rounded-[2.5rem] border border-base-300 shadow-xl space-y-4 animate-in slide-in-from-top-4 duration-300 mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <input placeholder="Item Name (e.g. Passport)" className="md:col-span-2 w-full bg-base-100 p-4 rounded-xl font-bold outline-none border-2 border-transparent focus:border-primary" value={form.item_name} onChange={e => setForm({...form, item_name: e.target.value})} />
                        <div className="flex items-center gap-2 bg-base-100 p-2 rounded-xl border-2 border-transparent">
                            <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Qty</label>
                            <input type="number" min="1" className="w-full bg-transparent p-2 font-bold outline-none" value={form.quantity} onChange={e => setForm({...form, quantity: parseInt(e.target.value) || 1})} />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <select className="w-full bg-base-100 p-4 rounded-xl font-bold outline-none" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                            {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                        </select>
                        {mode === 'templates' ? (
                            <input 
                                placeholder="Template Name (e.g. Motorcycle Trip)" 
                                className="w-full bg-base-100 p-4 rounded-xl font-bold outline-none" 
                                value={form.template_name} 
                                onChange={e => setForm({...form, template_name: e.target.value})} 
                                list="template-suggestions"
                            />
                        ) : (
                            <select className="w-full bg-base-100 p-4 rounded-xl font-bold outline-none" value={form.trip_id} onChange={e => setForm({...form, trip_id: e.target.value})}>
                                <option value="">No Specific Trip</option>
                                {travelTrips.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                        )}
                    </div>
                    <datalist id="template-suggestions">
                        {templates.map(t => <option key={t} value={t} />)}
                    </datalist>
                    <button disabled={loading} className="w-full bg-primary text-primary-content py-4 rounded-xl font-black shadow-lg">Save to {mode === 'templates' ? 'Template' : 'Vault'}</button>
                </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(mode === 'templates' ? templates : CATEGORIES).map(group => {
                    const items = filteredList.filter(i => (mode === 'templates' ? i.template_name === group : i.category === group));
                    if (items.length === 0 && mode === 'vault') return null;

                    return (
                        <div key={group} className="bg-base-200 p-6 rounded-[2.5rem] border border-base-300 shadow-sm flex flex-col relative">
                            <div className="flex justify-between items-center mb-4 px-2">
                                {mode === 'templates' ? (
                                    <input 
                                        className="text-xs font-black uppercase tracking-widest text-primary bg-transparent outline-none border-b border-transparent focus:border-primary w-2/3"
                                        defaultValue={group}
                                        onBlur={(e) => renameTemplate(group, e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
                                    />
                                ) : (
                                    <h4 className="text-xs font-black uppercase tracking-widest text-primary">{group}</h4>
                                )}
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black text-slate-400">{items.length} items</span>
                                    {mode === 'templates' && (
                                        <button 
                                            onClick={() => setShowVaultPicker(showVaultPicker === group ? null : group)}
                                            className={`p-1.5 rounded-lg transition-all ${showVaultPicker === group ? 'bg-primary text-white' : 'bg-base-300 text-slate-500 hover:text-primary'}`}
                                            title="Add from Vault"
                                        >
                                            <Icon name="Library" size={12} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Vault Picker Overlay */}
                            {mode === 'templates' && showVaultPicker === group && (
                                <div className="absolute top-14 left-4 right-4 z-10 p-4 bg-base-100 rounded-2xl border-2 border-primary shadow-2xl space-y-2 animate-in zoom-in-95 duration-200">
                                    <div className="flex justify-between items-center mb-2">
                                        <p className="text-[8px] font-black uppercase text-slate-400">Pick from Gear Vault</p>
                                        <button onClick={() => setShowVaultPicker(null)}><Icon name="X" size={12} /></button>
                                    </div>
                                    <div className="max-h-60 overflow-y-auto pr-1 space-y-1 no-scrollbar">
                                        {gearVaultUnique.filter(vaultItem => !items.some(i => i.item_name === vaultItem.item_name)).map(vaultItem => (
                                            <button 
                                                key={vaultItem.id}
                                                onClick={() => cloneToTemplate(vaultItem, group)}
                                                className="w-full text-left p-3 hover:bg-primary/5 rounded-xl text-[10px] font-bold border border-base-300 hover:border-primary/20 transition-all flex justify-between items-center"
                                            >
                                                {vaultItem.item_name}
                                                <Icon name="Plus" size={12} className="text-primary" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2 flex-1">
                                {items.map(item => (
                                    <div key={item.id} className="bg-base-100/50 p-4 rounded-2xl flex flex-col gap-3 group transition-all hover:bg-base-100 border border-transparent hover:border-base-300">
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-3 flex-1 text-left">
                                                <span className="w-6 h-6 bg-base-200 rounded-lg flex items-center justify-center text-[10px] font-black text-primary">
                                                    {item.quantity}
                                                </span>
                                                {editingId === item.id ? (
                                                    <input 
                                                        autoFocus
                                                        className="bg-base-200 px-2 py-1 rounded font-bold text-sm outline-none border-b-2 border-primary w-full"
                                                        defaultValue={item.item_name}
                                                        onBlur={(e) => { updateItem(item.id, { item_name: e.target.value }); setEditingId(null); }}
                                                    />
                                                ) : (
                                                    <span onDoubleClick={() => setEditingId(item.id)} className="font-bold text-sm text-base-content">{item.item_name}</span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                                <button onClick={() => updateItem(item.id, { quantity: Math.max(1, item.quantity - 1) })} className="p-1 hover:bg-base-200 rounded"><Icon name="Minus" size={10} /></button>
                                                <button onClick={() => updateItem(item.id, { quantity: item.quantity + 1 })} className="p-1 hover:bg-base-200 rounded"><Icon name="Plus" size={10} /></button>
                                                <button onClick={() => deleteItem(item.id)} className="text-slate-400 hover:text-danger p-1 ml-1"><Icon name="Trash2" size={14} /></button>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                            {mode === 'vault' ? (
                                                <select 
                                                    className="bg-base-200 text-[9px] font-black uppercase px-2 py-1 rounded-lg outline-none cursor-pointer"
                                                    value={item.trip_id || ''}
                                                    onChange={(e) => updateItem(item.id, { trip_id: e.target.value || null })}
                                                >
                                                    <option value="">No Trip</option>
                                                    {travelTrips.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                                </select>
                                            ) : (
                                                <input 
                                                    className="bg-base-200 text-[9px] font-black uppercase px-2 py-1 rounded-lg outline-none w-24"
                                                    value={item.template_name || ''}
                                                    onChange={(e) => updateItem(item.id, { template_name: e.target.value })}
                                                />
                                            )}
                                            <select 
                                                className="bg-base-200 text-[9px] font-black uppercase px-2 py-1 rounded-lg outline-none cursor-pointer"
                                                value={item.category}
                                                onChange={(e) => updateItem(item.id, { category: e.target.value })}
                                            >
                                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </PageContainer>
    );
};

export default TravelPacking;
