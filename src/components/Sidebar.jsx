import { supabase } from '../lib/supabaseClient';
import Icon from './Icon';

const navItems = [
    { id: 'command', icon: 'LayoutDashboard', label: 'Command' },
    { id: 'brain', icon: 'Brain', label: 'Brain' },
    { id: 'log', icon: 'BookText', label: 'Log' }
];

const Sidebar = ({ tab, setTab }) => {
    return (
        <aside className="fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-slate-100 hidden md:flex flex-col p-8">
            <div className="font-black text-2xl mb-12 text-indigo-600 flex items-center gap-3 tracking-tighter">
                <Icon name="LayoutDashboard" size={24} /> Portal
            </div>
            <nav className="space-y-2 flex-1">
                {navItems.map(t => (
                    <button key={t.id} onClick={() => setTab(t.id)} className={`w-full flex items-center gap-4 px-5 py-4 rounded-[1.25rem] font-bold transition-all ${tab === t.id ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:bg-slate-50'}`}>
                        <Icon name={t.icon} size={20} />
                        {t.label}
                    </button>
                ))}
            </nav>
            <button onClick={() => supabase.auth.signOut()} className="text-slate-300 font-bold flex items-center gap-3 px-5 py-4 hover:text-red-500 transition-colors"><Icon name="LogOut" size={20} /> Sign Out</button>
        </aside>
    );
};

export default Sidebar;