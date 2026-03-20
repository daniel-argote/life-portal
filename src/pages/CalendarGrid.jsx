import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import Icon from '../components/Icon';
import PageContainer from '../components/PageContainer';
import { 
    format, 
    startOfMonth, 
    endOfMonth, 
    startOfWeek, 
    endOfWeek, 
    eachDayOfInterval, 
    isSameMonth, 
    isSameDay, 
    addMonths, 
    subMonths,
    parseISO
} from 'date-fns';

const CalendarGrid = ({ user, notify, events: propEvents = [], appointments: propAppointments = [], config = {}, dismissWelcome }) => {
    const [events, setEvents] = useState(propEvents);
    const [bills, setBills] = useState([]);
    const [todos, setTodos] = useState([]);
    const [goals, setGoals] = useState([]);
    const [appointments, setAppointments] = useState(propAppointments);
    
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [loading, setLoading] = useState(false);
    
    // Hub specific logic
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const todayEvents = events.filter(e => e.start_time.split('T')[0] === todayStr);
    const nextAppt = appointments.filter(a => isSameDay(parseISO(a.date), new Date()) || new Date(a.date) > new Date())[0];

    // Form State
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ title: '', start_time: format(new Date(), 'yyyy-MM-dd') });

    const fetchData = useCallback(async () => {
        if (!user) return;

        // Fetch regular events
        const { data: eventData } = await supabase.from('calendar').select('*');
        if (eventData) setEvents(eventData);

        // Fetch bills
        const { data: billData } = await supabase.from('money_bills').select('*');
        if (billData) setBills(billData);

        // Fetch Todos (Objectives)
        const { data: todoData } = await supabase.from('todos').select('*').not('due_date', 'is', null);
        if (todoData) setTodos(todoData);

        // Fetch Goals
        const { data: goalData } = await supabase.from('goals').select('*').not('target_date', 'is', null);
        if (goalData) setGoals(goalData);

        // Fetch Appointments
        const { data: apptData } = await supabase.from('health_appointments').select('*').order('date', { ascending: true });
        if (apptData) setAppointments(apptData);

    }, [user]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const addEvent = async (e) => {
        e.preventDefault();
        if (!form.title || !form.start_time) return;
        setLoading(true);
        const { error } = await supabase.from('calendar').insert([{ ...form, user_id: user.id }]);
        if (!error) {
            setForm({ title: '', start_time: format(new Date(), 'yyyy-MM-dd') });
            setShowForm(false);
            fetchData();
            if (notify) notify('Event added');
        }
        setLoading(false);
    };

    const deleteEvent = async (id) => {
        const { error } = await supabase.from('calendar').delete().eq('id', id);
        if (!error) { fetchData(); if (notify) notify('Event deleted'); }
    };

    // Calendar Grid Logic
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

    const openFormForDate = (day) => {
        setForm({ ...form, start_time: format(day, 'yyyy-MM-dd') });
        setShowForm(true);
    };

    return (
        <PageContainer>
            {config.showWelcomes && !config.dismissedWelcomes?.includes('calendar') && (
                <div className="bg-primary/5 border border-primary/10 p-10 rounded-[3rem] text-center mb-10 relative group">
                    <button 
                        onClick={() => dismissWelcome('calendar')}
                        className="absolute top-6 right-6 p-2 rounded-full hover:bg-primary/10 transition-colors text-primary/40 hover:text-primary"
                        title="Dismiss"
                    >
                        <Icon name="X" size={20} />
                    </button>
                    <Icon name="Calendar" size={48} className="text-primary/20 mx-auto mb-4" />
                    <h4 className="text-2xl font-black text-base-content mb-2">Calendar Dashboard</h4>
                    <p className="text-slate-600 font-bold max-w-md mx-auto">
                        Overview of your agenda, upcoming appointments, and a full monthly planning grid.
                    </p>
                </div>
            )}

            {/* Top Row: Agenda and Coming Up */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                {/* Today's Agenda */}
                <div className="bg-base-200 p-8 rounded-[2.5rem] border border-base-300 shadow-sm flex flex-col transition-all hover:border-primary/30">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-primary/10 text-primary rounded-2xl">
                            <Icon name="Clock" size={24} />
                        </div>
                        <h3 className="font-black text-lg">Today&apos;s Agenda</h3>
                    </div>
                    {todayEvents.length > 0 ? (
                        <div className="space-y-3 flex-1">
                            {todayEvents.map(e => (
                                <div key={e.id} className="bg-base-100 p-4 rounded-2xl border border-base-300/50">
                                    <p className="font-bold text-base-content">{e.title}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-slate-500 font-bold text-sm italic flex-1 flex items-center justify-center text-center">Nothing scheduled for today</p>
                    )}
                </div>

                {/* Next Appointment */}
                <div className="bg-base-200 p-8 rounded-[2.5rem] border border-base-300 shadow-sm flex flex-col transition-all hover:border-indigo-500/30">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-2xl">
                            <Icon name="HeartPulse" size={24} />
                        </div>
                        <h3 className="font-black text-lg">Coming Up</h3>
                    </div>
                    {nextAppt ? (
                        <div className="bg-base-100 p-6 rounded-3xl border border-base-300/50 flex-1">
                            <p className="text-[10px] font-black uppercase text-indigo-500 mb-2">{format(parseISO(nextAppt.date), 'EEEE, MMMM do')}</p>
                            <h4 className="text-xl font-black text-base-content leading-tight">{nextAppt.provider}</h4>
                            <p className="text-xs font-bold text-slate-600 mt-1 uppercase tracking-widest">{nextAppt.type}</p>
                        </div>
                    ) : (
                        <p className="text-slate-500 font-bold text-sm italic flex-1 flex items-center justify-center text-center">No upcoming appointments</p>
                    )}
                </div>
            </div>

            {/* Calendar Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-base-200 p-4 rounded-[2rem] border border-base-300 shadow-sm mb-6">
                <div className="flex items-center gap-4">
                    <button onClick={prevMonth} className="p-2 hover:bg-base-300 rounded-full transition-colors text-slate-600"><Icon name="ChevronLeft" size={20} /></button>
                    <h3 className="text-xl font-black text-base-content min-w-[150px] text-center">{format(currentMonth, 'MMMM yyyy')}</h3>
                    <button onClick={nextMonth} className="p-2 hover:bg-base-300 rounded-full transition-colors text-slate-600"><Icon name="ChevronRight" size={20} /></button>
                </div>
                <button onClick={() => setShowForm(!showForm)} className="bg-primary text-primary-content px-6 py-3 rounded-2xl font-bold shadow-lg hover:scale-105 transition-all flex items-center gap-2">
                    <Icon name={showForm ? "X" : "Plus"} size={18} />
                    {showForm ? "Close" : "New Event"}
                </button>
            </div>

            {showForm && (
                <form onSubmit={addEvent} className="bg-base-200 p-8 rounded-[2rem] border border-base-300 shadow-xl flex flex-col md:flex-row gap-4 animate-in slide-in-from-top-4 duration-300 mb-6">
                    <input type="date" className="bg-base-100 p-4 rounded-xl font-bold outline-none text-base-content [color-scheme:light] dark:[color-scheme:dark]" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} />
                    <input placeholder="What's happening?" className="flex-1 bg-base-100 p-4 rounded-xl font-bold outline-none text-base-content border-2 border-transparent focus:border-primary transition-all" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} autoFocus />
                    <button disabled={loading} className="bg-primary text-primary-content px-8 py-4 rounded-xl font-bold hover:opacity-90 disabled:opacity-50">{loading ? 'Saving...' : 'Add Event'}</button>
                </form>
            )}

            {/* Monthly Grid */}
            <div className="bg-base-200 rounded-[2.5rem] border border-base-300 shadow-sm overflow-hidden mb-12">
                <div className="grid grid-cols-7 border-b border-base-300 bg-base-300/30">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (<div key={day} className="py-4 text-center text-[10px] font-black uppercase tracking-widest text-slate-600">{day}</div>))}
                </div>

                <div className="grid grid-cols-7">
                    {calendarDays.map((day) => {
                        const isToday = isSameDay(day, new Date());
                        const isCurrentMonth = isSameMonth(day, monthStart);
                        const formatDate = (d) => new Date(d.replace(/-/g, '/'));

                        return (
                            <div key={day.toString()} onClick={() => openFormForDate(day)} className={`min-h-[140px] p-2 border-r border-b border-base-300 last:border-r-0 cursor-pointer transition-all hover:bg-base-300/50 group ${!isCurrentMonth ? 'opacity-20' : ''}`}>
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-black ${isToday ? 'bg-primary text-primary-content' : 'text-base-content'}`}>{format(day, 'd')}</span>
                                </div>
                                <div className="space-y-1">
                                    {/* Regular Events - Blue */}
                                    {events.filter(e => isSameDay(formatDate(e.start_time.split('T')[0]), day)).map(e => (
                                        <div key={e.id} onClick={(ev) => { ev.stopPropagation(); }} className="bg-primary/10 border border-primary/20 p-1.5 rounded-lg text-[10px] font-bold text-primary flex justify-between items-center group/event">
                                            <span className="truncate">{e.title}</span>
                                            <button onClick={(ev) => { ev.stopPropagation(); deleteEvent(e.id); }} className="opacity-0 group-hover/event:opacity-100 hover:text-danger ml-1"><Icon name="X" size={10} /></button>
                                        </div>
                                    ))}
                                    {/* Bills - Green */}
                                    {bills.filter(b => isSameDay(formatDate(b.due_date), day)).map(b => (
                                        <div key={b.id} className={`border p-1.5 rounded-lg text-[10px] font-bold flex justify-between items-center ${b.is_paid ? 'bg-slate-100 border-slate-200 text-slate-600 opacity-50' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600'}`}>
                                            <span className="truncate flex items-center gap-1"><Icon name="CreditCard" size={8} />{b.name}</span>
                                            <span className="font-black">${b.amount}</span>
                                        </div>
                                    ))}
                                    {/* Objectives - Amber/Yellow */}
                                    {todos.filter(t => isSameDay(formatDate(t.due_date), day)).map(t => (
                                        <div key={t.id} className={`border p-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 ${t.status === 'done' ? 'bg-slate-100 text-slate-600 opacity-50' : 'bg-amber-500/10 border-amber-500/20 text-amber-600'}`}>
                                            <Icon name="CheckSquare" size={8} />
                                            <span className="truncate">{t.task}</span>
                                        </div>
                                    ))}
                                    {/* Goals - Purple */}
                                    {goals.filter(g => isSameDay(formatDate(g.target_date), day)).map(g => (
                                        <div key={g.id} className="bg-indigo-500/10 border border-indigo-500/20 p-1.5 rounded-lg text-[10px] font-bold text-indigo-600 flex items-center gap-1">
                                            <Icon name="Star" size={8} />
                                            <span className="truncate">{g.title}</span>
                                        </div>
                                    ))}
                                    {/* Health Appointments - Rose/Red */}
                                    {appointments.filter(a => isSameDay(formatDate(a.date), day)).map(a => (
                                        <div key={a.id} className="bg-rose-500/10 border border-rose-500/20 p-1.5 rounded-lg text-[10px] font-bold text-rose-600 flex items-center gap-1">
                                            <Icon name="Heart" size={8} />
                                            <span className="truncate">{a.provider}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </PageContainer>
    );
};

export default CalendarGrid;
