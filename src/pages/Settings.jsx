import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import Icon from '../components/Icon';
import EditableHeader from '../components/EditableHeader';

const Settings = ({ user, pageName, setPageName, config, updateConfig, showHeaders, featureList, profile, fetchData, notify }) => {
    const [email, setEmail] = useState(user?.email || '');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState(null);
    const [geminiKey, setGeminiKey] = useState(profile?.gemini_api_key || '');

    const handleUpdateGeminiKey = async (e) => {
        e.preventDefault();
        setLoading(true);
        // Aggressive sanitization: Remove any non-ASCII characters
        const sanitizedKey = geminiKey.replace(/[^\x21-\x7E]/g, '');
        const { error } = await supabase
            .from('profiles')
            .update({ gemini_api_key: sanitizedKey })
            .eq('id', user.id);
        
        if (error) notify("Failed to update API key", "error");
        else {
            notify("Gemini API Key saved");
            setGeminiKey(sanitizedKey);
            fetchData();
        }
        setLoading(false);
    };

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        const { error } = await supabase.auth.updateUser({ password });
        if (error) setMsg({ type: 'error', text: error.message });
        else {
            setMsg({ type: 'success', text: 'Password updated successfully' });
            setPassword('');
        }
        setLoading(false);
    };

    const handleUpdateEmail = async (e) => {
        e.preventDefault();
        setLoading(true);
        const { error } = await supabase.auth.updateUser({ email });
        if (error) setMsg({ type: 'error', text: error.message });
        else {
            setMsg({ type: 'success', text: 'Check your email for the confirmation link' });
        }
        setLoading(false);
    };

    const toggleFeature = (id) => {
        const isHidden = config.hiddenFeatures.includes(id);
        const newHidden = isHidden 
            ? config.hiddenFeatures.filter(fid => fid !== id)
            : [...config.hiddenFeatures, id];
        updateConfig('hiddenFeatures', newHidden);
    };

    return (
        <div className="space-y-10 pb-20">
            {showHeaders && (
                <EditableHeader 
                    value={pageName} 
                    onSave={setPageName} 
                    subtext="System Configuration" 
                />
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* General Config */}
                <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-sm">
                    <h3 className="font-bold text-xl mb-6 dark:text-white flex items-center gap-3">
                        <Icon name="Settings2" size={24} className="text-emerald-500" /> General
                    </h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-transparent hover:border-emerald-500/30 transition-all group">
                            <div>
                                <p className="font-bold dark:text-white">Show Page Headers</p>
                                <p className="text-xs text-slate-600 font-medium mt-1">Display titles at the top of each page</p>
                            </div>
                            <button 
                                onClick={() => updateConfig('showHeaders', !config.showHeaders)}
                                className={`w-14 h-8 rounded-full transition-all flex items-center px-1 ${config.showHeaders ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                            >
                                <div className={`w-6 h-6 rounded-full bg-white shadow-sm transition-transform ${config.showHeaders ? 'translate-x-6' : 'translate-x-0'}`} />
                            </button>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-transparent hover:border-emerald-500/30 transition-all group">
                            <div>
                                <p className="font-bold dark:text-white">Auto-hide Sidebar</p>
                                <p className="text-xs text-slate-600 font-medium mt-1">Hide sidebar until mouse hover (Desktop only)</p>
                            </div>
                            <button 
                                onClick={() => updateConfig('autoHideSidebar', !config.autoHideSidebar)}
                                className={`w-14 h-8 rounded-full transition-all flex items-center px-1 ${config.autoHideSidebar ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                            >
                                <div className={`w-6 h-6 rounded-full bg-white shadow-sm transition-transform ${config.autoHideSidebar ? 'translate-x-6' : 'translate-x-0'}`} />
                            </button>
                        </div>

                        <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-transparent hover:border-emerald-500/30 transition-all group">
                            <label className="block font-bold dark:text-white mb-1">Financial Week Start</label>
                            <p className="text-xs text-slate-600 font-medium mb-3">Which day your ledger cycles reset</p>
                            <select 
                                value={config.financialWeekStart}
                                onChange={(e) => updateConfig('financialWeekStart', parseInt(e.target.value))}
                                className="w-full bg-white dark:bg-slate-800 p-3 rounded-xl font-bold outline-none border border-base-300 dark:border-slate-700 dark:text-white"
                            >
                                {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, idx) => (
                                    <option key={day} value={idx}>{day}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-transparent hover:border-emerald-500/30 transition-all group">
                            <div>
                                <p className="font-bold dark:text-white">Weather Units</p>
                                <p className="text-xs text-slate-600 font-medium mt-1">Display temperature in {config.weatherUnit === 'fahrenheit' ? 'Fahrenheit' : 'Celsius'}</p>
                            </div>
                            <button 
                                onClick={() => updateConfig('weatherUnit', config.weatherUnit === 'fahrenheit' ? 'celsius' : 'fahrenheit')}
                                className={`w-14 h-8 rounded-full transition-all flex items-center px-1 ${config.weatherUnit === 'fahrenheit' ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                            >
                                <div className={`w-6 h-6 rounded-full bg-white shadow-sm transition-transform ${config.weatherUnit === 'fahrenheit' ? 'translate-x-6' : 'translate-x-0'}`} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Feature Management */}
                <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-sm">
                    <h3 className="font-bold text-xl mb-6 dark:text-white flex items-center gap-3">
                        <Icon name="LayoutGrid" size={24} className="text-indigo-500" /> Features
                    </h3>
                    <p className="text-xs text-slate-600 font-bold uppercase tracking-widest mb-6 px-2">Enable or hide modules</p>
                    <div className="grid grid-cols-1 gap-3">
                        {featureList.map(feature => {
                            const isHidden = config.hiddenFeatures.includes(feature.id);
                            return (
                                <button 
                                    key={feature.id}
                                    onClick={() => toggleFeature(feature.id)}
                                    className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all group
                                        ${isHidden ? 'bg-slate-50 dark:bg-slate-900 border-transparent opacity-60' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-indigo-500/30'}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2 rounded-xl ${isHidden ? 'bg-slate-200 dark:bg-slate-800 text-slate-600' : 'bg-indigo-500/10 text-indigo-500'}`}>
                                            <Icon name={feature.icon} size={18} />
                                        </div>
                                        <div className="text-left">
                                            <p className={`font-bold ${isHidden ? 'text-slate-600' : 'dark:text-white'}`}>{feature.label}</p>
                                            <p className="text-[10px] text-slate-600 font-medium uppercase tracking-tighter">{isHidden ? 'Inactive' : 'Active'}</p>
                                        </div>
                                    </div>
                                    <div className={`w-10 h-6 rounded-full transition-all flex items-center px-1 ${!isHidden ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-700'}`}>
                                        <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${!isHidden ? 'translate-x-4' : 'translate-x-0'}`} />
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Profile Section */}
                <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-sm">
                    <h3 className="font-bold text-xl mb-6 dark:text-white flex items-center gap-3">
                        <Icon name="User" size={24} className="text-blue-500" /> Profile
                    </h3>
                    <form onSubmit={handleUpdateEmail} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-2">Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-900 p-4 rounded-xl font-bold outline-none dark:text-white border border-transparent focus:border-blue-500 transition-colors"
                                placeholder="name@example.com"
                                required
                            />
                        </div>
                        <button disabled={loading} className="w-full bg-slate-900 dark:bg-blue-600 text-white p-4 rounded-xl font-bold hover:opacity-90 transition-opacity">
                            {loading ? 'Updating...' : 'Update Email'}
                        </button>
                    </form>
                </div>

                {/* Security Section */}
                <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-sm">
                    <h3 className="font-bold text-xl mb-6 dark:text-white flex items-center gap-3">
                        <Icon name="Lock" size={24} className="text-indigo-500" /> Security
                    </h3>
                    <form onSubmit={handleUpdatePassword} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-2">New Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-900 p-4 rounded-xl font-bold outline-none dark:text-white border border-transparent focus:border-indigo-500 transition-colors"
                                placeholder="••••••••"
                                minLength={6}
                                required
                            />
                        </div>
                        <button disabled={loading} className="w-full bg-slate-900 dark:bg-indigo-600 text-white p-4 rounded-xl font-bold hover:opacity-90 transition-opacity">
                            {loading ? 'Updating...' : 'Update Password'}
                        </button>
                    </form>
                </div>

                {/* Assistant Configuration Section */}
                <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-sm">
                    <h3 className="font-bold text-xl mb-6 dark:text-white flex items-center gap-3">
                        <Icon name="Bot" size={24} className="text-purple-500" /> Assistant
                    </h3>
                    <form onSubmit={handleUpdateGeminiKey} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-2">Gemini API Key</label>
                            <input
                                type="password"
                                value={geminiKey}
                                onChange={e => setGeminiKey(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-900 p-4 rounded-xl font-bold outline-none dark:text-white border border-transparent focus:border-purple-500 transition-colors"
                                placeholder="Paste your key here..."
                            />
                            <p className="mt-2 text-[10px] text-slate-600 font-medium">Your key is stored privately in your profile and used only for the Assistant.</p>
                        </div>
                        <button disabled={loading} className="w-full bg-slate-900 dark:bg-purple-600 text-white p-4 rounded-xl font-bold hover:opacity-90 transition-opacity">
                            {loading ? 'Saving...' : 'Save API Key'}
                        </button>
                    </form>
                </div>

                {/* Developer Settings Section */}
                <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-sm">
                    <h3 className="font-bold text-xl mb-6 dark:text-white flex items-center gap-3">
                        <Icon name="Terminal" size={24} className="text-emerald-500" /> Developer Mode
                    </h3>
                    <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-transparent hover:border-emerald-500/20 transition-all">
                            <div>
                                <p className="font-bold dark:text-white">A11y Agent (Axe-Core)</p>
                                <p className="text-xs text-slate-600 font-medium mt-1">Monitor accessibility and contrast issues in real-time via the console.</p>
                            </div>
                            <button 
                                onClick={() => updateConfig('showA11yAgent', !config.showA11yAgent)}
                                className={`w-14 h-8 rounded-full transition-all relative ${config.showA11yAgent ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`}
                            >
                                <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${config.showA11yAgent ? 'left-7' : 'left-1'}`} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {msg && (
                <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-8 py-4 rounded-2xl text-white font-black shadow-2xl animate-in slide-in-from-bottom-4 duration-300 ${msg.type === 'error' ? 'bg-red-500' : 'bg-slate-900'}`}>
                    {msg.text}
                </div>
            )}
        </div>
    );
};

export default Settings;