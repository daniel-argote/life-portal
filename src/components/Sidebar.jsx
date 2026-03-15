import { useState, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import Icon from './Icon';

const Sidebar = ({ tab, setTab, darkMode, setDarkMode, style, setStyle, navItems, setNavItems, portalName, autoHide }) => {
    const [isReordering, setIsReordering] = useState(false);
    const dragItem = useRef(null);
    const dragOverItem = useRef(null);

    const toggleStyle = () => {
        const themes = ['default', 'nautical', 'forest'];
        const currentIndex = themes.indexOf(style);
        const nextIndex = (currentIndex + 1) % themes.length;
        setStyle(themes[nextIndex]);
    };

    const handleDragStart = (e, position) => {
        dragItem.current = position;
    };

    const handleDragEnter = (e, position) => {
        const listCopy = [...navItems];
        const dragItemContent = listCopy[dragItem.current];
        listCopy.splice(dragItem.current, 1);
        listCopy.splice(position, 0, dragItemContent);
        dragItem.current = position;
        dragOverItem.current = null;
        setNavItems(listCopy);
    };

    return (
        <aside 
            className={`fixed left-0 top-0 bottom-0 bg-base-200 border-r border-base-300 hidden md:flex flex-col p-4 transition-all duration-300 z-40 overflow-hidden group/sidebar
                ${autoHide ? 'w-20 hover:w-64' : 'w-64'}`}
        >
            <button 
                onClick={() => setTab('dashboard')} 
                className={`font-black text-2xl mb-12 text-primary flex items-center gap-3 tracking-tighter whitespace-nowrap px-2 h-12`}
            >
                <Icon name="LayoutDashboard" size={24} className="min-w-[24px]" /> 
                <span className={`transition-opacity duration-300 ${autoHide ? 'opacity-0 group-hover/sidebar:opacity-100' : 'opacity-100'}`}>
                    {portalName}
                </span>
            </button>

            <nav className="space-y-2 flex-1">
                {navItems.map((t, index) => (
                    <button 
                        key={t.id} 
                        onClick={() => !isReordering && setTab(t.id)} 
                        draggable={isReordering}
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragEnter={(e) => handleDragEnter(e, index)}
                        onDragOver={(e) => e.preventDefault()}
                        title={autoHide ? t.label : ''}
                        className={`w-full flex items-center gap-4 p-4 rounded-[1.25rem] font-bold transition-all whitespace-nowrap
                            ${isReordering ? 'cursor-move border-2 border-dashed border-base-content/20 bg-base-100 hover:border-primary' : (tab === t.id ? 'bg-primary/10 text-primary' : 'text-base-content/60 hover:bg-base-300/50')}`}
                    >
                        <Icon name={isReordering ? 'GripVertical' : t.icon} size={20} className="min-w-[20px]" />
                        <span className={`transition-opacity duration-300 ${autoHide ? 'opacity-0 group-hover/sidebar:opacity-100' : 'opacity-100'}`}>
                            {t.label}
                        </span>
                    </button>
                ))}
            </nav>

            <div className="pt-4 space-y-1 border-t border-base-300/50">
                <button 
                    onClick={() => setTab('settings')} 
                    className={`w-full flex items-center gap-4 p-4 rounded-[1.25rem] font-bold transition-all whitespace-nowrap
                        ${tab === 'settings' ? 'bg-primary/10 text-primary' : 'text-base-content/60 hover:text-primary hover:bg-base-300/50'}`}
                >
                    <Icon name="Settings" size={20} className="min-w-[20px]" />
                    <span className={`transition-opacity duration-300 ${autoHide ? 'opacity-0 group-hover/sidebar:opacity-100' : 'opacity-100'}`}>
                        Settings
                    </span>
                </button>

                <button 
                    onClick={() => setDarkMode(!darkMode)} 
                    className="w-full text-base-content/60 font-bold flex items-center gap-4 p-4 hover:text-primary transition-colors whitespace-nowrap"
                >
                    <Icon name={darkMode ? "Sun" : "Moon"} size={20} className="min-w-[20px]" />
                    <span className={`transition-opacity duration-300 ${autoHide ? 'opacity-0 group-hover/sidebar:opacity-100' : 'opacity-100'}`}>
                        {darkMode ? "Light Mode" : "Dark Mode"}
                    </span>
                </button>

                <button 
                    onClick={() => setIsReordering(!isReordering)} 
                    className={`w-full text-base-content/60 font-bold flex items-center gap-4 p-4 hover:text-primary transition-colors whitespace-nowrap ${isReordering ? 'text-primary bg-primary/5 rounded-[1.25rem]' : ''}`}
                >
                    <Icon name="ArrowUpDown" size={20} className="min-w-[20px]" />
                    <span className={`transition-opacity duration-300 ${autoHide ? 'opacity-0 group-hover/sidebar:opacity-100' : 'opacity-100'}`}>
                        {isReordering ? "Done Arranging" : "Arrange Tabs"}
                    </span>
                </button>

                <button 
                    onClick={toggleStyle} 
                    className="w-full text-base-content/60 font-bold flex items-center gap-4 p-4 hover:text-primary transition-colors whitespace-nowrap"
                >
                    <Icon name="Palette" size={20} className="min-w-[20px]" />
                    <span className={`transition-opacity duration-300 ${autoHide ? 'opacity-0 group-hover/sidebar:opacity-100' : 'opacity-100'}`}>
                        Style: {style.charAt(0).toUpperCase() + style.slice(1)}
                    </span>
                </button>

                <button 
                    onClick={() => supabase.auth.signOut()} 
                    className="w-full text-base-content/60 font-bold flex items-center gap-4 p-4 hover:text-danger transition-colors mt-2 whitespace-nowrap"
                >
                    <Icon name="LogOut" size={20} className="min-w-[20px]" />
                    <span className={`transition-opacity duration-300 ${autoHide ? 'opacity-0 group-hover/sidebar:opacity-100' : 'opacity-100'}`}>
                        Sign Out
                    </span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;