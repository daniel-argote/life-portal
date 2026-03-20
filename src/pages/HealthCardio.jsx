import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import Icon from '../components/Icon';
import PageContainer from '../components/PageContainer';
import { format } from 'date-fns';

const HealthCardio = ({ user, notify }) => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        activity_type: 'Running',
        duration_minutes: '',
        distance_km: '',
        limiting_factor: 'cardio',
        notes: ''
    });

    const fetchLogs = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        const { data, error } = await supabase
            .from('health_cardio_logs')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) notify(error.message, 'error');
        else setLogs(data || []);
        setLoading(false);
    }, [user, notify]);

    useEffect(() => { fetchLogs(); }, [fetchLogs]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.duration_minutes) return notify('Duration is required', 'error');

        const { error } = await supabase.from('health_cardio_logs').insert([{
            ...form,
            user_id: user.id,
            duration_minutes: parseInt(form.duration_minutes),
            distance_km: parseFloat(form.distance_km) || null
        }]);

        if (error) notify(error.message, 'error');
        else {
            notify('Cardio session logged');
            setForm({
                activity_type: 'Running',
                duration_minutes: '',
                distance_km: '',
                limiting_factor: 'cardio',
                notes: ''
            });
            fetchLogs();
        }
    };

    const deleteLog = async (id) => {
        const { error } = await supabase.from('health_cardio_logs').delete().eq('id', id);
        if (error) notify(error.message, 'error');
        else {
            notify('Log removed');
            fetchLogs();
        }
    };

    const getFactorIcon = (factor) => {
        if (factor === 'musculoskeletal') return 'Activity';
        if (factor === 'cardio') return 'Heart';
        if (factor === 'pulmonary') return 'Wind';
        return 'AlertCircle';
    };

    return (
        <PageContainer>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Logging Form */}
                <div className="lg:col-span-1">
                    <div className="bg-base-200 p-8 rounded-[2.5rem] border border-base-300 shadow-sm sticky top-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-primary/10 text-primary rounded-2xl">
                                <Icon name="Zap" size={24} />
                            </div>
                            <h3 className="font-black text-xl">Log Cardio</h3>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black uppercase text-slate-500 ml-4 mb-1 block">Activity Type</label>
                                <select 
                                    className="w-full bg-base-100 p-4 rounded-2xl border border-base-300 font-bold outline-none focus:border-primary transition-colors"
                                    value={form.activity_type}
                                    onChange={e => setForm({...form, activity_type: e.target.value})}
                                >
                                    {['Running', 'Cycling', 'Swimming', 'Hiking', 'Rowing', 'Walking', 'Other'].map(t => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black uppercase text-slate-500 ml-4 mb-1 block">Duration (min)</label>
                                    <input 
                                        type="number"
                                        placeholder="30"
                                        className="w-full bg-base-100 p-4 rounded-2xl border border-base-300 font-bold outline-none focus:border-primary transition-colors"
                                        value={form.duration_minutes}
                                        onChange={e => setForm({...form, duration_minutes: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase text-slate-500 ml-4 mb-1 block">Distance (km)</label>
                                    <input 
                                        type="number"
                                        step="0.1"
                                        placeholder="5.0"
                                        className="w-full bg-base-100 p-4 rounded-2xl border border-base-300 font-bold outline-none focus:border-primary transition-colors"
                                        value={form.distance_km}
                                        onChange={e => setForm({...form, distance_km: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black uppercase text-slate-500 ml-4 mb-1 block">Limiting Factor</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { id: 'musculoskeletal', label: 'Muscle', icon: 'Activity' },
                                        { id: 'cardio', label: 'Heart', icon: 'Heart' },
                                        { id: 'pulmonary', label: 'Lungs', icon: 'Wind' }
                                    ].map(f => (
                                        <button
                                            key={f.id}
                                            type="button"
                                            onClick={() => setForm({...form, limiting_factor: f.id})}
                                            className={`p-3 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 ${form.limiting_factor === f.id ? 'border-primary bg-primary/5 text-primary' : 'border-base-300 text-slate-400 grayscale'}`}
                                        >
                                            <Icon name={f.icon} size={16} />
                                            <span className="text-[10px] font-black uppercase tracking-tighter">{f.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black uppercase text-slate-500 ml-4 mb-1 block">Notes</label>
                                <textarea 
                                    placeholder="How did it feel?"
                                    className="w-full bg-base-100 p-4 rounded-2xl border border-base-300 font-bold outline-none focus:border-primary transition-colors h-24 resize-none"
                                    value={form.notes}
                                    onChange={e => setForm({...form, notes: e.target.value})}
                                />
                            </div>

                            <button type="submit" className="w-full bg-primary text-primary-content p-4 rounded-2xl font-black uppercase tracking-widest shadow-lg active:scale-[0.98] transition-all">
                                Save Session
                            </button>
                        </form>
                    </div>
                </div>

                {/* History */}
                <div className="lg:col-span-2 space-y-6">
                    {logs.length > 0 ? (
                        logs.map(log => (
                            <div key={log.id} className="bg-base-200 p-6 rounded-[2rem] border border-base-300 flex items-center gap-6 group">
                                <div className="p-4 bg-base-100 rounded-2xl border border-base-300/50">
                                    <Icon name={getFactorIcon(log.limiting_factor)} size={24} className="text-primary" />
                                </div>
                                
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-1">
                                        <h4 className="font-black text-xl">{log.activity_type}</h4>
                                        <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-primary/10 text-primary rounded-md">
                                            {log.limiting_factor} limited
                                        </span>
                                    </div>
                                    <p className="text-slate-500 font-bold text-sm">
                                        {format(new Date(log.created_at), 'EEEE, MMM do')} • {log.duration_minutes}m {log.distance_km ? `• ${log.distance_km}km` : ''}
                                    </p>
                                    {log.notes && <p className="mt-2 text-slate-600 font-medium italic text-sm">"{log.notes}"</p>}
                                </div>

                                <button 
                                    onClick={() => deleteLog(log.id)}
                                    className="p-3 text-slate-400 hover:text-danger hover:bg-danger/10 rounded-2xl transition-all opacity-0 group-hover:opacity-100"
                                >
                                    <Icon name="Trash2" size={20} />
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-base-200/50 rounded-[3rem] border-4 border-dashed border-base-300 p-12 text-center">
                            <Icon name="CloudRain" size={48} className="text-slate-300 mb-4" />
                            <h3 className="font-black text-slate-400 text-xl">No cardio history found.</h3>
                            <p className="text-slate-400 font-bold max-w-xs mt-2">Log your first session on the left to start tracking your performance.</p>
                        </div>
                    )}
                </div>
            </div>
        </PageContainer>
    );
};

export default HealthCardio;
