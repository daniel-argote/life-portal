import { useState, useEffect, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { supabase } from '../lib/supabaseClient';
import Icon from '../components/Icon';
import EditableHeader from '../components/EditableHeader';
import { format } from 'date-fns';
import { getWeatherIcon } from './Weather';

const Dashboard = ({ vault, logs, todos, events, user, pageName, setPageName, showHeaders, config, dashboardWidgets, updateDashboardWidgets }) => {
    const [widgets, setWidgets] = useState([]);

    useEffect(() => {
        const defaults = [
            { id: 'weather', title: 'Weather', icon: 'CloudSun', fullWidth: false },
            { id: 'brain', title: 'Knowledge Links', icon: 'Link', fullWidth: false },
            { id: 'journal', title: 'Recent Journal', icon: 'BookText', fullWidth: false },
            { id: 'actions', title: 'Pending Objectives', icon: 'CheckSquare', fullWidth: false },
            { id: 'calendar', title: 'Upcoming', icon: 'Calendar', fullWidth: false }
        ];
        
        if (dashboardWidgets && dashboardWidgets.length > 0) {
            setWidgets(dashboardWidgets);
        } else {
            setWidgets(defaults);
        }
    }, [dashboardWidgets]);

    const [showWidgetStore, setShowWidgetStore] = useState(false);
    const [weatherData, setWeatherData] = useState([]); // Array of { loc, forecast }

    const fetchWeather = useCallback(async () => {
        if (!user) return;
        const { data: primaryLocs } = await supabase
            .from('weather_locations')
            .select('*')
            .eq('is_primary', true)
            .limit(2);
        
        if (primaryLocs) {
            const forecasts = await Promise.all(primaryLocs.map(async (loc) => {
                try {
                    const unitParam = config?.weatherUnit === 'fahrenheit' ? '&temperature_unit=fahrenheit' : '';
                    const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}&current_weather=true&timezone=auto${unitParam}`);
                    const data = await res.json();
                    return { loc, current: data.current_weather };
                } catch (e) {
                    return { loc, error: true };
                }
            }));
            setWeatherData(forecasts);
        }
    }, [user, config?.weatherUnit]);

    useEffect(() => {
        fetchWeather();
    }, [fetchWeather]);

    const onDragEnd = (result) => {
        if (!result.destination) return;
        const newItems = Array.from(widgets);
        const [reorderedItem] = newItems.splice(result.source.index, 1);
        newItems.splice(result.destination.index, 0, reorderedItem);
        setWidgets(newItems);
        updateDashboardWidgets(newItems);
    };

    const toggleFullWidth = (id) => {
        const newWidgets = widgets.map(w => w.id === id ? { ...w, fullWidth: !w.fullWidth } : w);
        setWidgets(newWidgets);
        updateDashboardWidgets(newWidgets);
    };

    const removeWidget = (id) => {
        const newWidgets = widgets.filter(w => w.id !== id);
        setWidgets(newWidgets);
        updateDashboardWidgets(newWidgets);
    };

    const addWidget = (widget) => {
        if (!widgets.find(w => w.id === widget.id)) {
            const newWidgets = [...widgets, { ...widget, fullWidth: false }];
            setWidgets(newWidgets);
            updateDashboardWidgets(newWidgets);
        }
        setShowWidgetStore(false);
    };

    const WIDGET_OPTIONS = [
        { id: 'weather', title: 'Weather', icon: 'CloudSun' },
        { id: 'brain', title: 'Knowledge Links', icon: 'Link' },
        { id: 'journal', title: 'Recent Journal', icon: 'BookText' },
        { id: 'actions', title: 'Pending Objectives', icon: 'CheckSquare' },
        { id: 'calendar', title: 'Upcoming', icon: 'Calendar' }
    ];

    const renderWidgetContent = (id) => {
        switch (id) {
            case 'weather':
                return (
                    <div className="grid grid-cols-1 gap-4">
                        {weatherData.map((data, i) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl">
                                <div className="flex items-center gap-4">
                                    <div className="text-primary">
                                        <Icon name={data.current ? getWeatherIcon(data.current.weathercode) : 'CloudOff'} size={24} />
                                    </div>
                                    <div>
                                        <p className="font-bold dark:text-white text-sm truncate max-w-[120px]">{data.loc.name.split(',')[0]}</p>
                                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Current</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-black text-primary">{data.current ? Math.round(data.current.temperature) : '--'}°</p>
                                    <p className="text-[8px] font-black text-slate-600 uppercase tracking-tighter">
                                        {config.weatherUnit === 'fahrenheit' ? 'Fahrenheit' : 'Celsius'}
                                    </p>
                                </div>
                            </div>
                        ))}
                        {weatherData.length === 0 && (
                            <p className="text-slate-600 font-bold text-xs text-center py-4 italic">No primary locales set in Weather module.</p>
                        )}
                        <div className="flex justify-center pt-2">
                            <a href="https://open-meteo.com/" target="_blank" rel="noreferrer" className="text-[8px] font-black text-slate-500 uppercase tracking-widest hover:text-primary transition-colors">Weather by Open-Meteo</a>
                        </div>
                    </div>
                );
            case 'brain':
                return (
                    <div className="space-y-4">
                        {vault.slice(0, 5).map(v => (
                            <div key={v.id} className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl flex items-center gap-4 group">
                                <div className="bg-white dark:bg-slate-800 p-2 rounded-lg shadow-sm group-hover:scale-110 transition-transform">
                                    <Icon name="FileText" size={16} className="text-primary" />
                                </div>
                                <span className="font-bold dark:text-white truncate">{v.title}</span>
                            </div>
                        ))}
                        {vault.length === 0 && <p className="text-slate-600 font-bold text-sm text-center py-4">No items in your vault yet.</p>}
                    </div>
                );
            case 'journal':
                return (
                    <div className="space-y-4">
                        {logs.slice(0, 5).map(l => (
                            <div key={l.id} className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border-l-4 border-primary">
                                <p className="text-sm font-bold dark:text-white line-clamp-2">{l.content}</p>
                                <p className="text-[10px] text-slate-600 font-black mt-2 uppercase tracking-widest">{new Date(l.created_at).toLocaleDateString()}</p>
                            </div>
                        ))}
                        {logs.length === 0 && <p className="text-slate-600 font-bold text-sm text-center py-4">No activity recorded recently.</p>}
                    </div>
                );
            case 'actions':
                return (
                    <div className="space-y-3">
                        {todos.slice(0, 5).map(t => (
                            <div key={t.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                <span className="text-sm font-bold dark:text-white truncate">{t.task}</span>
                            </div>
                        ))}
                        {todos.length === 0 && <p className="text-slate-600 font-bold text-sm text-center py-4">All objectives complete.</p>}
                    </div>
                );
            case 'calendar':
                return (
                    <div className="space-y-3">
                        {events.slice(0, 5).map(e => {
                            const date = new Date(e.start_time.split('T')[0].replace(/-/g, '\/'));
                            return (
                                <div key={e.id} className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                                    <div className="text-center min-w-[40px]">
                                        <p className="text-[10px] font-black uppercase text-primary">{format(date, 'MMM')}</p>
                                        <p className="text-lg font-black dark:text-white leading-none">{format(date, 'd')}</p>
                                    </div>
                                    <span className="text-sm font-bold dark:text-white truncate">{e.title}</span>
                                </div>
                            );
                        })}
                        {events.length === 0 && <p className="text-slate-600 font-bold text-sm text-center py-4">No upcoming events.</p>}
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="space-y-10 pb-20">
            <div className="flex justify-between items-start">
                {showHeaders && (
                    <EditableHeader 
                        value={pageName} 
                        onSave={setPageName} 
                        subtext="Status: Operational" 
                    />
                )}
                <button 
                    onClick={() => setShowWidgetStore(true)}
                    className="bg-primary/10 text-primary p-4 rounded-2xl font-bold hover:bg-primary hover:text-primary-content transition-all flex items-center gap-2"
                >
                    <Icon name="Plus" size={20} />
                    <span className="hidden md:inline">Add Widget</span>
                </button>
            </div>

            <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="dashboard-grid" direction="vertical">
                    {(provided) => (
                        <div 
                            {...provided.droppableProps} 
                            ref={provided.innerRef}
                            className="grid grid-cols-1 md:grid-cols-2 gap-8"
                        >
                            {widgets.map((widget, index) => (
                                <Draggable key={widget.id} draggableId={widget.id} index={index}>
                                    {(provided, snapshot) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            className={`bg-white dark:bg-slate-800 p-8 md:p-10 rounded-[3rem] border border-slate-100 dark:border-slate-700 shadow-sm transition-all flex flex-col
                                                ${widget.fullWidth ? 'md:col-span-2' : ''}
                                                ${snapshot.isDragging ? 'shadow-2xl ring-4 ring-primary/10 z-50 scale-[1.02] bg-white dark:bg-slate-800' : ''}`}
                                        >
                                            <div className="flex justify-between items-center mb-8">
                                                <h3 className="font-bold text-xl dark:text-white flex items-center gap-3">
                                                    <Icon name={widget.icon} size={24} className="text-primary" />
                                                    {widget.title}
                                                </h3>
                                                <div className="flex items-center gap-1">
                                                    <button 
                                                        onClick={() => toggleFullWidth(widget.id)}
                                                        className={`p-2 rounded-lg transition-colors ${widget.fullWidth ? 'bg-primary/10 text-primary' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                                                        title={widget.fullWidth ? "Make Half Width" : "Make Full Width"}
                                                    >
                                                        <Icon name={widget.fullWidth ? "Minimize2" : "Maximize2"} size={16} />
                                                    </button>
                                                    <button 
                                                        onClick={() => removeWidget(widget.id)}
                                                        className="p-2 text-slate-500 hover:text-danger hover:bg-danger/10 rounded-lg transition-colors"
                                                        title="Remove Widget"
                                                    >
                                                        <Icon name="X" size={16} />
                                                    </button>
                                                    <div 
                                                        {...provided.dragHandleProps}
                                                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl cursor-grab active:cursor-grabbing text-slate-500 transition-colors"
                                                        aria-label={`Drag to reorder ${widget.type} widget`}
                                                    >
                                                        <Icon name="GripVertical" size={20} />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex-1">
                                                {renderWidgetContent(widget.id)}
                                            </div>
                                        </div>
                                    )}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </DragDropContext>

            {/* Widget Store Modal */}
            {showWidgetStore && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
                    <div className="bg-base-200 w-full max-w-md p-8 rounded-[2.5rem] border border-base-300 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-2xl font-black text-base-content">Add Widget</h3>
                            <button onClick={() => setShowWidgetStore(false)} className="text-slate-600 hover:text-base-content">
                                <Icon name="X" size={24} />
                            </button>
                        </div>
                        <div className="grid gap-4">
                            {WIDGET_OPTIONS.map(opt => {
                                const isAdded = widgets.find(w => w.id === opt.id);
                                return (
                                    <button
                                        key={opt.id}
                                        disabled={isAdded}
                                        onClick={() => addWidget(opt)}
                                        className={`w-full p-4 rounded-2xl flex items-center justify-between font-bold transition-all border-2
                                            ${isAdded ? 'opacity-50 border-transparent bg-slate-100 dark:bg-slate-800' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-primary hover:scale-[1.02]'}`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <Icon name={opt.icon} size={20} className="text-primary" />
                                            <span className="dark:text-white">{opt.title}</span>
                                        </div>
                                        {isAdded ? <Icon name="Check" size={18} className="text-emerald-500" /> : <Icon name="Plus" size={18} />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;