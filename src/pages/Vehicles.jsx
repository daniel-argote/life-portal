import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import Icon from '../components/Icon';
import EditableHeader from '../components/EditableHeader';
import DatePicker from '../components/DatePicker';
import { format } from 'date-fns';

const Vehicles = ({ user, notify, pageName, setPageName, showHeaders }) => {
    const [activeTab, setActiveTab] = useState('fleet');
    const [loading, setLoading] = useState(false);
    
    // Data State
    const [fleet, setFleet] = useState([]);
    const [records, setRecords] = useState([]);

    const fetchData = useCallback(async () => {
        if (!user) return;
        
        // Fetch Fleet
        const { data: v } = await supabase.from('vehicles').select('*').order('created_at', { ascending: true });
        setFleet(v || []);

        // Fetch Service Log
        const { data: r } = await supabase.from('vehicle_records').select('*, vehicles(name)').order('date', { ascending: false });
        setRecords(r || []);
    }, [user]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const FleetTab = () => {
        const [showAdd, setShowAdd] = useState(false);
        const [form, setForm] = useState({ name: '', make: '', model: '', year: new Date().getFullYear(), vin: '' });

        const handleAdd = async (e) => {
            e.preventDefault();
            if (!form.name) return;
            setLoading(true);
            const { error } = await supabase.from('vehicles').insert([{ ...form, user_id: user.id }]);
            if (!error) {
                setForm({ name: '', make: '', model: '', year: new Date().getFullYear(), vin: '' });
                setShowAdd(false);
                fetchData();
                if (notify) notify('Vehicle added to fleet');
            }
            setLoading(false);
        };

        const deleteVehicle = async (id) => {
            const { error } = await supabase.from('vehicles').delete().eq('id', id);
            if (!error) { fetchData(); if (notify) notify('Vehicle removed'); }
        };

        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h3 className="text-2xl font-black text-base-content">The Fleet</h3>
                    <button onClick={() => setShowAdd(!showAdd)} className="bg-primary/10 text-primary px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-primary hover:text-primary-content transition-all">
                        <Icon name={showAdd ? "X" : "Plus"} size={18} />
                        {showAdd ? "Cancel" : "Add Vehicle"}
                    </button>
                </div>

                {showAdd && (
                    <form onSubmit={handleAdd} className="bg-base-200 p-8 rounded-[2.5rem] border border-base-300 shadow-xl space-y-4 animate-in slide-in-from-top-4 duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input placeholder="Nickname (e.g. Daily Driver)" className="w-full bg-base-100 p-4 rounded-xl font-bold outline-none border-2 border-transparent focus:border-primary" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                            <input placeholder="VIN" className="w-full bg-base-100 p-4 rounded-xl font-bold outline-none border-2 border-transparent focus:border-primary" value={form.vin} onChange={e => setForm({...form, vin: e.target.value})} />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <input placeholder="Make" className="w-full bg-base-100 p-4 rounded-xl font-bold outline-none border-2 border-transparent focus:border-primary" value={form.make} onChange={e => setForm({...form, make: e.target.value})} />
                            <input placeholder="Model" className="w-full bg-base-100 p-4 rounded-xl font-bold outline-none border-2 border-transparent focus:border-primary" value={form.model} onChange={e => setForm({...form, model: e.target.value})} />
                            <input 
                                type="number" 
                                placeholder="Year" 
                                className="w-full bg-base-100 p-4 rounded-xl font-bold outline-none border-2 border-transparent focus:border-primary" 
                                value={form.year} 
                                onChange={e => setForm({...form, year: parseInt(e.target.value)})}
                                onInput={(e) => { if (e.target.value.length > 4) e.target.value = e.target.value.slice(0, 4); }}
                                min="1900"
                                max="2100"
                            />
                        </div>
                        <button disabled={loading} className="w-full bg-primary text-primary-content py-4 rounded-xl font-black shadow-lg">Save Vehicle</button>
                    </form>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {fleet.map(v => (
                        <div key={v.id} className="bg-base-200 p-8 rounded-[2.5rem] border border-base-300 shadow-sm group hover:border-primary/30 transition-all">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h4 className="text-2xl font-black text-base-content">{v.name}</h4>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{v.year} {v.make} {v.model}</p>
                                </div>
                                <button onClick={() => deleteVehicle(v.id)} className="text-slate-400 hover:text-danger opacity-0 group-hover:opacity-100 transition-all p-2">
                                    <Icon name="Trash2" size={20} />
                                </button>
                            </div>
                            {v.vin && <p className="text-[10px] font-mono text-slate-400 bg-base-300/50 w-fit px-2 py-1 rounded">VIN: {v.vin}</p>}
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const ServiceLogTab = () => {
        const [showAdd, setShowAdd] = useState(false);
        const [form, setForm] = useState({ vehicle_id: '', date: format(new Date(), 'yyyy-MM-dd'), odometer: '', type: 'Maintenance', description: '', cost: '' });

        const handleAdd = async (e) => {
            e.preventDefault();
            if (!form.vehicle_id || !form.description) return;
            setLoading(true);
            const { error } = await supabase.from('vehicle_records').insert([{ ...form, user_id: user.id }]);
            if (!error) {
                setForm({ vehicle_id: '', date: format(new Date(), 'yyyy-MM-dd'), odometer: '', type: 'Maintenance', description: '', cost: '' });
                setShowAdd(false);
                fetchData();
                if (notify) notify('Service record logged');
            }
            setLoading(false);
        };

        const deleteRecord = async (id) => {
            const { error } = await supabase.from('vehicle_records').delete().eq('id', id);
            if (!error) { fetchData(); if (notify) notify('Record removed'); }
        };

        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h3 className="text-2xl font-black text-base-content">Service History</h3>
                    <button onClick={() => setShowAdd(!showAdd)} className="bg-primary/10 text-primary px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-primary hover:text-primary-content transition-all">
                        <Icon name={showAdd ? "X" : "Plus"} size={18} />
                        {showAdd ? "Cancel" : "Log Service"}
                    </button>
                </div>

                {showAdd && (
                    <form onSubmit={handleAdd} className="bg-base-200 p-8 rounded-[2.5rem] border border-base-300 shadow-xl space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Vehicle</label>
                                <select className="w-full bg-base-100 p-4 rounded-xl font-bold outline-none" value={form.vehicle_id} onChange={e => setForm({...form, vehicle_id: e.target.value})}>
                                    <option value="">Select Vehicle</option>
                                    {fleet.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Date of Service</label>
                                <DatePicker 
                                    value={form.date} 
                                    onChange={(val) => setForm({...form, date: val})} 
                                    maxDate={format(new Date(), 'yyyy-MM-dd')}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <input type="number" placeholder="Odometer" className="w-full bg-base-100 p-4 rounded-xl font-bold outline-none" value={form.odometer} onChange={e => setForm({...form, odometer: parseInt(e.target.value)})} />
                            <select className="w-full bg-base-100 p-4 rounded-xl font-bold outline-none" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                                <option>Maintenance</option>
                                <option>Repair</option>
                                <option>Upgrade</option>
                                <option>Other</option>
                            </select>
                            <input type="number" placeholder="Cost ($)" className="w-full bg-base-100 p-4 rounded-xl font-bold outline-none" value={form.cost} onChange={e => setForm({...form, cost: parseFloat(e.target.value)})} />
                        </div>
                        <textarea placeholder="Description of work..." className="w-full h-32 bg-base-100 p-4 rounded-xl font-bold outline-none resize-none" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
                        <button disabled={loading} className="w-full bg-primary text-primary-content py-4 rounded-xl font-black shadow-lg">Save Record</button>
                    </form>
                )}

                <div className="space-y-4">
                    {records.map(record => (
                        <div key={record.id} className="bg-base-200 p-6 rounded-3xl border border-base-300 flex items-center gap-6 group hover:border-primary/30 transition-all">
                            <div className="text-center min-w-[80px]">
                                <p className="text-[10px] font-black uppercase text-slate-400">{format(new Date(record.date.replace(/-/g, '\/')), 'MMM')}</p>
                                <p className="text-2xl font-black text-base-content">{format(new Date(record.date.replace(/-/g, '\/')), 'd')}</p>
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[8px] font-black uppercase tracking-tighter bg-primary/10 text-primary px-2 py-0.5 rounded">{record.type}</span>
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{record.vehicles?.name}</span>
                                </div>
                                <h4 className="font-bold text-base-content leading-tight">{record.description}</h4>
                                {record.odometer && <p className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-widest">{record.odometer.toLocaleString()} miles</p>}
                            </div>
                            <div className="text-right flex items-center gap-4">
                                {record.cost && <div className="text-xl font-black text-success">${record.cost}</div>}
                                <button onClick={() => deleteRecord(record.id)} className="text-slate-400 hover:text-danger opacity-0 group-hover:opacity-100 transition-all p-2">
                                    <Icon name="Trash2" size={18} />
                                </button>
                            </div>
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
                    subtext="Fleet & Maintenance Log" 
                />
            )}

            <div className="flex gap-2 p-1 bg-base-200 rounded-2xl w-fit border border-base-300">
                {[
                    { id: 'fleet', label: 'The Fleet', icon: 'Car' },
                    { id: 'service', label: 'Service Log', icon: 'Wrench' }
                ].map(t => (
                    <button
                        key={t.id}
                        onClick={() => setActiveTab(t.id)}
                        className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all ${activeTab === t.id ? 'bg-primary text-primary-content shadow-md' : 'text-slate-400 hover:text-primary hover:bg-base-300/50'}`}
                    >
                        <Icon name={t.icon} size={14} />
                        {t.label}
                    </button>
                ))}
            </div>

            <div>
                {activeTab === 'fleet' && <FleetTab />}
                {activeTab === 'service' && <ServiceLogTab />}
            </div>
        </div>
    );
};

export default Vehicles;