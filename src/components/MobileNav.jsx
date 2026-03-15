import Icon from './Icon';

const MobileNav = ({ tab, setTab, navItems }) => {
    return (
        <nav className="md:hidden fixed bottom-6 left-6 right-6 glass-nav rounded-[2rem] p-1.5 flex items-center shadow-2xl z-50 border border-white dark:border-slate-700 overflow-x-auto no-scrollbar">
            <div className="flex w-full justify-around min-w-max gap-1">
                {navItems.map(t => (
                    <button key={t.id} onClick={() => setTab(t.id)} className={`p-3.5 rounded-[1.5rem] transition-all shrink-0 ${tab === t.id ? 'bg-slate-900 text-white dark:bg-indigo-600' : 'text-slate-600'}`}>
                        <Icon name={t.icon} size={22} />
                    </button>
                ))}
                <button 
                    onClick={() => setTab('settings')} 
                    className={`p-3.5 rounded-[1.5rem] transition-all shrink-0 ${tab === 'settings' ? 'bg-slate-900 text-white dark:bg-indigo-600' : 'text-slate-600'}`}
                >
                    <Icon name="Settings" size={22} />
                </button>
            </div>
        </nav>
    );
};

export default MobileNav;