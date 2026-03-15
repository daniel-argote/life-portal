import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import Dashboard from '../pages/Dashboard';
import Knowledge from '../pages/Knowledge';
import Actions from '../pages/Actions';
import Log from '../pages/Log';
import Money from '../pages/Money';
import Health from '../pages/Health';
import Food from '../pages/Food';
import Calendar from '../pages/Calendar';
import Vehicles from '../pages/Vehicles';
import Weather from '../pages/Weather';
import Assistant from '../pages/Assistant';
import Settings from '../pages/Settings';

const FEATURE_LIST = [
    { id: 'actions', icon: 'CheckSquare', label: 'Actions' },
    { id: 'money', icon: 'Wallet', label: 'Money' },
    { id: 'knowledge', icon: 'Brain', label: 'Knowledge' },
    { id: 'log', icon: 'BookText', label: 'Journal' },
    { id: 'health', icon: 'Activity', label: 'Health' },
    { id: 'food', icon: 'Utensils', label: 'Food' },
    { id: 'calendar', icon: 'Calendar', label: 'Calendar' },
    { id: 'vehicles', icon: 'Car', label: 'Vehicles' },
    { id: 'weather', icon: 'CloudSun', label: 'Weather' },
    { id: 'assistant', icon: 'Bot', label: 'Assistant' }
];

const Layout = ({ user }) => {
    const [tab, setTab] = useState('dashboard');
    
    const [config, setConfig] = useState(() => {
        const saved = localStorage.getItem('portalConfig');
        const defaults = {
            showHeaders: true,
            autoHideSidebar: true,
            financialWeekStart: 0,
            hiddenFeatures: [],
            weatherUnit: 'fahrenheit',
            showA11yAgent: true
        };
        if (saved) {
            try { return { ...defaults, ...JSON.parse(saved) }; }
            catch (e) { return defaults; }
        }
        return defaults;
    });

    const [navItems, setNavItems] = useState(() => {
        const saved = localStorage.getItem('navOrder');
        const visibleFeatures = FEATURE_LIST.filter(f => !config.hiddenFeatures.includes(f.id));
        
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                const visibleIds = new Set(visibleFeatures.map(i => i.id));
                
                const filtered = parsed
                    .filter(i => visibleIds.has(i.id))
                    .map(savedItem => {
                        const currentDefault = FEATURE_LIST.find(d => d.id === savedItem.id);
                        return { ...savedItem, label: currentDefault.label, icon: currentDefault.icon };
                    });

                const currentIds = new Set(filtered.map(i => i.id));
                const missing = visibleFeatures.filter(i => !currentIds.has(i.id));
                return [...filtered, ...missing];
            } catch (e) { return visibleFeatures; }
        }
        return visibleFeatures;
    });

    // Update navItems when hiddenFeatures changes
    useEffect(() => {
        const visibleFeatures = FEATURE_LIST.filter(f => !config.hiddenFeatures.includes(f.id));
        const visibleIds = new Set(visibleFeatures.map(i => i.id));
        
        setNavItems(prev => {
            const filtered = prev.filter(i => visibleIds.has(i.id));
            const currentIds = new Set(filtered.map(i => i.id));
            const missing = visibleFeatures.filter(i => !currentIds.has(i.id));
            return [...filtered, ...missing];
        });
    }, [config.hiddenFeatures]);
    
    const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
    const [style, setStyle] = useState(() => localStorage.getItem('style') || 'default');
    
    const [pageNames, setPageNames] = useState(() => {
        const saved = localStorage.getItem('pageNames');
        const defaults = {
            dashboard: 'Portal',
            actions: 'Actions',
            knowledge: 'Knowledge',
            log: 'Journal',
            health: 'Health',
            food: 'Food',
            calendar: 'Calendar',
            settings: 'Settings',
            money: 'Money',
            vehicles: 'Vehicles',
            weather: 'Weather',
            assistant: 'Assistant'
        };
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed.brain && !parsed.knowledge) {
                    parsed.knowledge = parsed.brain;
                    delete parsed.brain;
                }
                return { ...defaults, ...parsed };
            } catch (e) { return defaults; }
        }
        return defaults;
    });

    const [logs, setLogs] = useState([]);
    const [vault, setVault] = useState([]);
    const [todos, setTodos] = useState([]);
    const [events, setEvents] = useState([]);
    const [profile, setProfile] = useState(null);
    const [input, setInput] = useState("");
    const [noteForm, setNoteForm] = useState({ title: '', content: '' });
    const [msg, setMsg] = useState(null);

    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [darkMode]);

    useEffect(() => {
        const root = document.documentElement;
        root.classList.remove('theme-nautical', 'theme-forest');
        if (style !== 'default') root.classList.add(`theme-${style}`);
        localStorage.setItem('style', style);
    }, [style]);

    useEffect(() => {
        localStorage.setItem('pageNames', JSON.stringify(pageNames));
    }, [pageNames]);

    useEffect(() => {
        localStorage.setItem('portalConfig', JSON.stringify(config));
    }, [config]);

    useEffect(() => {
        localStorage.setItem('navOrder', JSON.stringify(navItems));
    }, [navItems]);

    const updatePageName = (id, newName) => {
        setPageNames(prev => ({ ...prev, [id]: newName }));
    };

    const updateConfig = (key, value) => {
        setConfig(prev => ({ ...prev, [key]: value }));
    };

    const notify = useCallback((text, type = 'success') => {
        setMsg({ text, type });
        setTimeout(() => setMsg(null), 3000);
    }, []);

    const fetchData = useCallback(async () => {
        if (!user) return;
        
        const { data: l } = await supabase.from('logs').select('*').order('created_at', { ascending: false });
        setLogs(l || []);
        
        const { data: v } = await supabase.from('vault').select('*').order('updated_at', { ascending: false });
        setVault(v || []);

        const { data: t } = await supabase.from('todos').select('*').eq('is_complete', false).order('created_at', { ascending: false });
        setTodos(t || []);

        const { data: e } = await supabase.from('calendar').select('*').gte('start_time', new Date().toISOString()).order('start_time', { ascending: true });
        setEvents(e || []);

        const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (prof) setProfile(prof);
        else {
            // Fallback if trigger didn't fire or profile missing
            const { data: newProf } = await supabase.from('profiles').insert([{ id: user.id }]).select().single();
            setProfile(newProf);
        }
    }, [user]);

    useEffect(() => { if (user) fetchData(); }, [user, fetchData]);

    const addLog = async () => {
        if (!input.trim()) return;
        const { error } = await supabase.from('logs').insert([{ content: input, user_id: user.id }]);
        if (!error) { setInput(""); fetchData(); notify("Logged"); }
        else notify("Save failed", "error");
    };

    const addNote = async () => {
        if (!noteForm.title.trim()) return;
        const { error } = await supabase.from('vault').insert([{ ...noteForm, user_id: user.id }]);
        if (!error) { setNoteForm({ title: '', content: '' }); fetchData(); notify("Vaulted"); }
        else notify("Save failed", "error");
    };

    const deleteItem = async (table, id) => {
        const { error } = await supabase.from(table).delete().eq('id', id);
        if (error) notify("Delete failed", "error");
        else fetchData();
    };

    return (
        <div className={`min-h-screen pb-20 md:pb-0 fade-in transition-all duration-300 ${config.autoHideSidebar ? 'md:pl-20' : 'md:pl-64'}`}>
            {msg && <div className={`fixed top-6 right-6 z-[100] px-8 py-4 rounded-2xl text-primary-content font-black shadow-2xl animate-in slide-in-from-top-4 duration-300 ${msg.type === 'error' ? 'bg-danger' : 'bg-neutral'}`}>{msg.text}</div>}

            <Sidebar 
                tab={tab} 
                setTab={setTab} 
                darkMode={darkMode} 
                setDarkMode={setDarkMode} 
                style={style} 
                setStyle={setStyle} 
                navItems={navItems} 
                setNavItems={setNavItems}
                portalName={pageNames.dashboard}
                autoHide={config.autoHideSidebar}
            />

            <main className="p-6 md:p-16 max-w-5xl mx-auto">
                {tab === 'dashboard' && (
                    <Dashboard 
                        logs={logs} 
                        vault={vault} 
                        todos={todos}
                        events={events}
                        pageName={pageNames.dashboard} 
                        setPageName={(val) => updatePageName('dashboard', val)}
                        showHeaders={config.showHeaders}
                        user={user}
                        config={config}
                    />
                )}

                {tab === 'actions' && (
                    <Actions 
                        user={user} 
                        notify={notify} 
                        pageName={pageNames.actions} 
                        setPageName={(val) => updatePageName('actions', val)}
                        showHeaders={config.showHeaders}
                    />
                )}

                {tab === 'knowledge' && (
                    <Knowledge
                        vault={vault}
                        noteForm={noteForm}
                        setNoteForm={setNoteForm}
                        addNote={addNote}
                        deleteItem={deleteItem}
                        pageName={pageNames.knowledge} 
                        setPageName={(val) => updatePageName('knowledge', val)}
                        showHeaders={config.showHeaders}
                        user={user}
                        notify={notify}
                    />
                )}

                {tab === 'log' && (
                    <Log
                        logs={logs}
                        input={input}
                        setInput={setInput}
                        addLog={addLog}
                        deleteItem={deleteItem}
                        pageName={pageNames.log} 
                        setPageName={(val) => updatePageName('log', val)}
                        showHeaders={config.showHeaders}
                    />
                )}

                {tab === 'money' && (
                    <Money 
                        user={user} 
                        notify={notify} 
                        pageName={pageNames.money} 
                        setPageName={(val) => updatePageName('money', val)}
                        showHeaders={config.showHeaders}
                        config={config}
                        updateConfig={updateConfig}
                    />
                )}

                {tab === 'health' && (
                    <Health 
                        user={user} 
                        notify={notify} 
                        pageName={pageNames.health} 
                        setPageName={(val) => updatePageName('health', val)}
                        showHeaders={config.showHeaders}
                    />
                )}

                {tab === 'food' && (
                    <Food 
                        user={user} 
                        notify={notify} 
                        pageName={pageNames.food} 
                        setPageName={(val) => updatePageName('food', val)}
                        showHeaders={config.showHeaders}
                    />
                )}

                {tab === 'calendar' && (
                    <Calendar 
                        user={user} 
                        notify={notify} 
                        pageName={pageNames.calendar} 
                        setPageName={(val) => updatePageName('calendar', val)}
                        showHeaders={config.showHeaders}
                    />
                )}

                {tab === 'vehicles' && (
                    <Vehicles 
                        user={user} 
                        notify={notify} 
                        pageName={pageNames.vehicles} 
                        setPageName={(val) => updatePageName('vehicles', val)}
                        showHeaders={config.showHeaders}
                    />
                )}

                {tab === 'weather' && (
                    <Weather 
                        user={user} 
                        notify={notify} 
                        pageName={pageNames.weather} 
                        setPageName={(val) => updatePageName('weather', val)}
                        showHeaders={config.showHeaders}
                        config={config}
                    />
                )}

                {tab === 'assistant' && (
                    <Assistant 
                        user={user} 
                        notify={notify} 
                        pageName={pageNames.assistant} 
                        setPageName={(val) => updatePageName('assistant', val)}
                        showHeaders={config.showHeaders}
                        profile={profile}
                        logs={logs}
                        vault={vault}
                        todos={todos}
                        events={events}
                    />
                )}

                {tab === 'settings' && (
                    <Settings 
                        user={user} 
                        pageName={pageNames.settings} 
                        setPageName={(val) => updatePageName('settings', val)}
                        config={config}
                        updateConfig={updateConfig}
                        showHeaders={config.showHeaders}
                        featureList={FEATURE_LIST}
                        profile={profile}
                        fetchData={fetchData}
                        notify={notify}
                    />
                )}
            </main>

            <MobileNav tab={tab} setTab={setTab} navItems={navItems} />
        </div>
    );
};

export default Layout;