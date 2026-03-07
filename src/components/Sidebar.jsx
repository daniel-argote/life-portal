import { supabase } from '../lib/supabaseClient';
import Icon from './Icon';

const navItems = [
    { id: 'command', icon: 'LayoutDashboard', label: 'Command' },
    { id: 'brain', icon: 'Brain', label: 'Brain' },
    { id: 'log', icon: 'BookText', label: 'Log' },
    { id: 'money', icon: 'Wallet', label: 'Money' },
    { id: 'health', icon: 'Activity', label: 'Health' }
];

const Sidebar = ({ tab, setTab, darkMode, setDarkMode }) => {
    return (
        <aside className="fixed left-0 top-0 bottom-0 w-64 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 hidden md:flex flex-col p-8 transition-colors duration-300">
            <div className="font-black text-2xl mb-12 text-indigo-600 dark:text-indigo-400 flex items-center gap-3 tracking-tighter">
                <Icon name="LayoutDashboard" size={24} /> Portal
            </div>
            <nav className="space-y-2 flex-1">
                {navItems.map(t => (
                    <button key={t.id} onClick={() => setTab(t.id)} className={`w-full flex items-center gap-4 px-5 py-4 rounded-[1.25rem] font-bold transition-all ${tab === t.id ? 'bg-indigo-50 text-indigo-600 dark:bg-slate-800 dark:text-indigo-400' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}>
                        <Icon name={t.icon} size={20} />
                        {t.label}
                    </button>
                ))}
            </nav>
            <button onClick={() => setDarkMode(!darkMode)} className="text-slate-400 font-bold flex items-center gap-3 px-5 py-4 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors mb-2">
                <Icon name={darkMode ? "Sun" : "Moon"} size={20} /> {darkMode ? "Light Mode" : "Dark Mode"}
            </button>
            <button onClick={() => supabase.auth.signOut()} className="text-slate-300 font-bold flex items-center gap-3 px-5 py-4 hover:text-red-500 transition-colors"><Icon name="LogOut" size={20} /> Sign Out</button>
        </aside>
    );
};

export default Sidebar;