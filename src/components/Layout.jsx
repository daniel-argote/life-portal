import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';

import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import Icon from './Icon';
import EditableHeader from './EditableHeader';
import Dashboard from '../pages/Dashboard';
import Knowledge from '../pages/Knowledge';
import KnowledgeVault from '../pages/KnowledgeVault';
import KnowledgeReadingList from '../pages/KnowledgeReadingList';
import Actions from '../pages/Actions';
import ActionObjectives from '../pages/ActionObjectives';
import ActionGoals from '../pages/ActionGoals';
import ActionChores from '../pages/ActionChores';
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
import FoodTopLists from '../pages/FoodTopLists';
import CalendarHub from '../pages/CalendarHub';
import CalendarGrid from '../pages/CalendarGrid';
import CalendarTimeline from '../pages/CalendarTimeline';
import Vehicles from '../pages/Vehicles';
import VehicleFleet from '../pages/VehicleFleet';
import VehicleServiceLog from '../pages/VehicleServiceLog';
import Weather from '../pages/Weather';
import Assistant from '../pages/Assistant';
import Settings from '../pages/Settings';
import Travel from '../pages/Travel';
import TravelTrips from '../pages/TravelTrips';
import TravelBucket from '../pages/TravelBucket';
import TravelPacking from '../pages/TravelPacking';
import Recreation from '../pages/Recreation';
import RecreationHikes from '../pages/RecreationHikes';
import RecreationCamping from '../pages/RecreationCamping';

const PAGE_MAP = {
    dashboard: Dashboard,
    actions: Actions,
    action_objectives: ActionObjectives,
    action_goals: ActionGoals,
    action_chores: ActionChores,
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
    food_top_lists: FoodTopLists,
    calendar: CalendarHub,
    calendar_grid: CalendarGrid,
    calendar_timeline: CalendarTimeline,
    vehicles: Vehicles,
    vehicle_fleet: VehicleFleet,
    vehicle_service: VehicleServiceLog,
    weather: Weather,
    travel: Travel,
    travel_trips: TravelTrips,
    travel_bucket: TravelBucket,
    travel_packing: TravelPacking,
    recreation: Recreation,
    recreation_hikes: RecreationHikes,
    recreation_camping: RecreationCamping,
    assistant: Assistant,
    settings: Settings
};

const DEFAULT_HIERARCHY = [
    { 
        id: 'actions', 
        icon: 'CheckSquare', 
        label: 'Actions',
        children: [
            { id: 'action_objectives', icon: 'CheckSquare', label: 'Objectives' },
            { id: 'action_chores', icon: 'RefreshCw', label: 'Chores' },
            { id: 'action_goals', icon: 'Star', label: 'Strategic Goals' }
        ]
    },
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
            { id: 'food_inventory', icon: 'Library', label: 'Inventory' },
            { id: 'food_top_lists', icon: 'Trophy', label: 'Culinary Standings' }
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
    { 
        id: 'travel', 
        icon: 'Plane', 
        label: 'Travel',
        children: [
            { id: 'travel_trips', icon: 'Compass', label: 'Trip Planner' },
            { id: 'travel_bucket', icon: 'Star', label: 'Bucket List' },
            { id: 'travel_packing', icon: 'Briefcase', label: 'Packing' }
        ]
    },
    { 
        id: 'recreation', 
        icon: 'Trees', 
        label: 'Recreation',
        children: [
            { id: 'recreation_hikes', icon: 'Footprints', label: 'Hike Log' },
            { id: 'recreation_camping', icon: 'Tent', label: 'Camping' }
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
        showSubFeatures: false,
        showWelcomes: false,
        dismissedWelcomes: [],
        debugMode: false,
        dismissibleErrors: false
    });

    const [darkMode, setDarkMode] = useState(false);
    const [style, setStyle] = useState('default');
    
    const [logs, setLogs] = useState([]);
    const [vault, setVault] = useState([]);
    const [todos, setTodos] = useState([]);
    const [todoLabels, setTodoLabels] = useState([]);
    const [chores, setChores] = useState([]);
    const [choreHistory, setChoreHistory] = useState([]);
    const [events, setEvents] = useState([]);
    const [food, setFood] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [mealPlan, setMealPlan] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [bills, setBills] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [biometrics, setBiometrics] = useState([]);
    const [readingList, setReadingList] = useState([]);
    const [travelTrips, setTravelTrips] = useState([]);
    const [travelDays, setTravelDays] = useState([]);
    const [travelBucketList, setTravelBucketList] = useState([]);
    const [travelPoi, setTravelPoi] = useState([]);
    const [travelPacking, setTravelPacking] = useState([]);
    const [hikes, setHikes] = useState([]);
    const [camping, setCamping] = useState([]);
    const [dashboardWidgets, setDashboardWidgets] = useState([]);
    const [profile, setProfile] = useState(null);
    const [input, setInput] = useState("");
    const [noteForm, setNoteForm] = useState({ title: '', content: '' });
    const [msg, setMsg] = useState(null);
    const undoRef = useRef(null);

    // Sync the undo ref whenever msg changes
    useEffect(() => {
        undoRef.current = msg?.onUndo || null;
    }, [msg]);

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

    const notify = useCallback((text, type = 'success', onUndo = null) => {
        // If text is an error object, extract message
        let displayMsg = text;
        if (typeof text === 'object' && text !== null && !text.$$typeof) {
            displayMsg = text.message || text.error_description || JSON.stringify(text);
        }
        
        // Wrap the undo action to clear the message after restoration
        const handleUndo = async () => {
            if (onUndo) {
                await onUndo();
                setMsg(null);
            }
        };

        setMsg({ text: displayMsg, type, onUndo: onUndo ? handleUndo : null });
        
        // If it's an error and dismissibleErrors is enabled, don't auto-dismiss
        if (type === 'error' && config.dismissibleErrors) return;

        // Give more time (10s) if an undo action is available, otherwise standard 5s
        const duration = onUndo ? 10000 : (type === 'error' ? 20000 : 5000);
        setTimeout(() => setMsg(null), duration);
    }, [config.dismissibleErrors]);

    const fetchData = useCallback(async () => {
        if (!user) return;
        
        let { data: prof, error: fetchError } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        
        if (fetchError && fetchError.code === 'PGRST116') {
            const { data: newProf, error: insertError } = await supabase.from('profiles').insert([{ id: user.id }]).select().single();
            if (!insertError) prof = newProf;
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

        // Parallel Fetching for Command Center Performance
        const [
            { data: l }, { data: v }, { data: t }, { data: tl }, { data: e },
            { data: f }, { data: inv }, { data: mp },
            { data: accs }, { data: bls }, { data: appts }, { data: rl }, { data: bio },
            { data: trips }, { data: days }, { data: bucket }, { data: pois }, { data: pack },
            { data: chr }, { data: chist }, { data: hk }, { data: cmp }
        ] = await Promise.all([
            supabase.from('logs').select('*').order('created_at', { ascending: false }),
            supabase.from('vault').select('*').order('updated_at', { ascending: false }),
            supabase.from('todos')
                .select('*')
                .or(`status.neq.done,completed_at.gt.${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()}`)
                .order('created_at', { ascending: false }),
            supabase.from('todo_labels').select('*').order('name', { ascending: true }),
            supabase.from('calendar').select('*').gte('start_time', new Date().toISOString()).order('start_time', { ascending: true }),
            supabase.from('food').select('*').order('created_at', { ascending: false }),
            supabase.from('food_inventory').select('*').order('category', { ascending: true }),
            supabase.from('meal_plan').select('*, recipes(title)').order('day_date', { ascending: true }),
            supabase.from('money_accounts').select('*').order('position', { ascending: true }),
            supabase.from('money_bills').select('*').order('due_date', { ascending: true }),
            supabase.from('health_appointments').select('*').order('date', { ascending: true }),
            supabase.from('reading_list').select('*').order('created_at', { ascending: false }),
            supabase.from('health').select('*').order('created_at', { ascending: false }),
            supabase.from('travel_trips').select('*').order('start_date', { ascending: true }),
            supabase.from('travel_days').select('*').order('date', { ascending: true }),
            supabase.from('travel_bucket_list').select('*').order('priority', { ascending: false }),
            supabase.from('travel_poi').select('*').order('created_at', { ascending: false }),
            supabase.from('travel_packing').select('*').order('category', { ascending: true }),
            supabase.from('chores').select('*').order('created_at', { ascending: true }),
            supabase.from('chore_history').select('*').order('completed_at', { ascending: false }),
            supabase.from('recreation_hikes').select('*').order('date', { ascending: false }),
            supabase.from('recreation_camping').select('*').order('start_date', { ascending: true })
        ]);

        setLogs(l || []);
        setVault(v || []);
        setTodos(t || []);
        setTodoLabels(tl || []);
        setEvents(e || []);
        setFood(f || []);
        setInventory(inv || []);
        setMealPlan(mp || []);
        setAccounts(accs || []);
        setBills(bls || []);
        setAppointments(appts || []);
        setReadingList(rl || []);
        setBiometrics(bio || []);
        setTravelTrips(trips || []);
        setTravelDays(days || []);
        setTravelBucketList(bucket || []);
        setTravelPoi(pois || []);
        setTravelPacking(pack || []);
        setChores(chr || []);
        setChoreHistory(chist || []);
        setHikes(hk || []);
        setCamping(cmp || []);
    }, [user]);

    useEffect(() => { if (user) fetchData(); }, [user, fetchData]);

    // Save changes to Supabase
    const saveProfileUpdate = useCallback(async (updates) => {
        if (!user) return;
        
        try {
            const { error } = await supabase
                .from('profiles')
                .upsert({ 
                    id: user.id, 
                    ...updates, 
                    updated_at: new Date().toISOString() 
                }, { onConflict: 'id' });

            if (error) {
                console.error("Profile sync error details:", error);
                notify(`Sync failed: ${error.message || 'Unknown error'}`, "error");
            }
        } catch (err) {
            console.error("Critical sync exception:", err);
            notify("Connection error during sync", "error");
        }
    }, [user, notify]);

    const updatePageName = (id, newName) => {
        const newNames = { ...pageNames, [id]: newName };
        setPageNames(newNames);
        saveProfileUpdate({ page_names: newNames });
    };

    const updateConfig = useCallback((key, value) => {
        setConfig(prev => {
            const newConfig = { ...prev, [key]: value };
            saveProfileUpdate({ portal_config: newConfig });
            return newConfig;
        });
    }, [saveProfileUpdate]);

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

    const dismissWelcome = (id) => {
        const dismissed = config.dismissedWelcomes || [];
        if (!dismissed.includes(id)) {
            updateConfig('dismissedWelcomes', [...dismissed, id]);
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

    // Hotkey for sub-features (Alt+S) and Undo (Ctrl+Z)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.altKey && e.key.toLowerCase() === 's') {
                updateConfig('showSubFeatures', !config.showSubFeatures);
            }
            
            // GLOBAL UNDO HOTKEY (Ctrl+Z)
            // Using ref ensures we always have the freshest callback without re-binding the listener constantly
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
                if (undoRef.current) {
                    e.preventDefault();
                    e.stopPropagation();
                    undoRef.current();
                }
            }
        };
        // Use capture: true to ensure we catch it before other elements
        window.addEventListener('keydown', handleKeyDown, true);
        return () => window.removeEventListener('keydown', handleKeyDown, true);
    }, [config.showSubFeatures, updateConfig]);

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

    // Subtext lookup for centralized header
    const getSubtext = () => {
        if (tab === 'dashboard') return 'Your Personal Command Center';
        if (tab === 'food_journal') return 'Daily Nutrition Log';
        if (tab === 'food_inventory') return 'Kitchen Stock Tracking';
        if (tab === 'calendar_grid') return 'Monthly Planning Grid';
        if (tab === 'calendar_timeline') return 'Chronological Event Flow';
        if (tab === 'food_recipes') return 'Your Culinary Library';
        if (tab === 'food_planner') return 'Weekly Meal Schedule';
        if (tab === 'food_top_lists') return 'Your Personal Culinary Hall of Fame';
        if (tab === 'action_objectives') return 'Mission Control & Tasks';
        if (tab === 'action_chores') return 'Household Maintenance';
        if (tab === 'action_goals') return 'Strategic Mission Tracking';
        if (tab === 'money_ledger') return 'Weekly Budget Tracking';
        if (tab === 'money_accounts') return 'Account & Asset Management';
        if (tab === 'money_bills') return 'Recurring Obligations';
        if (tab === 'health_metrics') return 'Biometric Tracking';
        if (tab === 'health_appointments') return 'Professional Care Schedule';
        if (tab === 'knowledge_vault') return 'Central Intelligence Store';
        if (tab === 'knowledge_reading') return 'Resource Queue';
        if (tab === 'vehicle_fleet') return 'Fleet Management';
        if (tab === 'vehicle_service') return 'Service & Maintenance History';
        if (tab === 'travel_trips') return 'Itinerary & Trip Planner';
        if (tab === 'travel_bucket') return 'Global Wishlist';
        if (tab === 'travel_packing') return 'Checklists & Essentials';
        if (tab === 'recreation_hikes') return 'Trail Adventure Logs';
        if (tab === 'recreation_camping') return 'Campsite & Trip Tracker';
        if (tab === 'settings') return 'System Configuration';
        if (tab === 'assistant') return 'AI Support Agent';
        
        const feature = findFeature(hierarchy, tab);
        if (feature?.children?.length > 0) return `${feature.label} Hub`;
        return '';
    };

    return (
        <div className={`min-h-screen pb-20 md:pb-0 fade-in transition-all duration-300 ${config.autoHideSidebar ? 'md:pl-20' : 'md:pl-64'}`}>
            {msg && (
                <div className={`fixed top-6 right-6 z-[100] pl-8 pr-4 py-4 rounded-2xl text-primary-content font-black shadow-2xl animate-in slide-in-from-top-4 duration-300 flex items-center gap-4 ${msg.type === 'error' ? 'bg-danger' : 'bg-neutral'}`}>
                    <span>{msg.text}</span>
                    {msg.onUndo && (
                        <button 
                            onClick={msg.onUndo}
                            className="px-4 py-2 bg-white text-neutral rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg border border-white/20 ml-auto"
                        >
                            Undo
                        </button>
                    )}
                    <button onClick={() => setMsg(null)} className="p-1 hover:bg-white/20 rounded-lg transition-colors ml-2">
                        <Icon name="X" size={16} />
                    </button>
                </div>
            )}

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
                {config.showHeaders && (
                    <div className="mb-10">
                        <EditableHeader 
                            value={pageNames[tab] || (tab === 'dashboard' ? 'Portal' : (DEFAULT_HIERARCHY.find(h => h.id === tab)?.label || tab))}
                            onSave={(val) => updatePageName(tab, val)}
                            subtext={getSubtext()}
                        />
                    </div>
                )}

                {/* Unified Tab Navigation for Parents and their Children */}
                {(isParentSelected || parentOfCurrent) && (
                    <div className="flex gap-2 p-1 bg-base-200 rounded-2xl w-fit border border-base-300 mb-10 overflow-x-auto no-scrollbar max-w-full shadow-inner">
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
                    config={config}
                    updateConfig={updateConfig}
                    logs={logs}
                    vault={vault}
                    todos={todos}
                    todoLabels={todoLabels}
                    chores={chores}
                    choreHistory={choreHistory}
                    events={events}
                    food={food}
                    inventory={inventory}
                    mealPlan={mealPlan}
                    accounts={accounts}
                    bills={bills}
                    appointments={appointments}
                    biometrics={biometrics}
                    readingList={readingList}
                    profile={profile}
                    fetchData={fetchData}
                    dashboardWidgets={dashboardWidgets}
                    updateDashboardWidgets={updateDashboardWidgets}
                    darkMode={darkMode}
                    setDarkMode={setDarkMode}
                    style={style}
                    setStyle={setStyle}
                    resetHierarchy={resetHierarchy}
                    dismissWelcome={dismissWelcome}
                    travelTrips={travelTrips}
                    travelDays={travelDays}
                    travelBucketList={travelBucketList}
                    travelPoi={travelPoi}
                    travelPacking={travelPacking}
                    hikes={hikes}
                    camping={camping}
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