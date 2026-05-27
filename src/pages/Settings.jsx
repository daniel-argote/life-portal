import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import Icon from '../components/Icon';
import PageContainer from '../components/PageContainer';

const Settings = ({ user, config, updateConfig, featureList, pageNames, setPageName, style, setStyle, resetHierarchy, profile, fetchData, notify }) => {
    const [localPageNames, setLocalPageNames] = useState(pageNames || {});

    const updateTabName = (id, name) => {
        setLocalPageNames(prev => ({ ...prev, [id]: name }));
        setPageName(id, name);
    };

    const handleLabelChange = (listKey, index, newVal) => {
        const newList = [...(config[listKey] || [])];
        newList[index] = newVal;
        updateConfig(listKey, newList);
    };

    const addLabel = (listKey) => {
        const newList = [...(config[listKey] || []), 'New Label'];
        updateConfig(listKey, newList);
    };

    const removeLabel = (listKey, index) => {
        const newList = (config[listKey] || []).filter((_, i) => i !== index);
        updateConfig(listKey, newList);
    };

    return (
        <PageContainer>
            <div className="space-y-12">
                {/* Theme & Style */}
                <section className="bg-base-200 p-8 rounded-[2.5rem] border border-base-300 shadow-sm">
                    <h3 className="text-xl font-black mb-6 flex items-center gap-3">
                        <Icon name="Palette" size={24} className="text-primary" />
                        Appearance
                    </h3>
                    <div className="flex flex-wrap gap-4">
                        {['default', 'nautical', 'forest'].map(s => (
                            <button 
                                key={s} 
                                onClick={() => setStyle(s)}
                                className={`px-8 py-4 rounded-2xl font-bold capitalize transition-all ${style === s ? 'bg-primary text-primary-content shadow-lg scale-105' : 'bg-base-100 text-slate-500 hover:bg-base-300'}`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </section>

                {/* Portal Structure Management */}
                <section className="bg-base-200 p-8 rounded-[2.5rem] border border-base-300 shadow-sm lg:col-span-2">
                    <h3 className="text-xl font-black mb-6 flex items-center gap-3">
                        <Icon name="Network" size={24} className="text-primary" />
                        Portal Structure
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <p className="text-xs font-black uppercase tracking-widest mb-6 text-slate-500">Sidebar Preferences</p>
                            <div className="flex items-center justify-between p-4 bg-base-100 rounded-2xl border border-transparent hover:border-primary/30 transition-all group">
                                <div>
                                    <p className="font-bold">Show Sub-features</p>
                                    <p className="text-[10px] text-slate-500 font-medium mt-1">Always show nested items in sidebar (Alt+S)</p>
                                </div>
                                <button
                                    onClick={() => updateConfig('showSubFeatures', !config.showSubFeatures)}
                                    className={`w-14 h-8 rounded-full transition-all flex items-center px-1 ${config.showSubFeatures ? 'bg-primary' : 'bg-base-300'}`}
                                >
                                    <div className={`w-6 h-6 rounded-full bg-white shadow-sm transition-transform ${config.showSubFeatures ? 'translate-x-6' : 'translate-x-0'}`} />
                                </button>
                            </div>
                        </div>

                        <div>
                            <p className="text-xs font-black uppercase tracking-widest mb-6 text-slate-500">Quick Visibility</p>
                            <div className="space-y-2 max-h-[300px] overflow-y-auto no-scrollbar pr-2">
                                {featureList.map(feature => (
                                    <div key={feature.id} className="flex items-center justify-between p-3 bg-base-100 rounded-xl border border-base-300/50">
                                        <div className="flex items-center gap-3">
                                            <Icon name={feature.icon} size={16} className="text-primary" />
                                            <span className="font-bold text-xs">{feature.label}</span>
                                        </div>
                                        <button 
                                            onClick={() => {
                                                const isHidden = config.hiddenFeatures.includes(feature.id);
                                                const newHidden = isHidden ? config.hiddenFeatures.filter(id => id !== feature.id) : [...config.hiddenFeatures, feature.id];
                                                updateConfig('hiddenFeatures', newHidden);
                                            }}
                                            className={`text-[8px] font-black uppercase tracking-tighter px-3 py-1 rounded-lg ${config.hiddenFeatures.includes(feature.id) ? 'bg-base-300 text-slate-500' : 'bg-primary/10 text-primary'}`}
                                        >
                                            {config.hiddenFeatures.includes(feature.id) ? 'Hidden' : 'Visible'}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Financial Week Configuration */}
                <section className="bg-base-200 p-8 rounded-[2.5rem] border border-base-300 shadow-sm">
                    <h3 className="text-xl font-black mb-2 flex items-center gap-3">
                        <Icon name="Calendar" size={24} className="text-primary" />
                        Financial Preferences
                    </h3>
                    <p className="text-xs font-bold text-slate-400 mb-8 ml-9 uppercase tracking-widest">Configure your weekly payment cycle</p>

                    <div className="max-w-md">
                        <label className="text-[10px] font-black uppercase text-slate-500 ml-4 mb-2 block">Weekly Payment Day</label>
                        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                            {[
                                { id: 0, label: 'Sun' },
                                { id: 1, label: 'Mon' },
                                { id: 2, label: 'Tue' },
                                { id: 3, label: 'Wed' },
                                { id: 4, label: 'Thu' },
                                { id: 5, label: 'Fri' },
                                { id: 6, label: 'Sat' }
                            ].map(day => (
                                <button
                                    key={day.id}
                                    onClick={() => updateConfig('financialWeekStart', day.id)}
                                    className={`p-3 rounded-xl font-black text-[10px] uppercase transition-all ${(config.financialWeekStart !== undefined ? config.financialWeekStart : 3) === day.id ? 'bg-primary text-primary-content shadow-md scale-105' : 'bg-base-100 text-slate-400 hover:bg-base-300'}`}
                                >
                                    {day.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Custom Travel Labels */}
                <section className="bg-base-200 p-8 rounded-[2.5rem] border border-base-300 shadow-sm">
                    <h3 className="text-xl font-black mb-2 flex items-center gap-3">
                        <Icon name="Plane" size={24} className="text-primary" />
                        Travel Customization
                    </h3>
                    <p className="text-xs font-bold text-slate-400 mb-8 ml-9 uppercase tracking-widest">Mold your bucket list categories and priorities</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div className="space-y-4">
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="text-xs font-black uppercase tracking-widest text-primary">Bucket List Categories</h4>
                                <button onClick={() => addLabel('travelBucketCategories')} className="text-primary hover:scale-110 transition-transform"><Icon name="PlusCircle" size={18} /></button>
                            </div>
                            {(config.travelBucketCategories || []).map((cat, i) => (
                                <div key={i} className="flex gap-2">
                                    <input 
                                        className="flex-1 bg-base-100 p-3 rounded-xl font-bold outline-none border-2 border-transparent focus:border-primary text-sm"
                                        value={cat}
                                        onChange={(e) => handleLabelChange('travelBucketCategories', i, e.target.value)}
                                    />
                                    <button onClick={() => removeLabel('travelBucketCategories', i)} className="text-slate-300 hover:text-danger p-2"><Icon name="X" size={16} /></button>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="text-xs font-black uppercase tracking-widest text-primary">Priority Tiers</h4>
                                <button onClick={() => addLabel('travelBucketPriorities')} className="text-primary hover:scale-110 transition-transform"><Icon name="PlusCircle" size={18} /></button>
                            </div>
                            {(config.travelBucketPriorities || []).map((prio, i) => (
                                <div key={i} className="flex gap-2">
                                    <input 
                                        className="flex-1 bg-base-100 p-3 rounded-xl font-bold outline-none border-2 border-transparent focus:border-primary text-sm"
                                        value={prio}
                                        onChange={(e) => handleLabelChange('travelBucketPriorities', i, e.target.value)}
                                    />
                                    <button onClick={() => removeLabel('travelBucketPriorities', i)} className="text-slate-300 hover:text-danger p-2"><Icon name="X" size={16} /></button>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Profile & Assistant */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <section className="bg-base-200 p-8 rounded-[2.5rem] border border-base-300 shadow-sm">
                        <h3 className="text-xl font-black mb-6 flex items-center gap-3">
                            <Icon name="User" size={24} className="text-blue-500" /> Profile
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-4">Email Address</label>
                                <div className="w-full bg-base-100 p-4 rounded-2xl font-bold text-sm border border-transparent">
                                    {user?.email}
                                </div>
                                <p className="mt-2 text-[10px] text-slate-400 font-medium ml-4 italic">Email updates are handled via Auth service.</p>
                            </div>
                        </div>
                    </section>

                    <section className="bg-base-200 p-8 rounded-[2.5rem] border border-base-300 shadow-sm">
                        <h3 className="text-xl font-black mb-6 flex items-center gap-3">
                            <Icon name="Bot" size={24} className="text-purple-500" /> Assistant
                        </h3>
                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            const key = e.target.geminiKey.value.trim().replace(/[^\x21-\x7E]/g, '');
                            const { error } = await supabase.from('profiles').update({ gemini_api_key: key }).eq('id', user.id);
                            if (error) notify("Failed to update API key", "error");
                            else { notify("Gemini API Key saved"); fetchData(); }
                        }} className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-4">Gemini API Key</label>
                                <input
                                    name="geminiKey"
                                    type="password"
                                    defaultValue={profile?.gemini_api_key || ''}
                                    className="w-full bg-base-100 p-4 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-purple-500 transition-colors text-sm"
                                    placeholder="Paste your key here..."
                                />
                                <p className="mt-2 text-[10px] text-slate-500 font-medium ml-4">Stored privately in your profile.</p>
                            </div>
                            <button className="w-full bg-slate-900 text-white p-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:opacity-90 transition-opacity">
                                Save API Key
                            </button>
                        </form>
                    </section>
                </div>

                {/* Module Renaming */}
                <section className="bg-base-200 p-8 rounded-[2.5rem] border border-base-300 shadow-sm">
                    <h3 className="text-xl font-black mb-6 flex items-center gap-3">
                        <Icon name="Type" size={24} className="text-primary" />
                        Module Renaming
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {featureList.map(f => (
                            <div key={f.id} className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-400 ml-2">{f.id}</label>
                                <input 
                                    className="w-full bg-base-100 p-3 rounded-xl font-bold outline-none border-2 border-transparent focus:border-primary text-sm"
                                    value={localPageNames[f.id] || f.label}
                                    onChange={(e) => updateTabName(f.id, e.target.value)}
                                />
                            </div>
                        ))}
                    </div>
                </section>

                {/* Developer Settings Section */}
                <section className="bg-base-200 p-8 rounded-[2.5rem] border border-base-300 shadow-sm">
                    <h3 className="text-xl font-black mb-6 flex items-center gap-3">
                        <Icon name="Terminal" size={24} className="text-emerald-500" /> Developer Mode
                    </h3>
                    <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-base-100 rounded-2xl border border-transparent hover:border-emerald-500/20 transition-all">
                            <div>
                                <p className="font-bold">A11y Agent (Axe-Core)</p>
                                <p className="text-[10px] text-slate-500 font-medium mt-1">Monitor accessibility issues in real-time via the console.</p>
                            </div>
                            <button 
                                onClick={() => updateConfig('showA11yAgent', !config.showA11yAgent)}
                                className={`w-14 h-8 rounded-full transition-all flex items-center px-1 ${config.showA11yAgent ? 'bg-emerald-500' : 'bg-base-300'}`}
                            >
                                <div className={`w-6 h-6 bg-white rounded-full transition-all ${config.showA11yAgent ? 'translate-x-6' : 'translate-x-0'}`} />
                            </button>
                        </div>
                    </div>
                </section>

                {/* System Actions */}
                <section className="bg-danger/5 p-8 rounded-[2.5rem] border border-danger/20">
                    <h3 className="text-xl font-black mb-6 flex items-center gap-3 text-danger">
                        <Icon name="AlertTriangle" size={24} />
                        Danger Zone
                    </h3>
                    <button 
                        onClick={resetHierarchy}
                        className="bg-danger text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-danger/20"
                    >
                        Reset Layout to Default
                    </button>
                </section>
            </div>
        </PageContainer>
    );
};

export default Settings;

