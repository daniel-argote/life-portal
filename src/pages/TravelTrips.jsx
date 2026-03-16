import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import Icon from '../components/Icon';
import PageContainer from '../components/PageContainer';
import DatePicker from '../components/DatePicker';
import { format, addDays, eachDayOfInterval, parseISO } from 'date-fns';

const TravelTrips = ({ user, notify }) => {
    const [trips, setTrips] = useState([]);
    const [selectedTrip, setSelectedLocation] = useState(null);
    const [days, setDays] = useState([]);
    const [pois, setPois] = useState([]);
    const [showAddTrip, setShowAddTrip] = useState(false);
    const [loading, setLoading] = useState(false);
    
    const [tripForm, setTripForm] = useState({ name: '', start_date: format(new Date(), 'yyyy-MM-dd'), end_date: format(addDays(new Date(), 3), 'yyyy-MM-dd'), status: 'draft' });

    const fetchTrips = useCallback(async () => {
        if (!user) return;
        const { data } = await supabase.from('travel_trips').select('*').order('start_date', { ascending: true });
        setTrips(data || []);
    }, [user]);

    const fetchDetails = useCallback(async (tripId) => {
        const { data: dData } = await supabase.from('travel_days').select('*').eq('trip_id', tripId).order('day_number', { ascending: true });
        setDays(dData || []);
        const { data: pData } = await supabase.from('travel_poi').select('*').in('day_id', dData?.map(d => d.id) || []);
        setPois(pData || []);
    }, []);

    useEffect(() => { fetchTrips(); }, [fetchTrips]);
    useEffect(() => { if (selectedTrip) fetchDetails(selectedTrip.id); }, [selectedTrip, fetchDetails]);

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
            notify('Journey created');
        }
        setLoading(false);
    };

    const addPoi = async (dayId, poiName) => {
        if (!poiName) return;
        const { error } = await supabase.from('travel_poi').insert([{ day_id: dayId, name: poiName, user_id: user.id }]);
        if (!error && selectedTrip) fetchDetails(selectedTrip.id);
    };

    const deleteTrip = async (id) => {
        const { error } = await supabase.from('travel_trips').delete().eq('id', id);
        if (!error) { fetchTrips(); setSelectedLocation(null); notify('Trip removed'); }
    };

    return (
        <PageContainer>
            <div className="flex justify-between items-center">
                <h3 className="text-2xl font-black text-base-content">Trip Planner</h3>
                <button onClick={() => setShowAddTrip(!showAddTrip)} className="bg-primary text-primary-content px-6 py-3 rounded-2xl font-bold shadow-lg hover:scale-105 transition-all flex items-center gap-2">
                    <Icon name={showAddTrip ? "X" : "Plus"} size={18} />
                    {showAddTrip ? "Cancel" : "Plan New Trip"}
                </button>
            </div>

            {showAddTrip && (
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
                    
                    <header>
                        <h3 className="text-4xl font-black text-base-content">{selectedTrip.name}</h3>
                        <p className="text-slate-600 font-bold mt-2">{format(parseISO(selectedTrip.start_date), 'MMMM do')} — {format(parseISO(selectedTrip.end_date), 'MMMM do, yyyy')}</p>
                    </header>

                    <div className="grid grid-cols-1 gap-6">
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
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
                </div>
            )}
        </PageContainer>
    );
};

export default TravelTrips;
