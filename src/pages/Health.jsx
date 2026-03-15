import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import Icon from '../components/Icon';
import EditableHeader from '../components/EditableHeader';
import DatePicker from '../components/DatePicker';
import { format } from 'date-fns';

const Health = ({ user, notify, pageName, setPageName, showHeaders }) => {
    const [activeTab, setActiveTab] = useState('metrics');
    const [loading, setLoading] = useState(false);

    // Data State
    const [items, setItems] = useState([]);
    const [appointments, setAppointments] = useState([]);

    const fetchData = useCallback(async () => {
        if (!user) return;
        
        // Fetch Metrics
        const { data: metrics, error: metricsError } = await supabase.from('health').select('*').order('created_at', { ascending: false });
        if (!metricsError) setItems(metrics || []);

        // Fetch Appointments
        const { data: appts, error: apptsError } = await supabase.from('health_appointments').select('*').order('date', { ascending: true });
        if (!apptsError) setAppointments(appts || []);
    }, [user]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const MetricsTab = () => {
        const [form, setForm] = useState({ metric: 'Weight', value: '' });

        const handleSubmit = async (e) => {
            e.preventDefault();
            if (!form.value) return;
            setLoading(true);
            const { error } = await supabase.from('health').insert([{ ...form, user_id: user.id }]);
            if (!error) {
                setForm({ ...form, value: '' });
                fetchData();
                if (notify) notify('Health record saved');
            }
            setLoading(false);
        };

        const deleteItem = async (id) => {
            const { error } = await supabase.from('health').delete().eq('id', id);
            if (!error) { fetchData(); if (notify) notify('Record deleted'); }
        };

        return (
            <div className="space-y-8 animate-in fade-in duration-500">
                <form onSubmit={handleSubmit} className="bg-base-200 p-6 rounded-[2rem] border border-base-300 shadow-sm flex flex-col md:flex-row gap-4">
                    <select
                        className="bg-base-100 p-4 rounded-xl font-bold outline-none text-base-content min-w-[140px]"
                        value={form.metric}
                        onChange={e => setForm({ ...form, metric: e.target.value })}
                    >
                        <option>Weight</option>
                        <option>Steps</option>
                        <option>Sleep</option>
                        <option>Water</option>
                        <option>Mood</option>
                    </select>
                    <input
                        type="text"
                        placeholder="Value (e.g. 180 lbs)"
                        className="flex-1 bg-base-100 p-4 rounded-xl font-bold outline-none text-base-content border-2 border-transparent focus:border-primary transition-all"
                        value={form.value}
                        onChange={e => setForm({ ...form, value: e.target.value })}
                    />
                    <button disabled={loading} className="bg-primary text-primary-content p-4 rounded-xl font-bold shadow-lg hover:scale-105 transition-transform disabled:opacity-50">
                        <Icon name="Plus" size={24} />
                    </button>
                </form>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {items.map(item => (
                        <div key={item.id} className="bg-base-200 p-6 rounded-[2rem] border border-base-300 flex justify-between items-center group shadow-sm transition-all hover:border-primary/30">
                            <div>
                                <p className="text-xs font-black text-slate-600 uppercase tracking-widest mb-1">{item.metric}</p>
                                <p className="text-2xl font-black text-base-content">{item.value}</p>
                                <p className="text-[10px] font-bold text-slate-600 mt-2">{new Date(item.created_at).toLocaleDateString()} {new Date(item.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                            </div>
                            <button onClick={() => deleteItem(item.id)} className="text-slate-600 hover:text-danger opacity-0 group-hover:opacity-100 transition-all">
                                <Icon name="Trash2" size={20} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const AppointmentsTab = () => {
        const [showAdd, setShowAdd] = useState(false);
        const [form, setForm] = useState({ provider: '', type: 'Checkup', date: format(new Date(), 'yyyy-MM-dd'), time: '', notes: '' });

        const handleAdd = async (e) => {
            e.preventDefault();
            if (!form.provider || !form.date) return;
            setLoading(true);
            const { error } = await supabase.from('health_appointments').insert([{ ...form, user_id: user.id }]);
            if (!error) {
                setForm({ provider: '', type: 'Checkup', date: format(new Date(), 'yyyy-MM-dd'), time: '', notes: '' });
                setShowAdd(false);
                fetchData();
                if (notify) notify('Appointment scheduled');
            }
            setLoading(false);
        };

        const deleteAppt = async (id) => {
            const { error } = await supabase.from('health_appointments').delete().eq('id', id);
            if (!error) { fetchData(); if (notify) notify('Appointment removed'); }
        };

        return (
            <div className="space-y-6 animate-in fade-in duration-500">
                <div className="flex justify-between items-center">
                    <h3 className="text-2xl font-black text-base-content">Upcoming Appointments</h3>
                    <button onClick={() => setShowAdd(!showAdd)} className="bg-primary/10 text-primary px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-primary hover:text-primary-content transition-all">
                        <Icon name={showAdd ? "X" : "Plus"} size={18} />
                        {showAdd ? "Cancel" : "New Appointment"}
                    </button>
                </div>

                {showAdd && (
                    <form onSubmit={handleAdd} className="bg-base-200 p-8 rounded-[2.5rem] border border-base-300 shadow-xl space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input placeholder="Provider (e.g. Dr. Smith)" className="w-full bg-base-100 p-4 rounded-xl font-bold outline-none border-2 border-transparent focus:border-primary" value={form.provider} onChange={e => setForm({...form, provider: e.target.value})} />
                            <select className="w-full bg-base-100 p-4 rounded-xl font-bold outline-none" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                                <option>Checkup</option>
                                <option>Dental</option>
                                <option>Vision</option>
                                <option>Specialist</option>
                                <option>Therapy</option>
                                <option>Other</option>
                            </select>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <DatePicker value={form.date} onChange={(val) => setForm({...form, date: val})} />
                            <input type="time" className="w-full bg-base-100 p-4 rounded-xl font-bold outline-none" value={form.time} onChange={e => setForm({...form, time: e.target.value})} />
                        </div>
                        <textarea placeholder="Notes (optional)..." className="w-full h-24 bg-base-100 p-4 rounded-xl font-bold outline-none resize-none" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
                        <button disabled={loading} className="w-full bg-primary text-primary-content py-4 rounded-xl font-black shadow-lg">Save Appointment</button>
                    </form>
                )}

                <div className="grid gap-4">
                    {appointments.map(appt => (
                        <div key={appt.id} className="bg-base-200 p-6 rounded-[2rem] border border-base-300 flex items-center gap-6 group hover:border-primary/30 transition-all">
                            <div className="text-center min-w-[80px]">
                                <p className="text-[10px] font-black uppercase text-slate-600">{format(new Date(appt.date.replace(/-/g, '\/')), 'MMM')}</p>
                                <p className="text-2xl font-black text-base-content">{format(new Date(appt.date.replace(/-/g, '\/')), 'd')}</p>
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[8px] font-black uppercase tracking-tighter bg-primary/10 text-primary px-2 py-0.5 rounded">{appt.type}</span>
                                </div>
                                <h4 className="text-xl font-black text-base-content">{appt.provider}</h4>
                                {appt.time && <p className="text-xs font-bold text-slate-600 mt-1">{appt.time}</p>}
                            </div>
                            <button onClick={() => deleteAppt(appt.id)} className="text-slate-600 hover:text-danger opacity-0 group-hover:opacity-100 transition-all p-2">
                                <Icon name="Trash2" size={20} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-8 pb-20">
            {showHeaders && (
                <EditableHeader 
                    value={pageName} 
                    onSave={setPageName} 
                    subtext="Health & Biometrics" 
                />
            )}

            <div className="flex gap-2 p-1 bg-base-200 rounded-2xl w-fit border border-base-300">
                {[
                    { id: 'metrics', label: 'Metrics', icon: 'Activity' },
                    { id: 'appointments', label: 'Appointments', icon: 'CalendarDays' }
                ].map(t => (
                    <button
                        key={t.id}
                        onClick={() => setActiveTab(t.id)}
                        className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all ${activeTab === t.id ? 'bg-primary text-primary-content shadow-md' : 'text-slate-600 hover:text-primary hover:bg-base-300/50'}`}
                    >
                        <Icon name={t.icon} size={14} />
                        {t.label}
                    </button>
                ))}
            </div>

            <div>
                {activeTab === 'metrics' && <MetricsTab />}
                {activeTab === 'appointments' && <AppointmentsTab />}
            </div>
        </div>
    );
};

export default Health;