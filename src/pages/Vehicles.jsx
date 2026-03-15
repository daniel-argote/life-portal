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

    const MotorcycleIcon = ({ style, className = "w-16 h-16" }) => {
        const stroke = "currentColor";
        const sw = 2;

        const base = (
            <g>
                {/* Wheels */}
                <circle cx="5" cy="18" r="4" />
                <circle cx="19" cy="18" r="4" />
            </g>
        );

        if (style === 'adventure') {
            return (
                <svg viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" className={className}>
                    {base}
                    <path d="M5 18l3-9h8l3 9" /> {/* Frame */}
                    <path d="M8 9l-1-4h2" /> {/* Tall Windshield/Bars */}
                    <path d="M11 9h5l1 3h-7z" /> {/* Tank/Seat */}
                    <path d="M16 9l2 4" /> {/* Luggage Rack */}
                </svg>
            );
        }
        if (style === 'cruiser') {
            return (
                <svg viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" className={className}>
                    <circle cx="5" cy="18" r="4" />
                    <circle cx="20" cy="18" r="4" />
                    <path d="M5 18l5-6h6l4 6" /> {/* Long Rake Frame */}
                    <path d="M10 12l-2-4" /> {/* Bars */}
                    <path d="M11 12c0-2 4-2 5 0v2h-5v-2z" /> {/* Low Seat/Tank */}
                </svg>
            );
        }
        if (style === 'sportbike') {
            return (
                <svg viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" className={className}>
                    {base}
                    <path d="M5 18l4-10h7l3 10" />
                    <path d="M9 8c-1 0-2 2-2 4s1 3 3 3h6l2-7H9z" /> {/* Fairing/Body */}
                    <path d="M10 8l-1-2" /> {/* Clip-ons */}
                </svg>
            );
        }
        if (style === 'dirtbike') {
            return (
                <svg viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" className={className}>
                    <circle cx="5" cy="18" r="3" />
                    <circle cx="19" cy="18" r="3" />
                    <path d="M5 18l4-11h6l4 11" />
                    <path d="M4 14h3" /> {/* High Fender */}
                    <path d="M9 7l-1-3" /> {/* Bars */}
                    <path d="M9 7h6l1 2h-7z" /> {/* Slim Seat */}
                </svg>
            );
        }
        // Standard/Generic Motorbike
        return (
            <svg viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" className={className}>
                {base}
                <path d="M5 18l4-8h7l3 8" />
                <path d="M9 10l-1-3" />
                <path d="M10 10h6v2h-6z" />
            </svg>
        );
    };

    const VehiclePlaceholder = ({ category, style }) => {
        if (category === 'truck') return <Icon name="Truck" size={64} strokeWidth={1} />;
        if (category === 'motorcycle') return <MotorcycleIcon style={style} />;
        return <Icon name="Car" size={64} strokeWidth={1} />;
    };

    const FleetTab = () => {
        const [showAdd, setShowAdd] = useState(false);
        const [form, setForm] = useState({ 
            name: '', make: '', model: '', year: new Date().getFullYear(), vin: '',
            category: 'car', style: ''
        });
        const [imageFile, setImageFile] = useState(null);
        const [imagePreview, setImagePreview] = useState(null);
        const [uploading, setUploading] = useState(false);

        const compressImage = (file) => {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = (event) => {
                    const img = new Image();
                    img.src = event.target.result;
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        const MAX_WIDTH = 1200;
                        const MAX_HEIGHT = 1200;
                        let width = img.width;
                        let height = img.height;

                        if (width > height) {
                            if (width > MAX_WIDTH) {
                                height *= MAX_WIDTH / width;
                                width = MAX_WIDTH;
                            }
                        } else {
                            if (height > MAX_HEIGHT) {
                                width *= MAX_HEIGHT / height;
                                height = MAX_HEIGHT;
                            }
                        }

                        canvas.width = width;
                        canvas.height = height;
                        const ctx = canvas.getContext('canvas-2d') || canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, width, height);
                        
                        canvas.toBlob((blob) => {
                            resolve(new File([blob], file.name, {
                                type: 'image/png',
                                lastModified: Date.now(),
                            }));
                        }, 'image/png');
                        };
                        };
                        });
                        };

        const handleUpload = async (file, vehicleId) => {
            if (!file) return null;
            
            // Apply compression before upload
            const compressedFile = await compressImage(file);
            
            const fileExt = 'png';
            const fileName = `${user.id}/${vehicleId}-${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('vehicle-images')
                .upload(filePath, compressedFile);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage
                .from('vehicle-images')
                .getPublicUrl(filePath);

            return data.publicUrl;
        };

        const handleAdd = async (e) => {
            e.preventDefault();
            if (!form.name) return;
            setLoading(true);
            setUploading(true);
            
            try {
                // 1. Insert vehicle first to get ID
                const { data: vehicleData, error: vehicleError } = await supabase
                    .from('vehicles')
                    .insert([{ ...form, user_id: user.id }])
                    .select()
                    .single();

                if (vehicleError) throw vehicleError;

                // 2. If there's an image, upload it
                if (imageFile) {
                    const imageUrl = await handleUpload(imageFile, vehicleData.id);
                    if (imageUrl) {
                        await supabase
                            .from('vehicles')
                            .update({ image_url: imageUrl })
                            .eq('id', vehicleData.id);
                    }
                }

                setForm({ 
                    name: '', make: '', model: '', year: new Date().getFullYear(), vin: '',
                    category: 'car', style: ''
                });
                setImageFile(null);
                setImagePreview(null);
                setShowAdd(false);
                fetchData();
                if (notify) notify('Vehicle added to fleet');
            } catch (err) {
                console.error(err);
                if (notify) notify('Error adding vehicle: ' + err.message, 'error');
            } finally {
                setLoading(false);
                setUploading(false);
            }
        };

        const deleteVehicle = async (id, imageUrl) => {
            const { error } = await supabase.from('vehicles').delete().eq('id', id);
            if (!error) {
                if (imageUrl) {
                    const path = imageUrl.split('vehicle-images/')[1];
                    if (path) await supabase.storage.from('vehicle-images').remove([path]);
                }
                fetchData(); 
                if (notify) notify('Vehicle removed'); 
            }
        };

        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h3 className="text-2xl font-black text-base-content">The Fleet</h3>
                    <button onClick={() => { setShowAdd(!showAdd); setImagePreview(null); setImageFile(null); }} className="bg-primary/10 text-primary px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-primary hover:text-primary-content transition-all">
                        <Icon name={showAdd ? "X" : "Plus"} size={18} />
                        {showAdd ? "Cancel" : "Add Vehicle"}
                    </button>
                </div>

                {showAdd && (
                    <form onSubmit={handleAdd} className="bg-base-200 p-8 rounded-[2.5rem] border border-base-300 shadow-xl space-y-4 animate-in slide-in-from-top-4 duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="md:col-span-2 space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Nickname</label>
                                <input placeholder="Daily Driver, Trail Bike..." className="w-full bg-base-100 p-4 rounded-xl font-bold outline-none border-2 border-transparent focus:border-primary" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Category</label>
                                <select className="w-full bg-base-100 p-4 rounded-xl font-bold outline-none border-2 border-transparent focus:border-primary" value={form.category} onChange={e => setForm({...form, category: e.target.value, style: ''})}>
                                    <option value="car">Car / Sedan</option>
                                    <option value="motorcycle">Motorcycle</option>
                                    <option value="truck">Truck / SUV</option>
                                </select>
                            </div>
                            {form.category === 'motorcycle' && (
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Style</label>
                                    <select className="w-full bg-base-100 p-4 rounded-xl font-bold outline-none border-2 border-transparent focus:border-primary" value={form.style} onChange={e => setForm({...form, style: e.target.value})}>
                                        <option value="">Standard</option>
                                        <option value="adventure">Adventure</option>
                                        <option value="cruiser">Cruiser</option>
                                        <option value="sportbike">Sportbike</option>
                                        <option value="dirtbike">Dirtbike</option>
                                    </select>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            <input placeholder="VIN" className="w-full bg-base-100 p-4 rounded-xl font-bold outline-none border-2 border-transparent focus:border-primary" value={form.vin} onChange={e => setForm({...form, vin: e.target.value})} />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Vehicle Photo</label>
                            <div className="flex flex-col md:flex-row gap-4 items-start">
                                <div className="flex-1 w-full">
                                    <input 
                                        type="file" 
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (file) {
                                                setImageFile(file);
                                                setImagePreview(URL.createObjectURL(file));
                                            }
                                        }}
                                        className="w-full bg-base-100 p-3 rounded-xl font-bold outline-none border-2 border-dashed border-base-300 focus:border-primary"
                                    />
                                    <p className="text-[10px] font-bold text-slate-400 mt-2 ml-2 italic">Large photos will be automatically optimized before upload.</p>
                                </div>
                                {imagePreview && (
                                    <div className="w-full md:w-32 h-24 rounded-xl overflow-hidden border-2 border-primary/20 bg-base-100 relative group">
                                        <img src={imagePreview} className="w-full h-full object-cover" />
                                        <button 
                                            type="button"
                                            onClick={() => { setImageFile(null); setImagePreview(null); }}
                                            className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white"
                                        >
                                            <Icon name="X" size={16} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                        <button disabled={loading || uploading} className="w-full bg-primary text-primary-content py-4 rounded-xl font-black shadow-lg flex items-center justify-center gap-2">
                            {(loading || uploading) && <Icon name="Loader2" size={20} className="animate-spin" />}
                            {uploading ? 'Optimizing & Uploading...' : 'Save Vehicle'}
                        </button>
                    </form>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {fleet.map(v => (
                        <div key={v.id} className="bg-base-200 rounded-[2.5rem] border border-base-300 shadow-sm group hover:border-primary/30 transition-all overflow-hidden flex flex-col">
                            {v.image_url ? (
                                <div className="h-48 w-full relative overflow-hidden bg-white" style={{ backgroundImage: `radial-gradient(#e2e8f0 1px, transparent 0)`, backgroundSize: '16px 16px' }}>
                                    <img src={v.image_url} alt={v.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            ) : (
                                <div className="h-48 w-full bg-base-300/50 flex items-center justify-center text-slate-300">
                                    <VehiclePlaceholder category={v.category} style={v.style} />
                                </div>
                            )}
                            <div className="p-8">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[8px] font-black uppercase tracking-tighter bg-primary/10 text-primary px-2 py-0.5 rounded">{v.category}</span>
                                            {v.style && <span className="text-[8px] font-black uppercase tracking-tighter bg-base-300 text-slate-500 px-2 py-0.5 rounded">{v.style}</span>}
                                        </div>
                                        <h4 className="text-2xl font-black text-base-content">{v.name}</h4>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{v.year} {v.make} {v.model}</p>
                                    </div>
                                    <button onClick={() => deleteVehicle(v.id, v.image_url)} className="text-slate-400 hover:text-danger opacity-0 group-hover:opacity-100 transition-all p-2">
                                        <Icon name="Trash2" size={20} />
                                    </button>
                                </div>
                                {v.vin && <p className="text-[10px] font-mono text-slate-400 bg-base-300/50 w-fit px-2 py-1 rounded">VIN: {v.vin}</p>}
                            </div>
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