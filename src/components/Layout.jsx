import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import Icon from './Icon';
import Dashboard from '../pages/Dashboard';
import Knowledge from '../pages/Knowledge';
import KnowledgeVault from '../pages/KnowledgeVault';
import KnowledgeReadingList from '../pages/KnowledgeReadingList';
import Actions from '../pages/Actions';
import Log from '../pages/Log';
import Money from '../pages/Money';
import MoneyLedger from '../pages/MoneyLedger';
import MoneyAccounts from '../pages/MoneyAccounts';
import MoneyBills from '../pages/MoneyBills';
import Health from '../pages/Health';
import HealthMetrics from '../pages/HealthMetrics';
import HealthAppointments from '../pages/HealthAppointments';
import Food from '../pages/Food';
import FoodJournal from '../pages/FoodJournal';
import FoodPlanner from '../pages/FoodPlanner';
import FoodRecipes from '../pages/FoodRecipes';
import FoodInventory from '../pages/FoodInventory';
import Calendar from '../pages/Calendar';
import Vehicles from '../pages/Vehicles';
import VehicleFleet from '../pages/VehicleFleet';
import VehicleServiceLog from '../pages/VehicleServiceLog';
import Weather from '../pages/Weather';
import Assistant from '../pages/Assistant';
import Settings from '../pages/Settings';

const PAGE_MAP = {
    dashboard: Dashboard,
    actions: Actions,
    money: Money,
    money_ledger: MoneyLedger,
    money_accounts: MoneyAccounts,
    money_bills: MoneyBills,
    knowledge: Knowledge,
    knowledge_vault: KnowledgeVault,
    knowledge_reading: KnowledgeReadingList,
    log: Log,
    health: Health,
    health_metrics: HealthMetrics,
    health_appointments: HealthAppointments,
    food: Food,
    food_journal: FoodJournal,
    food_planner: FoodPlanner,
    food_recipes: FoodRecipes,
    food_inventory: FoodInventory,
    calendar: Calendar,
    vehicles: Vehicles,
    vehicle_fleet: VehicleFleet,
    vehicle_service: VehicleServiceLog,
    weather: Weather,
    assistant: Assistant,
    settings: Settings
};

const DEFAULT_HIERARCHY = [
    { id: 'actions', icon: 'CheckSquare', label: 'Actions' },
    { 
        id: 'money', 
        icon: 'Wallet', 
        label: 'Money',
        children: [
            { id: 'money_ledger', icon: 'BookText', label: 'Ledger' },
            { id: 'money_accounts', icon: 'Wallet', label: 'Accounts' },
            { id: 'money_bills', icon: 'CreditCard', label: 'Bills' }
        ]
    },
    { 
        id: 'knowledge', 
        icon: 'Brain', 
        label: 'Knowledge',
        children: [
            { id: 'knowledge_vault', icon: 'Brain', label: 'Vault' },
            { id: 'knowledge_reading', icon: 'BookOpen', label: 'Reading List' }
        ]
    },
    { id: 'log', icon: 'BookText', label: 'Journal' },
    { 
        id: 'health', 
        icon: 'Activity', 
        label: 'Health',
        children: [
            { id: 'health_metrics', icon: 'Activity', label: 'Biometrics' },
            { id: 'health_appointments', icon: 'CalendarDays', label: 'Appointments' }
        ]
    },
    { 
        id: 'food', 
        icon: 'Utensils', 
        label: 'Food',
        children: [
            { id: 'food_journal', icon: 'BookText', label: 'Journal' },
            { id: 'food_planner', icon: 'CalendarDays', label: 'Planner' },
            { id: 'food_recipes', icon: 'Salad', label: 'Recipes' },
            { id: 'food_inventory', icon: 'Library', label: 'Inventory' }
        ]
    },
    { id: 'calendar', icon: 'Calendar', label: 'Calendar' },
    { 
        id: 'vehicles', 
        icon: 'Car', 
        label: 'Vehicles',
        children: [
            { id: 'vehicle_fleet', icon: 'Car', label: 'The Fleet' },
            { id: 'vehicle_service', icon: 'Wrench', label: 'Service Log' }
        ]
    },
    { id: 'weather', icon: 'CloudSun', label: 'Weather' },
    { id: 'assistant', icon: 'Bot', label: 'Assistant' }
];

const Layout = ({ user }) => {
    const [tab, setTab] = useState('dashboard');
    const [hierarchy, setHierarchy] = useState(DEFAULT_HIERARCHY);
    const [pageNames, setPageNames] = useState({});
    const [config, setConfig] = useState({
        showHeaders: true,
        autoHideSidebar: true,
        financialWeekStart: 0,
        hiddenFeatures: [],
        weatherUnit: 'fahrenheit',
        showA11yAgent: true,
        showSubFeatures: false
    });

    const [darkMode, setDarkMode] = useState(false);
    const [style, setStyle] = useState('default');
    
    const [logs, setLogs] = useState([]);
    const [vault, setVault] = useState([]);
    const [todos, setTodos] = useState([]);
    const [events, setEvents] = useState([]);
    const [dashboardWidgets, setDashboardWidgets] = useState([]);
    const [profile, setProfile] = useState(null);
    const [input, setInput] = useState("");
    const [noteForm, setNoteForm] = useState({ title: '', content: '' });
    const [msg, setMsg] = useState(null);

    // Helpers to find feature and its children
    const findFeature = useCallback((items, id) => {
        for (const item of items) {
            if (item.id === id) return item;
            if (item.children) {
                const found = findFeature(item.children, id);
                if (found) return found;
            }
        }
        return null;
    }, []);

    const getTopLevelItems = useCallback(() => {
        return hierarchy.filter(item => !config.hiddenFeatures.includes(item.id));
    }, [hierarchy, config.hiddenFeatures]);

    const notify = useCallback((text, type = 'success') => {
        setMsg({ text, type });
        setTimeout(() => setMsg(null), 3000);
    }, []);

    const fetchData = useCallback(async () => {
        if (!user) return;
        
        let { data: prof, error: fetchError } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        
        if (fetchError && fetchError.code === 'PGRST116') {
            // Profile not found, create it
            const { data: newProf, error: insertError } = await supabase
                .from('profiles')
                .insert([{ id: user.id }])
                .select()
                .single();
            
            if (!insertError) {
                prof = newProf;
            }
        }

        if (prof) {
            setProfile(prof);
            if (prof.feature_hierarchy) setHierarchy(prof.feature_hierarchy);
            if (prof.page_names) setPageNames(prof.page_names);
            if (prof.portal_config) setConfig(prev => ({ ...prev, ...prof.portal_config }));
            if (prof.dashboard_widgets) setDashboardWidgets(prof.dashboard_widgets);
            if (prof.theme) setDarkMode(prof.theme === 'dark');
            if (prof.style) setStyle(prof.style);
        }

        const { data: l } = await supabase.from('logs').select('*').order('created_at', { ascending: false });
        setLogs(l || []);
        
        const { data: v } = await supabase.from('vault').select('*').order('updated_at', { ascending: false });
        setVault(v || []);

        const { data: t } = await supabase.from('todos').select('*').eq('is_complete', false).order('created_at', { ascending: false });
        setTodos(t || []);

        const { data: e } = await supabase.from('calendar').select('*').gte('start_time', new Date().toISOString()).order('start_time', { ascending: true });
        setEvents(e || []);
    }, [user]);

    useEffect(() => { if (user) fetchData(); }, [user, fetchData]);

    // Save changes to Supabase
    const saveProfileUpdate = async (updates) => {
        if (!user) return;
        const { error } = await supabase
            .from('profiles')
            .upsert({ id: user.id, ...updates, updated_at: new Date().toISOString() });
        if (error) {
            console.error("Profile sync error:", error);
            notify("Sync failed", "error");
        }
    };

    const updatePageName = (id, newName) => {
        const newNames = { ...pageNames, [id]: newName };
        setPageNames(newNames);
        saveProfileUpdate({ page_names: newNames });
    };

    const updateConfig = (key, value) => {
        const newConfig = { ...config, [key]: value };
        setConfig(newConfig);
        saveProfileUpdate({ portal_config: newConfig });
    };

    const updateHierarchy = (newHierarchy) => {
        setHierarchy(newHierarchy);
        saveProfileUpdate({ feature_hierarchy: newHierarchy });
    };

    const updateDashboardWidgets = (newWidgets) => {
        setDashboardWidgets(newWidgets);
        saveProfileUpdate({ dashboard_widgets: newWidgets });
    };

    const toggleDarkMode = () => {
        const newVal = !darkMode;
        setDarkMode(newVal);
        saveProfileUpdate({ theme: newVal ? 'dark' : 'light' });
    };

    const updateStyle = (newStyle) => {
        setStyle(newStyle);
        saveProfileUpdate({ style: newStyle });
    };

    const resetHierarchy = () => {
        if (window.confirm("Reset portal structure to defaults? This will undo your custom organization.")) {
            setHierarchy(DEFAULT_HIERARCHY);
            saveProfileUpdate({ feature_hierarchy: DEFAULT_HIERARCHY });
            notify("Structure reset");
        }
    };

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

    // Hotkey for sub-features (Alt+S)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.altKey && e.key.toLowerCase() === 's') {
                updateConfig('showSubFeatures', !config.showSubFeatures);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [config.showSubFeatures]);

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

    const currentFeature = findFeature(hierarchy, tab);
    const parentOfCurrent = hierarchy.find(p => p.children?.some(c => c.id === tab));
    
    // If current feature has children but we are ON the parent, 
    // we actually want to show the first child's component but keep parent context
    const isParentSelected = currentFeature?.children?.length > 0;
    
    // Auto-redirect to first child if parent is selected directly from sidebar
    useEffect(() => {
        if (isParentSelected && currentFeature.children.length > 0 && tab === currentFeature.id) {
            // Uncomment the next line if you want to skip the "Overview" and go straight to first child
            // setTab(currentFeature.children[0].id);
        }
    }, [isParentSelected, currentFeature, tab]);

    const ActiveComponent = PAGE_MAP[tab] || Dashboard;

    return (
        <div className={`min-h-screen pb-20 md:pb-0 fade-in transition-all duration-300 ${config.autoHideSidebar ? 'md:pl-20' : 'md:pl-64'}`}>
            {msg && <div className={`fixed top-6 right-6 z-[100] px-8 py-4 rounded-2xl text-primary-content font-black shadow-2xl animate-in slide-in-from-top-4 duration-300 ${msg.type === 'error' ? 'bg-danger' : 'bg-neutral'}`}>{msg.text}</div>}

            <Sidebar 
                tab={tab} 
                setTab={setTab} 
                darkMode={darkMode} 
                setDarkMode={toggleDarkMode} 
                style={style} 
                setStyle={updateStyle} 
                navItems={hierarchy} 
                setNavItems={updateHierarchy}
                portalName={pageNames.dashboard || 'Portal'}
                autoHide={config.autoHideSidebar}
                config={config}
            />

            <main className="p-6 md:p-16 max-w-5xl mx-auto">
                {/* Unified Tab Navigation for Parents and their Children */}
                {(isParentSelected || parentOfCurrent) && (
                    <div className="flex gap-2 p-1 bg-base-200 rounded-2xl w-fit border border-base-300 mb-8 overflow-x-auto no-scrollbar max-w-full shadow-inner">
                        {(() => {
                            const parent = isParentSelected ? currentFeature : parentOfCurrent;
                            // The "Hub" Overview is always the first tab
                            const tabItems = [{ id: parent.id, label: 'Overview', icon: 'LayoutGrid' }, ...parent.children];
                            return tabItems.map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => setTab(item.id)}
                                    className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all whitespace-nowrap ${tab === item.id ? 'bg-primary text-primary-content shadow-md' : 'text-slate-600 hover:text-primary hover:bg-base-300/50'}`}
                                >
                                    <Icon name={item.icon === parent.icon && item.id !== parent.id ? 'Circle' : item.icon} size={14} />
                                    {pageNames[item.id] || item.label}
                                </button>
                            ));
                        })()}
                    </div>
                )}

                <ActiveComponent
                    user={user}
                    notify={notify}
                    tab={tab}
                    setTab={setTab}
                    pageName={pageNames[tab] || (tab === 'dashboard' ? 'Portal' : (DEFAULT_HIERARCHY.find(h => h.id === tab)?.label || tab))}
                    setPageName={(val) => updatePageName(tab, val)}
                    showHeaders={config.showHeaders}
                    config={config}
                    updateConfig={updateConfig}
                    logs={logs}
                    vault={vault}
                    todos={todos}
                    events={events}
                    profile={profile}
                    fetchData={fetchData}
                    dashboardWidgets={dashboardWidgets}
                    updateDashboardWidgets={updateDashboardWidgets}
                    darkMode={darkMode}
                    setDarkMode={setDarkMode}
                    style={style}
                    setStyle={setStyle}
                    resetHierarchy={resetHierarchy}
                    featureList={DEFAULT_HIERARCHY} // For settings
                    // Legacy props for specific pages
                    input={input}
                    setInput={setInput}
                    addLog={addLog}
                    noteForm={noteForm}
                    setNoteForm={setNoteForm}
                    addNote={addNote}
                    deleteItem={deleteItem}
                />
            </main>

            <MobileNav tab={tab} setTab={setTab} navItems={getTopLevelItems()} />
        </div>
    );
};

export default Layout;