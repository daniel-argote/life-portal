import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import Icon from '../components/Icon';
import PageContainer from '../components/PageContainer';
import DatePicker from '../components/DatePicker';
import { format } from 'date-fns';

const RecreationHikes = ({ user, notify }) => {
    const [hikes, setHikes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showAdd, setShowAdd] = useState(false);
    const [form, setForm] = useState({ 
        name: '', 
        location: '', 
        distance: '', 
        elevation_gain: '', 
        date: format(new Date(), 'yyyy-MM-dd'),
        difficulty: 'moderate',
        rating: 3,
        notes: ''
    });

    const fetchHikes = useCallback(async () => {
        if (!user) return;
        const { data } = await supabase.from('recreation_hikes').select('*').order('date', { ascending: false });
        setHikes(data || []);
    }, [user]);

    useEffect(() => { fetchHikes(); }, [fetchHikes]);

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!form.name) return;
        setLoading(true);
        const { error } = await supabase.from('recreation_hikes').insert([{ 
            ...form, 
            distance: form.distance ? parseFloat(form.distance) : null,
            elevation_gain: form.elevation_gain ? parseInt(form.elevation_gain) : null,
            user_id: user.id 
        }]);
        
        if (!error) {
            setForm({ 
                name: '', location: '', distance: '', elevation_gain: '', 
                date: format(new Date(), 'yyyy-MM-dd'), difficulty: 'moderate', rating: 3, notes: '' 
            });
            setShowAdd(false);
            fetchHikes();
            notify('Hike logged!');
        }
        setLoading(false);
    };

    const deleteHike = async (id) => {
        const { error } = await supabase.from('recreation_hikes').delete().eq('id', id);
        if (!error) { fetchHikes(); notify('Hike removed'); }
    };

    return (
        <PageContainer>
            <div className="flex justify-between items-center">
                <h3 className="text-2xl font-black text-base-content">Trail Logs</h3>
                <button onClick={() => setShowAdd(!showAdd)} className="bg-primary/10 text-primary px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-primary hover:text-primary-content transition-all shadow-sm">
                    <Icon name={showAdd ? "X" : "Plus"} size={18} />
                    {showAdd ? "Cancel" : "Log Hike"}
                </button>
            </div>

            {showAdd && (
                <form onSubmit={handleAdd} className="bg-base-200 p-8 rounded-[2.5rem] border border-base-300 shadow-xl space-y-4 animate-in slide-in-from-top-4 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input placeholder="Trail Name" className="w-full bg-base-100 p-4 rounded-xl font-bold outline-none border-2 border-transparent focus:border-primary" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                        <input placeholder="Location" className="w-full bg-base-100 p-4 rounded-xl font-bold outline-none border-2 border-transparent focus:border-primary" value={form.location} onChange={e => setForm({...form, location: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <input type="number" step="0.1" placeholder="Distance (mi)" className="w-full bg-base-100 p-4 rounded-xl font-bold outline-none border-2 border-transparent focus:border-primary" value={form.distance} onChange={e => setForm({...form, distance: e.target.value})} />
                        <input type="number" placeholder="Elevation (ft)" className="w-full bg-base-100 p-4 rounded-xl font-bold outline-none border-2 border-transparent focus:border-primary" value={form.elevation_gain} onChange={e => setForm({...form, elevation_gain: e.target.value})} />
                        <DatePicker value={form.date} onChange={(val) => setForm({...form, date: val})} />
                        <select className="w-full bg-base-100 p-4 rounded-xl font-bold outline-none" value={form.difficulty} onChange={e => setForm({...form, difficulty: e.target.value})}>
                            <option value="easy">Easy</option>
                            <option value="moderate">Moderate</option>
                            <option value="hard">Hard</option>
                            <option value="strenuous">Strenuous</option>
                        </select>
                    </div>
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <textarea placeholder="Trail notes..." className="w-full h-24 bg-base-100 p-4 rounded-xl font-bold outline-none resize-none border-2 border-transparent focus:border-primary" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
                        </div>
                        <div className="w-full md:w-48 bg-base-100 p-4 rounded-xl flex flex-col justify-center items-center gap-2">
                            <p className="text-[10px] font-black uppercase text-slate-400">Rating</p>
                            <div className="flex gap-1">
                                {[1,2,3,4,5].map(star => (
                                    <button key={star} type="button" onClick={() => setForm({...form, rating: star})} className={`transition-colors ${form.rating >= star ? 'text-warning' : 'text-slate-300'}`}>
                                        <Icon name="Star" size={20} fill={form.rating >= star ? "currentColor" : "none"} />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <button disabled={loading} className="w-full bg-primary text-primary-content py-4 rounded-xl font-black shadow-lg">Save to Trail Log</button>
                </form>
            )}

            <div className="grid grid-cols-1 gap-4">
                {hikes.map(hike => (
                    <div key={hike.id} className="bg-base-200 p-6 rounded-[2rem] border border-base-300 flex flex-col md:flex-row md:items-center gap-6 group hover:border-primary/30 transition-all shadow-sm">
                        <div className="text-center min-w-[80px] bg-base-100 p-4 rounded-2xl">
                            <p className="text-[10px] font-black uppercase text-slate-400">{format(new Date(hike.date.replace(/-/g, '/')), 'MMM')}</p>
                            <p className="text-2xl font-black text-base-content">{format(new Date(hike.date.replace(/-/g, '/')), 'd')}</p>
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`text-[8px] font-black uppercase tracking-tighter px-2 py-0.5 rounded ${hike.difficulty === 'hard' || hike.difficulty === 'strenuous' ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'}`}>
                                    {hike.difficulty}
                                </span>
                                <div className="flex gap-0.5">
                                    {[...Array(5)].map((_, i) => (
                                        <Icon key={i} name="Star" size={10} className={i < hike.rating ? 'text-warning' : 'text-slate-300'} fill={i < hike.rating ? 'currentColor' : 'none'} />
                                    ))}
                                </div>
                            </div>
                            <h4 className="text-xl font-black text-base-content leading-tight">{hike.name}</h4>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">{hike.location}</p>
                        </div>
                        <div className="flex gap-8 items-center pr-4">
                            <div className="text-center">
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">Distance</p>
                                <p className="text-lg font-black text-primary">{hike.distance} <span className="text-xs">mi</span></p>
                            </div>
                            <div className="text-center">
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">Gain</p>
                                <p className="text-lg font-black text-indigo-500">{hike.elevation_gain?.toLocaleString()} <span className="text-xs">ft</span></p>
                            </div>
                            <button onClick={() => deleteHike(hike.id)} className="text-slate-400 hover:text-danger opacity-0 group-hover:opacity-100 transition-all p-2">
                                <Icon name="Trash2" size={20} />
                            </button>
                        </div>
                    </div>
                ))}
                {hikes.length === 0 && !showAdd && <div className="p-20 text-center text-slate-400 font-bold border-2 border-dashed border-base-300 rounded-[3rem]">No trails logged yet. Time to hit the peaks!</div>}
            </div>
        </PageContainer>
    );
};

export default RecreationHikes;
