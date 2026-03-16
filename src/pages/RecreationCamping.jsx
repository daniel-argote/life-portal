import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import Icon from '../components/Icon';
import PageContainer from '../components/PageContainer';
import DatePicker from '../components/DatePicker';
import { format, isAfter, parseISO } from 'date-fns';

const RecreationCamping = ({ user, notify }) => {
    const [camping, setCamping] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showAdd, setShowAdd] = useState(false);
    const [form, setForm] = useState({ 
        site_name: '', 
        location: '', 
        start_date: format(new Date(), 'yyyy-MM-dd'),
        end_date: format(addDays(new Date(), 2), 'yyyy-MM-dd'),
        type: 'tent',
        amenities: [],
        notes: '',
        is_favorite: false
    });

    const AMENITIES_LIST = ['Water', 'Fire Pit', 'Showers', 'WiFi', 'Power', 'Pets Allowed', 'Toilets'];

    function addDays(date, days) {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    }

    const fetchCamping = useCallback(async () => {
        if (!user) return;
        const { data } = await supabase.from('recreation_camping').select('*').order('start_date', { ascending: true });
        setCamping(data || []);
    }, [user]);

    useEffect(() => { fetchCamping(); }, [fetchCamping]);

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!form.site_name) return;
        setLoading(true);
        const { error } = await supabase.from('recreation_camping').insert([{ ...form, user_id: user.id }]);
        if (!error) {
            setForm({ 
                site_name: '', location: '', start_date: format(new Date(), 'yyyy-MM-dd'), 
                end_date: format(addDays(new Date(), 2), 'yyyy-MM-dd'), type: 'tent', 
                amenities: [], notes: '', is_favorite: false 
            });
            setShowAdd(false);
            fetchCamping();
            notify('Camping trip scheduled');
        }
        setLoading(false);
    };

    const deleteTrip = async (id) => {
        const { error } = await supabase.from('recreation_camping').delete().eq('id', id);
        if (!error) { fetchCamping(); notify('Trip removed'); }
    };

    const toggleFavorite = async (trip) => {
        await supabase.from('recreation_camping').update({ is_favorite: !trip.is_favorite }).eq('id', trip.id);
        fetchCamping();
    };

    const toggleAmenity = (amenity) => {
        const newAmenities = form.amenities.includes(amenity)
            ? form.amenities.filter(a => a !== amenity)
            : [...form.amenities, amenity];
        setForm({ ...form, amenities: newAmenities });
    };

    return (
        <PageContainer>
            <div className="flex justify-between items-center">
                <h3 className="text-2xl font-black text-base-content">Campsite Tracker</h3>
                <button onClick={() => setShowAdd(!showAdd)} className="bg-primary/10 text-primary px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-primary hover:text-primary-content transition-all shadow-sm">
                    <Icon name={showAdd ? "X" : "Plus"} size={18} />
                    {showAdd ? "Cancel" : "New Trip"}
                </button>
            </div>

            {showAdd && (
                <form onSubmit={handleAdd} className="bg-base-200 p-8 rounded-[2.5rem] border border-base-300 shadow-xl space-y-6 animate-in slide-in-from-top-4 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input placeholder="Site/Park Name" className="w-full bg-base-100 p-4 rounded-xl font-bold outline-none border-2 border-transparent focus:border-primary" value={form.site_name} onChange={e => setForm({...form, site_name: e.target.value})} />
                        <input placeholder="Location (City, State)" className="w-full bg-base-100 p-4 rounded-xl font-bold outline-none border-2 border-transparent focus:border-primary" value={form.location} onChange={e => setForm({...form, location: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Start Date</label>
                            <DatePicker value={form.start_date} onChange={(val) => setForm({...form, start_date: val})} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-slate-400 ml-2">End Date</label>
                            <DatePicker value={form.end_date} onChange={(val) => setForm({...form, end_date: val})} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Type</label>
                            <select className="w-full bg-base-100 p-4 rounded-xl font-bold outline-none" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                                <option value="tent">Tent</option>
                                <option value="rv">RV / Trailer</option>
                                <option value="cabin">Cabin</option>
                                <option value="backcountry">Backcountry</option>
                            </select>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Amenities</label>
                        <div className="flex flex-wrap gap-2">
                            {AMENITIES_LIST.map(amenity => (
                                <button key={amenity} type="button" onClick={() => toggleAmenity(amenity)} className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all border-2 ${form.amenities.includes(amenity) ? 'bg-primary border-primary text-primary-content' : 'bg-base-100 border-transparent text-slate-500 hover:border-primary/30'}`}>
                                    {amenity}
                                </button>
                            ))}
                        </div>
                    </div>
                    <button disabled={loading} className="w-full bg-primary text-primary-content py-4 rounded-xl font-black shadow-lg">Confirm Adventure</button>
                </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {camping.map(trip => {
                    const isUpcoming = isAfter(parseISO(trip.start_date), new Date());
                    return (
                        <div key={trip.id} className="bg-base-200 rounded-[2.5rem] border border-base-300 group hover:border-primary/30 transition-all shadow-sm flex flex-col">
                            <div className="p-8">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex gap-2">
                                        <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded ${isUpcoming ? 'bg-primary text-primary-content' : 'bg-base-300 text-slate-500'}`}>
                                            {isUpcoming ? 'Upcoming' : 'Past'}
                                        </span>
                                        <span className="text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded bg-indigo-500/10 text-indigo-500">
                                            {trip.type}
                                        </span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => toggleFavorite(trip)} className={`text-xl transition-all ${trip.is_favorite ? 'text-warning' : 'text-slate-300 hover:text-warning'}`}>
                                            <Icon name="Star" size={20} fill={trip.is_favorite ? "currentColor" : "none"} />
                                        </button>
                                        <button onClick={() => deleteTrip(trip.id)} className="text-slate-400 hover:text-danger opacity-0 group-hover:opacity-100 transition-all"><Icon name="Trash2" size={20} /></button>
                                    </div>
                                </div>
                                <h4 className="text-2xl font-black text-base-content leading-tight mb-1">{trip.site_name}</h4>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">{trip.location}</p>
                                <div className="flex items-center gap-2 text-primary font-black text-xs uppercase tracking-widest mb-6">
                                    <Icon name="Calendar" size={14} />
                                    {format(parseISO(trip.start_date), 'MMM d')} - {format(parseISO(trip.end_date), 'MMM d, yyyy')}
                                </div>
                                {trip.amenities?.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mt-auto pt-4 border-t border-base-300/50">
                                        {trip.amenities.map(a => (
                                            <span key={a} className="text-[10px] font-bold text-slate-600 bg-base-100 px-2 py-1 rounded-lg">{a}</span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
                {camping.length === 0 && !showAdd && <div className="md:col-span-2 p-20 text-center text-slate-400 font-bold border-2 border-dashed border-base-300 rounded-[3rem]">No camping trips found. Pack your gear!</div>}
            </div>
        </PageContainer>
    );
};

export default RecreationCamping;
