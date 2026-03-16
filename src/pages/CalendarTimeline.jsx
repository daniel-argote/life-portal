import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import Icon from '../components/Icon';
import PageContainer from '../components/PageContainer';
import { format, parseISO, isAfter, startOfDay } from 'date-fns';

const CalendarTimeline = ({ user }) => {
    const [data, setData] = useState({
        events: [],
        bills: [],
        todos: [],
        goals: [],
        appointments: []
    });

    const fetchData = useCallback(async () => {
        if (!user) return;

        const [
            { data: e }, { data: b }, { data: t }, { data: g }, { data: a }
        ] = await Promise.all([
            supabase.from('calendar').select('*'),
            supabase.from('money_bills').select('*'),
            supabase.from('todos').select('*').not('due_date', 'is', null),
            supabase.from('goals').select('*').not('target_date', 'is', null),
            supabase.from('health_appointments').select('*')
        ]);

        setData({
            events: e || [],
            bills: b || [],
            todos: t || [],
            goals: g || [],
            appointments: a || []
        });
    }, [user]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const timelineItems = useMemo(() => {
        const items = [];
        const today = startOfDay(new Date());

        data.events.forEach(item => items.push({ ...item, type: 'event', date: parseISO(item.start_time), color: 'primary' }));
        data.bills.forEach(item => items.push({ ...item, type: 'bill', date: parseISO(item.due_date), color: 'emerald-500' }));
        data.todos.forEach(item => items.push({ ...item, type: 'objective', date: parseISO(item.due_date), color: 'amber-500' }));
        data.goals.forEach(item => items.push({ ...item, type: 'goal', date: parseISO(item.target_date), color: 'indigo-500' }));
        data.appointments.forEach(item => items.push({ ...item, type: 'appointment', date: parseISO(item.date), color: 'rose-500' }));

        return items
            .filter(item => isAfter(item.date, today) || format(item.date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd'))
            .sort((a, b) => a.date.getTime() - b.date.getTime());
    }, [data]);

    const getIcon = (type) => {
        if (type === 'event') return 'Calendar';
        if (type === 'bill') return 'CreditCard';
        if (type === 'objective') return 'CheckSquare';
        if (type === 'goal') return 'Star';
        if (type === 'appointment') return 'Heart';
        return 'Circle';
    };

    return (
        <PageContainer>
            <div className="relative pl-8 md:pl-12 border-l-4 border-base-300 ml-4 space-y-12 py-8">
                {timelineItems.map((item, idx) => {
                    const iconName = getIcon(item.type);
                    return (
                        <div key={`${item.type}-${item.id}`} className="relative animate-in slide-in-from-left-4 duration-500" style={{ animationDelay: `${idx * 50}ms` }}>
                            {/* Timeline Node */}
                            <div className={`absolute -left-[42px] md:-left-[58px] top-0 w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-base-100 border-4 border-base-300 flex items-center justify-center shadow-sm z-10 text-${item.color}`}>
                                <Icon name={iconName} size={20} />
                            </div>

                            {/* Content Card */}
                            <div className="bg-base-200 p-6 md:p-8 rounded-[2.5rem] border border-base-300 shadow-sm hover:border-primary/30 transition-all group">
                                <header className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-4">
                                    <div className="space-y-1">
                                        <p className={`text-[10px] font-black uppercase tracking-widest text-${item.color}`}>
                                            {item.type} • {format(item.date, 'EEEE, MMMM do')}
                                        </p>
                                        <h4 className="text-2xl font-black text-base-content leading-tight">
                                            {item.title || item.task || item.name || item.provider}
                                        </h4>
                                    </div>
                                    <div className="bg-base-100 px-4 py-2 rounded-xl border border-base-300/50 flex items-center gap-2">
                                        <Icon name="Clock" size={14} className="text-slate-400" />
                                        <span className="text-sm font-bold text-base-content/60">
                                            {format(item.date, 'yyyy')}
                                        </span>
                                    </div>
                                </header>
                                
                                {(item.description || item.notes || item.content) && (
                                    <p className="text-slate-600 font-bold text-sm leading-relaxed border-t border-base-300/50 pt-4 mt-4">
                                        {item.description || item.notes || item.content}
                                    </p>
                                )}

                                {item.amount && (
                                    <div className="mt-4 flex items-center gap-2">
                                        <span className="text-[10px] font-black uppercase text-emerald-500">Obligation:</span>
                                        <span className="text-xl font-black text-emerald-600">${item.amount}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}

                {timelineItems.length === 0 && (
                    <div className="p-20 text-center text-slate-400 font-bold border-2 border-dashed border-base-300 rounded-[3rem] -ml-8 md:-ml-12 bg-base-200/50">
                        <Icon name="History" size={48} className="mx-auto mb-4 opacity-20" />
                        <p>Your timeline is clear. Add events or goals to see them here.</p>
                    </div>
                )}
            </div>
        </PageContainer>
    );
};

export default CalendarTimeline;
