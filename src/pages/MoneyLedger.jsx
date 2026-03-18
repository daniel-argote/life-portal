import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import Icon from '../components/Icon';
import { format, addDays, parseISO, getDay, subDays, startOfDay } from 'date-fns';
import PageContainer from '../components/PageContainer';

const MoneyLedger = ({ user, notify, config }) => {
    const [weeks, setWeeks] = useState([]);
    const [weekItems, setWeekItems] = useState([]);
    const [activeWeekIndex, setActiveWeekIndex] = useState(0);
    const [loading, setLoading] = useState(false);
    const [newItem, setNewItem] = useState({ title: '', amount: '' });
    const activeWeek = weeks[activeWeekIndex] || null;

    const fetchWeeks = useCallback(async () => {
        if (!user) return;
        const { data } = await supabase.from('money_weeks').select('*').order('start_date', { ascending: false });
        setWeeks(data || []);
    }, [user]);

    const fetchWeekItems = useCallback(async () => {
        if (!activeWeek) {
            setWeekItems([]);
            return;
        }
        const { data } = await supabase.from('money_items').select('*').eq('week_id', activeWeek.id).order('created_at', { ascending: true });
        setWeekItems(data || []);
    }, [activeWeek]);

    useEffect(() => { fetchWeeks(); }, [fetchWeeks]);
    useEffect(() => { fetchWeekItems(); }, [fetchWeekItems]);

    const createNextWeek = async () => {
        let startDate;
        const previousWeek = weeks.length > 0 ? weeks[0] : null;
        const targetDay = config.financialWeekStart || 0;

        if (previousWeek) {
            const prevStart = parseISO(previousWeek.start_date);
            let candidate = addDays(prevStart, 7);
            while (getDay(candidate) !== targetDay) {
                candidate = addDays(candidate, 1);
            }
            startDate = format(candidate, 'yyyy-MM-dd');
        } else {
            let candidate = startOfDay(new Date());
            while (getDay(candidate) !== targetDay) {
                candidate = subDays(candidate, 1);
            }
            startDate = format(candidate, 'yyyy-MM-dd');
        }

        setLoading(true);
        const { data: newWeekData } = await supabase.from('money_weeks').insert([{ start_date: startDate, user_id: user.id }]).select();
        if (newWeekData) {
            if (previousWeek) {
                const { data: itemsToCopy } = await supabase.from('money_items').select('*').eq('week_id', previousWeek.id);
                if (itemsToCopy?.length > 0) {
                    const newItems = itemsToCopy.map(({ title, amount, category }) => ({ title, amount, category, week_id: newWeekData[0].id, user_id: user.id, is_paid: false }));
                    await supabase.from('money_items').insert(newItems);
                }
            }
            await fetchWeeks();
            setActiveWeekIndex(0);
            notify(`New week starting ${format(parseISO(startDate), 'EEEE, MMM do')}`);
        }

        setLoading(false);
    };

    const addItem = async () => {
        if (!activeWeek || !newItem.title || !newItem.amount) return;
        const { error } = await supabase.from('money_items').insert([{ week_id: activeWeek.id, user_id: user.id, title: newItem.title, amount: newItem.amount, is_paid: false }]);
        if (error) {
            notify(error, 'error');
        } else {
            setNewItem({ title: '', amount: '' }); 
            fetchWeekItems(); 
            notify('Item added'); 
        }
    };

    const togglePaid = async (item) => {
        const { error } = await supabase.from('money_items').update({ is_paid: !item.is_paid }).eq('id', item.id);
        if (!error) fetchWeekItems();
    };

    const deleteItem = async (id) => {
        const { error } = await supabase.from('money_items').delete().eq('id', id);
        if (error) {
            notify(error, 'error');
        } else {
            fetchWeekItems(); 
            notify('Item removed'); 
        }
    };

    const weekTotal = weekItems.reduce((acc, item) => acc + Number(item.amount), 0);
    const paidTotal = weekItems.filter(i => i.is_paid).reduce((acc, item) => acc + Number(item.amount), 0);

    return (
        <PageContainer>
            <header className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    {activeWeek && (
                        <div className="flex items-center gap-2 bg-base-200 rounded-lg p-1">
                            <button onClick={() => setActiveWeekIndex(Math.min(weeks.length - 1, activeWeekIndex + 1))} disabled={activeWeekIndex >= weeks.length - 1} className="p-2 hover:bg-base-300 rounded-md disabled:opacity-30 transition-colors"><Icon name="ChevronLeft" size={16} /></button>
                            <span className="text-[10px] font-black uppercase tracking-widest min-w-[80px] text-center">{new Date(activeWeek.start_date.replace(/-/g, '/')).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                            <button onClick={() => setActiveWeekIndex(Math.max(0, activeWeekIndex - 1))} disabled={activeWeekIndex <= 0} className="p-2 hover:bg-base-300 rounded-md disabled:opacity-30 transition-colors"><Icon name="ChevronRight" size={16} /></button>
                        </div>
                    )}
                </div>
                {activeWeek && (
                    <div className="text-right hidden md:block">
                        <div className="text-2xl font-black text-base-content">${paidTotal}</div>
                        <div className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Paid of ${weekTotal}</div>
                    </div>
                )}
            </header>

            {activeWeek ? (
                <div className="bg-base-200 rounded-[2rem] p-8 border border-base-300 shadow-sm space-y-2">
                    {weekItems.map(item => (
                        <div key={item.id} className="flex items-center gap-4 group">
                            <button onClick={() => togglePaid(item)} className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${item.is_paid ? 'bg-primary border-primary text-primary-content' : 'border-base-content/20 hover:border-primary'}`}>
                                {item.is_paid && <Icon name="Check" size={14} />}
                            </button>
                            <div className={`flex-1 font-bold text-lg flex justify-between items-baseline ${item.is_paid ? 'text-base-content/30 line-through' : 'text-base-content'}`}>
                                <span>{item.title}</span>
                                <span className="font-mono">${item.amount}</span>
                            </div>
                            <button onClick={() => deleteItem(item.id)} className="text-slate-600 hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity p-2">
                                <Icon name="Trash2" size={16} />
                            </button>
                        </div>
                    ))}
                    <form onSubmit={(e) => { e.preventDefault(); addItem(); }} className="flex items-center gap-4 pt-4 mt-4 border-t-2 border-dashed border-base-content/5">
                        <Icon name="Plus" size={16} className="text-base-content/30" />
                        <input placeholder="New Item..." className="flex-1 bg-transparent font-bold text-lg outline-none placeholder:text-base-content/30 text-base-content" value={newItem.title} onChange={e => setNewItem({...newItem, title: e.target.value})} />
                        <div className="flex items-center w-24">
                            <span className="text-base-content/30 font-bold mr-1">$</span>
                            <input type="number" placeholder="0" className="w-full bg-transparent font-mono font-bold text-lg outline-none placeholder:text-base-content/30 text-right text-base-content" value={newItem.amount} onChange={e => setNewItem({...newItem, amount: e.target.value})} />
                        </div>
                        <button aria-label="Add Ledger Item" type="submit" className="p-2 hover:bg-primary/10 text-primary rounded-lg transition-colors">
                            <Icon name="PlusCircle" size={20} />
                        </button>
                    </form>
                </div>
            ) : (
                <div className="p-12 text-center text-base-content/40 font-bold border-2 border-dashed border-base-content/10 rounded-3xl">No active ledger found.</div>
            )}

            {activeWeekIndex === 0 && (
                <div className="flex justify-center">
                    <button disabled={loading} onClick={createNextWeek} className="flex items-center gap-2 text-primary font-black text-xs uppercase tracking-widest hover:bg-primary/5 px-8 py-4 rounded-2xl transition-colors disabled:opacity-50 border-2 border-primary/20">
                        <Icon name="Plus" size={16} /> {weeks.length > 0 ? "Generate Next Week" : "Start First Week"}
                    </button>
                </div>
            )}
        </PageContainer>
    );
};

export default MoneyLedger;
