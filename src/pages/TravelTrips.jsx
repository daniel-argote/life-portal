import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import Icon from '../components/Icon';
import PageContainer from '../components/PageContainer';
import DatePicker from '../components/DatePicker';
import { format, addDays, eachDayOfInterval, parseISO } from 'date-fns';

const TravelTrips = ({ user, notify, fetchData }) => {
    const [trips, setTrips] = useState([]);
    const [selectedTrip, setSelectedLocation] = useState(null);
    const [days, setDays] = useState([]);
    const [pois, setPois] = useState([]);
    const [packing, setPacking] = useState([]);
    const [allPacking, setAllPacking] = useState([]); // Master list for importing
    const [showAddTrip, setShowAddTrip] = useState(false);
    const [isEditingTrip, setIsEditingTrip] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showImport, setShowImport] = useState(false);
    
    const [tripForm, setTripForm] = useState({ name: '', start_date: format(new Date(), 'yyyy-MM-dd'), end_date: format(addDays(new Date(), 3), 'yyyy-MM-dd'), status: 'draft' });

    const fetchTrips = useCallback(async () => {
        if (!user) return;
        const { data } = await supabase.from('travel_trips').select('*').order('start_date', { ascending: true });
        setTrips(data || []);
        
        // Fetch all packing items for the import vault
        const { data: allPack } = await supabase.from('travel_packing').select('*');
        setAllPacking(allPack || []);
    }, [user]);

    const fetchDetails = useCallback(async (tripId) => {
        const { data: dData } = await supabase.from('travel_days').select('*').eq('trip_id', tripId).order('date', { ascending: true });
        setDays(dData || []);
        const { data: pData } = await supabase.from('travel_poi').select('*').in('day_id', dData?.map(d => d.id) || []);
        setPois(pData || []);
        const { data: packData } = await supabase.from('travel_packing').select('*').eq('trip_id', tripId).order('category', { ascending: true });
        setPacking(packData || []);
    }, []);

    useEffect(() => { fetchTrips(); }, [fetchTrips]);
    useEffect(() => { 
        if (selectedTrip) {
            fetchDetails(selectedTrip.id);
            setTripForm({ 
                name: selectedTrip.name, 
                start_date: selectedTrip.start_date, 
                end_date: selectedTrip.end_date, 
                status: selectedTrip.status 
            });
        } 
    }, [selectedTrip, fetchDetails]);

    const applyTemplate = async (templateName) => {
        if (!selectedTrip || !templateName) return;
        const templateItems = allPacking.filter(i => i.is_template && i.template_name === templateName);
        if (templateItems.length === 0) return;

        const newItems = templateItems.map(item => ({
            user_id: user.id,
            trip_id: selectedTrip.id,
            item_name: item.item_name,
            category: item.category,
            quantity: item.quantity,
            is_packed: false,
            is_template: false
        }));

        await supabase.from('travel_packing').insert(newItems);
        fetchDetails(selectedTrip.id);
        setShowImport(false);
        notify(`Applied ${templateName} template`);
    };

    const importFromVault = async (item) => {
        if (!selectedTrip) return;
        await supabase.from('travel_packing').insert([{
            user_id: user.id,
            trip_id: selectedTrip.id,
            item_name: item.item_name,
            category: item.category,
            quantity: item.quantity,
            is_packed: false,
            is_template: false
        }]);
        fetchDetails(selectedTrip.id);
        notify('Imported from Vault');
    };

    const handleUpdateTrip = async (e) => {
        e.preventDefault();
        if (!selectedTrip) return;
        setLoading(true);

        const { error } = await supabase.from('travel_trips').update({
            name: tripForm.name,
            start_date: tripForm.start_date,
            end_date: tripForm.end_date
        }).eq('id', selectedTrip.id);

        if (!error) {
            const newInterval = eachDayOfInterval({ start: parseISO(tripForm.start_date), end: parseISO(tripForm.end_date) });
            const newDates = newInterval.map(d => format(d, 'yyyy-MM-dd'));
            
            // 1. Delete days that are no longer in range
            await supabase.from('travel_days').delete().eq('trip_id', selectedTrip.id).not('date', 'in', `(${newDates.join(',')})`);

            // 2. Add missing days
            const existingDates = days.map(d => d.date);
            const missingDates = newInterval.filter(d => !existingDates.includes(format(d, 'yyyy-MM-dd')));
            
            if (missingDates.length > 0) {
                const newDayRecords = missingDates.map(date => ({
                    trip_id: selectedTrip.id,
                    date: format(date, 'yyyy-MM-dd'),
                    day_number: 0,
                    destination_city: ''
                }));
                await supabase.from('travel_days').insert(newDayRecords);
            }

            // 3. Re-index
            const { data: updatedDays } = await supabase.from('travel_days').select('*').eq('trip_id', selectedTrip.id).order('date', { ascending: true });
            if (updatedDays) {
                for (let i = 0; i < updatedDays.length; i++) {
                    await supabase.from('travel_days').update({ day_number: i + 1 }).eq('id', updatedDays[i].id);
                }
            }

            fetchTrips();
            const { data: freshTrip } = await supabase.from('travel_trips').select('*').eq('id', selectedTrip.id).single();
            if (freshTrip) setSelectedLocation(freshTrip);
            setIsEditingTrip(false);
            if (fetchData) fetchData();
            notify('Trip details updated');
        }
        setLoading(false);
    };

    const handleAddTrip = async (e) => {
        e.preventDefault();
        setLoading(true);
        const { data: trip, error } = await supabase.from('travel_trips').insert([{ ...tripForm, user_id: user.id }]).select().single();
        if (!error && trip) {
            // Generate Days
            const interval = eachDayOfInterval({ start: parseISO(trip.start_date), end: parseISO(trip.end_date) });
            const dayRecords = interval.map((date, idx) => ({
                trip_id: trip.id,
                day_number: idx + 1,
                date: format(date, 'yyyy-MM-dd'),
                destination_city: ''
            }));
            await supabase.from('travel_days').insert(dayRecords);
            
            setTripForm({ name: '', start_date: format(new Date(), 'yyyy-MM-dd'), end_date: format(addDays(new Date(), 3), 'yyyy-MM-dd'), status: 'draft' });
            setShowAddTrip(false);
            fetchTrips();
            if (fetchData) fetchData();
            notify('Journey created');
        }
        setLoading(false);
    };

    const addPoi = async (dayId, poiName) => {
        if (!poiName) return;
        const { error } = await supabase.from('travel_poi').insert([{ day_id: dayId, name: poiName, user_id: user.id }]);
        if (!error && selectedTrip) fetchDetails(selectedTrip.id);
    };

    const addPackingItem = async (itemName) => {
        if (!itemName || !selectedTrip) return;
        const { error } = await supabase.from('travel_packing').insert([{ 
            trip_id: selectedTrip.id, 
            item_name: itemName, 
            user_id: user.id,
            category: 'gear',
            quantity: 1
        }]);
        if (!error) fetchDetails(selectedTrip.id);
    };

    const updatePackingItem = async (id, updates) => {
        await supabase.from('travel_packing').update(updates).eq('id', id);
        if (selectedTrip) fetchDetails(selectedTrip.id);
    };

    const togglePacked = async (item) => {
        updatePackingItem(item.id, { is_packed: !item.is_packed });
    };

    const deleteTrip = async (id) => {
        const { error } = await supabase.from('travel_trips').delete().eq('id', id);
        if (!error) { fetchTrips(); setSelectedLocation(null); notify('Trip removed'); }
    };

    return (
        <PageContainer>
            <div className="flex justify-between items-center">
                <h3 className="text-2xl font-black text-base-content">Trip Planner</h3>
                {!selectedTrip && (
                    <button onClick={() => setShowAddTrip(!showAddTrip)} className="bg-primary text-primary-content px-6 py-3 rounded-2xl font-bold shadow-lg hover:scale-105 transition-all flex items-center gap-2">
                        <Icon name={showAddTrip ? "X" : "Plus"} size={18} />
                        {showAddTrip ? "Cancel" : "Plan New Trip"}
                    </button>
                )}
            </div>

            {showAddTrip && !selectedTrip && (
                <form onSubmit={handleAddTrip} className="bg-base-200 p-8 rounded-[2.5rem] border border-base-300 shadow-xl space-y-4 animate-in slide-in-from-top-4 duration-300">
                    <input placeholder="Trip Name (e.g. Tokyo Spring '26)" className="w-full bg-base-100 p-4 rounded-xl font-bold outline-none border-2 border-transparent focus:border-primary text-xl" value={tripForm.name} onChange={e => setTripForm({...tripForm, name: e.target.value})} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Start Date</label>
                            <DatePicker value={tripForm.start_date} onChange={(val) => setTripForm({...tripForm, start_date: val})} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-slate-400 ml-2">End Date</label>
                            <DatePicker value={tripForm.end_date} onChange={(val) => setTripForm({...tripForm, end_date: val})} />
                        </div>
                    </div>
                    <button disabled={loading} className="w-full bg-primary text-primary-content py-4 rounded-xl font-black shadow-lg">Begin Planning</button>
                </form>
            )}

            {!selectedTrip ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {trips.map(t => (
                        <div key={t.id} onClick={() => setSelectedLocation(t)} className="bg-base-200 p-8 rounded-[2.5rem] border border-base-300 group hover:border-primary/30 transition-all cursor-pointer shadow-sm">
                            <div className="flex justify-between items-start mb-4">
                                <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full">{t.status}</span>
                                <button onClick={(e) => { e.stopPropagation(); deleteTrip(t.id); }} className="text-slate-400 hover:text-danger opacity-0 group-hover:opacity-100 transition-all"><Icon name="Trash2" size={18} /></button>
                            </div>
                            <h4 className="text-2xl font-black text-base-content mb-2">{t.name}</h4>
                            <p className="text-sm font-bold text-slate-600">{format(parseISO(t.start_date), 'MMM do')} - {format(parseISO(t.end_date), 'MMM do, yyyy')}</p>
                        </div>
                    ))}
                    {trips.length === 0 && !showAddTrip && <div className="md:col-span-2 p-20 text-center text-slate-400 font-bold border-2 border-dashed border-base-300 rounded-[3rem]">No trips planned yet. Click the plus to start!</div>}
                </div>
            ) : (
                <div className="space-y-8 animate-in fade-in duration-500">
                    <button onClick={() => setSelectedLocation(null)} className="flex items-center gap-2 text-primary font-black text-xs uppercase tracking-widest hover:opacity-70 transition-opacity">
                        <Icon name="ArrowLeft" size={16} /> Back to Trips
                    </button>
                    
                    <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                        <div className="flex-1">
                            {isEditingTrip ? (
                                <form onSubmit={handleUpdateTrip} className="space-y-4 bg-base-200 p-6 rounded-[2rem] border border-primary/20 shadow-xl max-w-2xl animate-in zoom-in-95">
                                    <div className="flex justify-between items-center mb-2">
                                        <h4 className="text-xs font-black uppercase tracking-widest text-primary">Edit Trip Details</h4>
                                        <button type="button" onClick={() => setIsEditingTrip(false)} className="text-slate-400 hover:text-base-content"><Icon name="X" size={16} /></button>
                                    </div>
                                    <input placeholder="Trip Name" className="w-full bg-base-100 p-4 rounded-xl font-bold outline-none border-2 border-transparent focus:border-primary text-xl" value={tripForm.name} onChange={e => setTripForm({...tripForm, name: e.target.value})} />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Start Date</label>
                                            <DatePicker value={tripForm.start_date} onChange={(val) => setTripForm({...tripForm, start_date: val})} />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black uppercase text-slate-400 ml-2">End Date</label>
                                            <DatePicker value={tripForm.end_date} onChange={(val) => setTripForm({...tripForm, end_date: val})} />
                                        </div>
                                    </div>
                                    <button disabled={loading} className="w-full bg-primary text-primary-content py-4 rounded-xl font-black shadow-lg">Save Changes</button>
                                </form>
                            ) : (
                                <div className="group relative">
                                    <h3 className="text-4xl font-black text-base-content flex items-center gap-4">
                                        {selectedTrip.name}
                                        <button onClick={() => setIsEditingTrip(true)} className="p-2 bg-base-200 rounded-xl text-slate-400 hover:text-primary transition-all opacity-0 group-hover:opacity-100"><Icon name="Pencil" size={18} /></button>
                                    </h3>
                                    <p className="text-slate-600 font-bold mt-2">{format(parseISO(selectedTrip.start_date), 'MMMM do')} — {format(parseISO(selectedTrip.end_date), 'MMMM do, yyyy')}</p>
                                </div>
                            )}
                        </div>
                        <div className="bg-base-200 p-6 rounded-[2rem] border border-base-300 shadow-sm min-w-[200px]">
                            <div className="flex justify-between items-center mb-2 px-1">
                                <span className="text-[10px] font-black uppercase text-slate-400">Packing Status</span>
                                <span className="text-xs font-black text-primary">{packing.filter(i => i.is_packed).length}/{packing.length}</span>
                            </div>
                            <div className="w-full h-2 bg-base-300 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-primary transition-all duration-500" 
                                    style={{ width: `${(packing.filter(i => i.is_packed).length / (packing.length || 1)) * 100}%` }}
                                />
                            </div>
                        </div>
                    </header>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                        {/* Itinerary Column */}
                        <div className="lg:col-span-2 space-y-6">
                            <h4 className="text-xs font-black uppercase tracking-widest text-primary ml-2">Itinerary</h4>
                            {days.map(day => (
                                <div key={day.id} className="bg-base-200 p-8 rounded-[2.5rem] border border-base-300 shadow-sm">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-primary text-primary-content rounded-2xl flex items-center justify-center font-black text-xl">
                                                {day.day_number}
                                            </div>
                                            <div>
                                                <p className="text-xs font-black uppercase text-slate-400">{format(parseISO(day.date), 'EEEE, MMM do')}</p>
                                                <input 
                                                    className="bg-transparent text-xl font-black text-base-content outline-none placeholder:text-slate-300"
                                                    placeholder="Set Destination..."
                                                    defaultValue={day.destination_city}
                                                    onBlur={async (e) => {
                                                        await supabase.from('travel_days').update({ destination_city: e.target.value }).eq('id', day.id);
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h5 className="text-[10px] font-black uppercase tracking-widest text-primary ml-2">Points of Interest</h5>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {pois.filter(p => p.day_id === day.id).map(poi => (
                                                <div key={poi.id} className="bg-base-100 p-4 rounded-2xl border border-base-300/50 flex justify-between items-center group">
                                                    <span className="font-bold text-sm text-base-content">{poi.name}</span>
                                                    <button 
                                                        onClick={async () => {
                                                            await supabase.from('travel_poi').delete().eq('id', poi.id);
                                                            fetchDetails(selectedTrip.id);
                                                        }}
                                                        className="text-slate-400 hover:text-danger opacity-0 group-hover:opacity-100 transition-all"
                                                    >
                                                        <Icon name="X" size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                            <div className="relative">
                                                <input 
                                                    className="w-full bg-base-100/50 p-4 rounded-2xl border-2 border-dashed border-base-300 text-sm font-bold outline-none focus:border-primary transition-all"
                                                    placeholder="+ Add Place..."
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            addPoi(day.id, e.target.value);
                                                            e.target.value = '';
                                                        }
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Packing Column */}
                        <div className="space-y-6 lg:sticky lg:top-8">
                            <div className="flex justify-between items-center px-2">
                                <h4 className="text-xs font-black uppercase tracking-widest text-primary">Packing List</h4>
                                <button 
                                    onClick={() => setShowImport(!showImport)}
                                    className="p-2 bg-primary/10 text-primary rounded-xl hover:bg-primary hover:text-white transition-all shadow-sm"
                                    title="Import from Vault or Template"
                                >
                                    <Icon name="Library" size={16} />
                                </button>
                            </div>

                            {showImport && (
                                <div className="bg-base-200 p-6 rounded-[2.5rem] border-2 border-primary/20 shadow-xl space-y-6 animate-in zoom-in-95 duration-200">
                                    <div className="flex justify-between items-center">
                                        <h5 className="font-black text-xs uppercase tracking-widest">Templates</h5>
                                        <button onClick={() => setShowImport(false)} className="text-slate-400 hover:text-base-content"><Icon name="X" size={16} /></button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {[...new Set(allPacking.filter(i => i.is_template).map(i => i.template_name))].map(name => (
                                            <button 
                                                key={name}
                                                onClick={() => applyTemplate(name)}
                                                className="px-4 py-2 bg-base-100 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all border border-base-300 shadow-sm"
                                            >
                                                Apply {name}
                                            </button>
                                        ))}
                                        {allPacking.filter(i => i.is_template).length === 0 && <p className="text-[10px] font-bold text-slate-400">No templates found.</p>}
                                    </div>

                                    <div className="pt-4 border-t border-base-300">
                                        <h5 className="font-black text-xs uppercase tracking-widest mb-4">Gear Vault</h5>
                                        <div className="max-h-60 overflow-y-auto pr-2 space-y-2 no-scrollbar">
                                            {allPacking.filter(i => !i.is_template && !i.trip_id).map(item => (
                                                <button 
                                                    key={item.id}
                                                    onClick={() => importFromVault(item)}
                                                    className="w-full text-left p-3 bg-base-100 rounded-xl text-xs font-bold hover:bg-primary/5 border border-transparent hover:border-primary/20 transition-all flex justify-between items-center"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-5 h-5 bg-base-200 rounded flex items-center justify-center text-[8px]">{item.quantity}</span>
                                                        {item.item_name}
                                                    </div>
                                                    <span className="text-[8px] uppercase tracking-tighter text-slate-400 font-black">{item.category}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="bg-base-200 p-6 rounded-[2.5rem] border border-base-300 shadow-sm space-y-4">
                                <input 
                                    className="w-full bg-base-100 p-4 rounded-2xl border border-base-300 text-sm font-bold outline-none focus:border-primary"
                                    placeholder="+ Quick add item..."
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            addPackingItem(e.target.value);
                                            e.target.value = '';
                                        }
                                    }}
                                />
                                <div className="space-y-2">
                                    {packing.map(item => (
                                        <div key={item.id} className="bg-base-100/50 p-4 rounded-2xl flex flex-col gap-2 group transition-all hover:bg-base-100">
                                            <div className="flex justify-between items-center">
                                                <button onClick={() => togglePacked(item)} className="flex items-center gap-3 flex-1 text-left">
                                                    <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${item.is_packed ? 'bg-success border-success text-white' : 'border-base-300'}`}>
                                                        {item.is_packed && <Icon name="Check" size={12} />}
                                                    </div>
                                                    <span className={`font-bold text-sm ${item.is_packed ? 'text-slate-400 line-through' : 'text-base-content'}`}>
                                                        {item.quantity > 1 && <span className="text-primary mr-1">{item.quantity}x</span>}
                                                        {item.item_name}
                                                    </span>
                                                </button>
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                                    <button onClick={() => updatePackingItem(item.id, { quantity: Math.max(1, item.quantity - 1) })} className="p-1 hover:bg-base-200 rounded"><Icon name="Minus" size={10} /></button>
                                                    <button onClick={() => updatePackingItem(item.id, { quantity: item.quantity + 1 })} className="p-1 hover:bg-base-200 rounded"><Icon name="Plus" size={10} /></button>
                                                    <button 
                                                        onClick={async () => {
                                                            await supabase.from('travel_packing').delete().eq('id', item.id);
                                                            fetchDetails(selectedTrip.id);
                                                        }}
                                                        className="text-slate-400 hover:text-danger p-1 ml-1"
                                                    >
                                                        <Icon name="Trash2" size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {packing.length === 0 && (
                                        <p className="text-[10px] font-black uppercase text-slate-400 text-center py-4">No specific items linked.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </PageContainer>
    );
};

export default TravelTrips;
