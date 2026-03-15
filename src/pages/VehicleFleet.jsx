import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import Icon from '../components/Icon';
import EditableHeader from '../components/EditableHeader';
import { VehiclePlaceholder } from '../components/VehicleIcons';

const VehicleFleet = ({ user, notify, pageName, setPageName, showHeaders }) => {
    const [fleet, setFleet] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showAdd, setShowAdd] = useState(false);
    const [form, setForm] = useState({ 
        name: '', make: '', model: '', year: new Date().getFullYear(), vin: '',
        category: 'car', style: ''
    });
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [uploading, setUploading] = useState(false);

    const fetchData = useCallback(async () => {
        if (!user) return;
        const { data } = await supabase.from('vehicles').select('*').order('created_at', { ascending: true });
        setFleet(data || []);
    }, [user]);

    useEffect(() => { fetchData(); }, [fetchData]);

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
                    if (width > height) { if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; } }
                    else { if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; } }
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    canvas.toBlob((blob) => {
                        resolve(new File([blob], file.name, { type: 'image/png', lastModified: Date.now() }));
                    }, 'image/png');
                };
            };
        });
    };

    const handleUpload = async (file, vehicleId) => {
        if (!file) return null;
        const compressedFile = await compressImage(file);
        const fileName = `${user.id}/${vehicleId}-${Math.random()}.png`;
        const { error: uploadError } = await supabase.storage.from('vehicle-images').upload(fileName, compressedFile);
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from('vehicle-images').getPublicUrl(fileName);
        return data.publicUrl;
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!form.name) return;
        setLoading(true);
        setUploading(true);
        try {
            const { data: v, error: err } = await supabase.from('vehicles').insert([{ ...form, user_id: user.id }]).select().single();
            if (err) throw err;
            if (imageFile) {
                const url = await handleUpload(imageFile, v.id);
                if (url) await supabase.from('vehicles').update({ image_url: url }).eq('id', v.id);
            }
            setForm({ name: '', make: '', model: '', year: new Date().getFullYear(), vin: '', category: 'car', style: '' });
            setImageFile(null);
            setImagePreview(null);
            setShowAdd(false);
            fetchData();
            if (notify) notify('Vehicle added to fleet');
        } catch (err) {
            if (notify) notify('Error adding vehicle', 'error');
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
        <div className="space-y-8 pb-20">
            {showHeaders && (
                <EditableHeader value={pageName} onSave={setPageName} subtext="Fleet Management" />
            )}

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
                            <input placeholder="Nickname" className="w-full bg-base-100 p-4 rounded-xl font-bold outline-none border-2 border-transparent focus:border-primary" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
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
                            <input type="number" placeholder="Year" className="w-full bg-base-100 p-4 rounded-xl font-bold outline-none border-2 border-transparent focus:border-primary" value={form.year} onChange={e => setForm({...form, year: parseInt(e.target.value)})} />
                        </div>
                        <input placeholder="VIN" className="w-full bg-base-100 p-4 rounded-xl font-bold outline-none border-2 border-transparent focus:border-primary" value={form.vin} onChange={e => setForm({...form, vin: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Vehicle Photo</label>
                        <div className="flex flex-col md:flex-row gap-4 items-start">
                            <input type="file" accept="image/*" onChange={(e) => { const file = e.target.files[0]; if (file) { setImageFile(file); setImagePreview(URL.createObjectURL(file)); } }} className="flex-1 w-full bg-base-100 p-3 rounded-xl font-bold outline-none border-2 border-dashed border-base-300" />
                            {imagePreview && <div className="w-full md:w-32 h-24 rounded-xl overflow-hidden border-2 border-primary/20 bg-base-100 relative group"><img src={imagePreview} className="w-full h-full object-cover" /><button type="button" onClick={() => { setImageFile(null); setImagePreview(null); }} className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white"><Icon name="X" size={16} /></button></div>}
                        </div>
                    </div>
                    <button disabled={loading || uploading} className="w-full bg-primary text-primary-content py-4 rounded-xl font-black shadow-lg flex items-center justify-center gap-2">{(loading || uploading) && <Icon name="Loader2" size={20} className="animate-spin" />}{uploading ? 'Optimizing & Uploading...' : 'Save Vehicle'}</button>
                </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {fleet.map(v => (
                    <div key={v.id} className="bg-base-200 rounded-[2.5rem] border border-base-300 shadow-sm group hover:border-primary/30 transition-all overflow-hidden flex flex-col shadow-sm">
                        {v.image_url ? (
                            <div className="h-48 w-full relative overflow-hidden bg-white"><img src={v.image_url} alt={v.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" /></div>
                        ) : (
                            <div className="h-48 w-full bg-base-300/50 flex items-center justify-center text-slate-300"><VehiclePlaceholder category={v.category} style={v.style} /></div>
                        )}
                        <div className="p-8">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-1"><span className="text-[8px] font-black uppercase tracking-tighter bg-primary/10 text-primary px-2 py-0.5 rounded">{v.category}</span>{v.style && <span className="text-[8px] font-black uppercase tracking-tighter bg-base-300 text-slate-500 px-2 py-0.5 rounded">{v.style}</span>}</div>
                                    <h4 className="text-2xl font-black text-base-content">{v.name}</h4>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{v.year} {v.make} {v.model}</p>
                                </div>
                                <button onClick={() => deleteVehicle(v.id, v.image_url)} className="text-slate-400 hover:text-danger opacity-0 group-hover:opacity-100 transition-all p-2"><Icon name="Trash2" size={20} /></button>
                            </div>
                            {v.vin && <p className="text-[10px] font-mono text-slate-400 bg-base-300/50 w-fit px-2 py-1 rounded">VIN: {v.vin}</p>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default VehicleFleet;
