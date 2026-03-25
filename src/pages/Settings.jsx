import { useState } from 'react';
import Icon from '../components/Icon';
import PageContainer from '../components/PageContainer';

const Settings = ({ user, config, updateConfig, featureList, pageNames, setPageName, style, setStyle, resetHierarchy }) => {
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
