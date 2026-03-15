import { useState, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import Icon from './Icon';

const Sidebar = ({ tab, setTab, darkMode, setDarkMode, style, setStyle, navItems, setNavItems, portalName, autoHide, showSubFeatures }) => {
    const [isReordering, setIsReordering] = useState(false);
    const dragItem = useRef(null);
    const dragOverItem = useRef(null);

    // Flatten hierarchy for reordering
    const flatten = (items, parentId = null) => {
        return items.reduce((acc, item) => {
            acc.push({ ...item, parentId });
            if (item.children) acc.push(...flatten(item.children, item.id));
            return acc;
        }, []);
    };

    // Reconstruct hierarchy after flat reordering
    const reconstruct = (flatItems) => {
        const map = {};
        const roots = [];
        flatItems.forEach(item => {
            const newItem = { ...item, children: [] };
            map[item.id] = newItem;
            if (item.parentId && map[item.parentId]) {
                map[item.parentId].children.push(newItem);
            } else {
                roots.push(newItem);
            }
        });
        return roots;
    };

    const toggleStyle = () => {
        const themes = ['default', 'nautical', 'forest'];
        const currentIndex = themes.indexOf(style);
        const nextIndex = (currentIndex + 1) % themes.length;
        setStyle(themes[nextIndex]);
    };

    const handleDragStart = (e, index) => {
        dragItem.current = index;
    };

    const handleDragEnter = (e, index) => {
        const flat = flatten(navItems);
        const listCopy = [...flat];
        const dragItemContent = listCopy[dragItem.current];
        listCopy.splice(dragItem.current, 1);
        listCopy.splice(index, 0, dragItemContent);
        dragItem.current = index;
        setNavItems(reconstruct(listCopy));
    };

    const renderNavItem = (item, index, depth = 0) => {
        const hasChildren = item.children && item.children.length > 0;
        const isVisible = depth === 0 || showSubFeatures || isReordering;

        if (!isVisible) return null;

        return (
            <div key={item.id} className="space-y-1">
                <button 
                    onClick={() => !isReordering && setTab(item.id)} 
                    draggable={isReordering}
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragEnter={(e) => handleDragEnter(e, index)}
                    onDragOver={(e) => e.preventDefault()}
                    title={autoHide ? item.label : ''}
                    className={`w-full flex items-center gap-4 p-4 rounded-[1.25rem] font-bold transition-all whitespace-nowrap
                        ${depth > 0 ? 'ml-6 scale-95 opacity-80' : ''}
                        ${isReordering ? 'cursor-move border-2 border-dashed border-base-content/20 bg-base-100 hover:border-primary' : (tab === item.id ? 'bg-primary/10 text-primary' : 'text-base-content/60 hover:bg-base-300/50')}`}
                >
                    <Icon name={isReordering ? 'GripVertical' : item.icon} size={20} className="min-w-[20px]" />
                    <span className={`transition-opacity duration-300 ${autoHide ? 'opacity-0 group-hover/sidebar:opacity-100' : 'opacity-100'}`}>
                        {item.label}
                    </span>
                    {hasChildren && !isReordering && !showSubFeatures && (
                        <div className="ml-auto w-2 h-2 rounded-full bg-primary/40" />
                    )}
                </button>
                {hasChildren && (showSubFeatures || isReordering) && (
                    <div className="space-y-1">
                        {item.children.map((child, childIdx) => renderNavItem(child, index + childIdx + 1, depth + 1))}
                    </div>
                )}
            </div>
        );
    };

    const flatItems = isReordering ? flatten(navItems) : navItems;

    return (
        <aside 
            className={`fixed left-0 top-0 bottom-0 bg-base-200 border-r border-base-300 hidden md:flex flex-col p-4 transition-all duration-300 z-40 overflow-y-auto overflow-x-hidden no-scrollbar group/sidebar
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
                {flatItems.map((item, index) => renderNavItem(item, index))}
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