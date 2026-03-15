import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import Icon from '../components/Icon';
import DatePicker from '../components/DatePicker';
import { format } from 'date-fns';

const HealthAppointments = ({ user, notify }) => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showAdd, setShowAdd] = useState(false);
    const [form, setForm] = useState({ provider: '', type: 'Checkup', date: format(new Date(), 'yyyy-MM-dd'), time: '', notes: '' });

    const fetchData = useCallback(async () => {
        if (!user) return;
        const { data } = await supabase.from('health_appointments').select('*').order('date', { ascending: true });
        setAppointments(data || []);
    }, [user]);

    useEffect(() => { fetchData(); }, [fetchData]);

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
        <div className="space-y-8 pb-20">
            <div className="flex justify-between items-center">
                <h3 className="text-2xl font-black text-base-content">Upcoming Appointments</h3>
                <button onClick={() => setShowAdd(!showAdd)} className="bg-primary/10 text-primary px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-primary hover:text-primary-content transition-all">
                    <Icon name={showAdd ? "X" : "Plus"} size={18} />
                    {showAdd ? "Cancel" : "New Appointment"}
                </button>
            </div>

            {showAdd && (
                <form onSubmit={handleAdd} className="bg-base-200 p-8 rounded-[2.5rem] border border-base-300 shadow-xl space-y-4 animate-in slide-in-from-top-4 duration-300">
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
                    <div key={appt.id} className="bg-base-200 p-6 rounded-[2rem] border border-base-300 flex items-center gap-6 group hover:border-primary/30 transition-all shadow-sm">
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
                {appointments.length === 0 && <div className="p-12 text-center text-slate-600 font-black uppercase tracking-widest border-2 border-dashed border-base-300 rounded-[2rem]">No upcoming appointments</div>}
            </div>
        </div>
    );
};

export default HealthAppointments;
