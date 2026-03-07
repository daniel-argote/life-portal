import Icon from './Icon';

const navItems = [
    { id: 'command', icon: 'LayoutDashboard' },
    { id: 'brain', icon: 'Brain' },
    { id: 'log', icon: 'BookText' }
];

const MobileNav = ({ tab, setTab }) => {
    return (
        <nav className="md:hidden fixed bottom-6 left-6 right-6 glass-nav rounded-[2.5rem] p-2 flex justify-around shadow-2xl z-50 border border-white">
            {navItems.map(t => (
                <button key={t.id} onClick={() => setTab(t.id)} className={`p-4 rounded-[2rem] transition-all ${tab === t.id ? 'bg-slate-900 text-white' : 'text-slate-400'}`}>
                    <Icon name={t.icon} size={24} />
                </button>
            ))}
        </nav>
    );
};

export default MobileNav;