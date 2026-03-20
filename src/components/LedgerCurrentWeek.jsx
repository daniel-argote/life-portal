import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import Icon from './Icon';
import { format, parseISO } from 'date-fns';

const LedgerCurrentWeek = ({ user, notify, config, setTab, fetchData }) => {
    const [week, setWeek] = useState(null);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newItem, setNewItem] = useState({ title: '', amount: '' });

    const fetchLatestWeek = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const { data: weeks, error: weekError } = await supabase
                .from('money_weeks')
                .select('*')
                .order('start_date', { ascending: false })
                .limit(1);

            if (weekError) throw weekError;

            if (weeks && weeks.length > 0) {
                const latestWeek = weeks[0];
                setWeek(latestWeek);

                const { data: weekItems, error: itemsError } = await supabase
                    .from('money_items')
                    .select('*')
                    .eq('week_id', latestWeek.id)
                    .order('position', { ascending: true })
                    .order('created_at', { ascending: true });

                if (itemsError) throw itemsError;
                setItems(weekItems || []);
            } else {
                setWeek(null);
                setItems([]);
            }
        } catch (error) {
            console.error('Error fetching ledger:', error);
            notify('Failed to load ledger', 'error');
        } finally {
            setLoading(false);
        }
    }, [user, notify]);

    useEffect(() => {
        fetchLatestWeek();
    }, [fetchLatestWeek]);

    const togglePaid = async (item) => {
        const newPaidStatus = !item.is_paid;
        const { error } = await supabase.from('money_items').update({ is_paid: newPaidStatus }).eq('id', item.id);
        
        if (!error) {
            // Update the statement balance in real-time (Logic copied from MoneyLedger.jsx)
            if (item.account_id) {
                const { data: account } = await supabase.from('money_accounts').select('*').eq('id', item.account_id).single();
                if (account) {
                    const isAsset = ['cash', 'savings', 'investment'].includes(account.account_type);
                    if (isAsset) {
                        const adjustment = newPaidStatus ? Number(item.amount) : -Number(item.amount);
                        const newBalance = Number(account.balance) + adjustment;
                        await supabase.from('money_accounts').update({ balance: newBalance }).eq('id', item.account_id);
                    } else {
                        const adjustment = newPaidStatus ? -Number(item.amount) : Number(item.amount);
                        const newBalance = Math.max(0, Number(account.statement_balance) + adjustment);
                        await supabase.from('money_accounts').update({ statement_balance: newBalance }).eq('id', item.account_id);
                    }
                }
            }
            fetchLatestWeek();
            if (fetchData) fetchData();
        } else {
            notify('Update failed', 'error');
        }
    };

    const deleteItem = async (id) => {
        const { data: item } = await supabase.from('money_items').select('*').eq('id', id).single();
        const { error } = await supabase.from('money_items').delete().eq('id', id);
        if (error) {
            notify(error, 'error');
        } else {
            if (item && item.account_id && item.is_paid) {
                const { data: account } = await supabase.from('money_accounts').select('*').eq('id', item.account_id).single();
                if (account) {
                    const isAsset = ['cash', 'savings', 'investment'].includes(account.account_type);
                    if (isAsset) {
                        const newBalance = Number(account.balance) - Number(item.amount);
                        await supabase.from('money_accounts').update({ balance: newBalance }).eq('id', item.account_id);
                    } else {
                        const newBalance = Number(account.statement_balance) + Number(item.amount);
                        await supabase.from('money_accounts').update({ statement_balance: newBalance }).eq('id', item.account_id);
                    }
                }
            }
            fetchLatestWeek();
            if (fetchData) fetchData();
            notify('Item removed');
        }
    };

    const addItem = async (e) => {
        e.preventDefault();
        if (!week || !newItem.title || !newItem.amount) return;
        
        const amount = parseFloat(String(newItem.amount).replace(/[^0-9.]/g, '')) || 0;
        
        const { error } = await supabase.from('money_items').insert([{ 
            week_id: week.id, 
            user_id: user.id, 
            title: newItem.title, 
            amount: amount, 
            is_paid: false 
        }]);
        
        if (error) {
            notify(error, 'error');
        } else {
            setNewItem({ title: '', amount: '' }); 
            fetchLatestWeek(); 
            notify('Item added'); 
        }
    };

    if (loading && !week) return null;
    if (!week) return null;

    const weekTotal = items.reduce((acc, item) => acc + Number(item.amount), 0);
    const paidTotal = items.filter(i => i.is_paid).reduce((acc, item) => acc + Number(item.amount), 0);

    return (
        <div className="bg-base-200 p-8 rounded-[2.5rem] border border-base-300 shadow-sm transition-all hover:border-primary/20">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/10 text-primary rounded-2xl">
                        <Icon name="BookText" size={24} />
                    </div>
                    <div>
                        <h3 className="font-black text-lg leading-tight">Current Week</h3>
                        <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                            Starting {new Date(week.start_date.replace(/-/g, '/')).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <div className="text-right hidden sm:block">
                        <div className="text-xl font-black text-base-content">${paidTotal.toLocaleString()}</div>
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            of ${weekTotal.toLocaleString()} Paid
                        </div>
                    </div>
                    {setTab && (
                        <button 
                            onClick={() => setTab('money_ledger')}
                            className="p-3 hover:bg-primary/10 text-primary rounded-2xl transition-all"
                            title="Go to Full Ledger"
                        >
                            <Icon name="ExternalLink" size={20} />
                        </button>
                    )}
                </div>
            </div>

            <div className="space-y-2">
                {items.length > 0 ? (
                    items.map(item => (
                        <div key={item.id} className="flex items-center gap-4 group">
                            <button 
                                onClick={() => togglePaid(item)} 
                                className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${item.is_paid ? 'bg-primary border-primary text-primary-content' : 'border-base-content/20 hover:border-primary'}`}
                            >
                                {item.is_paid && <Icon name="Check" size={12} />}
                            </button>
                            <div className={`flex-1 font-bold text-base flex justify-between items-baseline ${item.is_paid ? 'text-base-content/30 line-through' : 'text-base-content'}`}>
                                <div className="flex items-center gap-2">
                                    <span className="truncate max-w-[150px] md:max-w-none">{item.title}</span>
                                    {item.account_id && <Icon name="Link" size={8} className="text-primary opacity-50" />}
                                </div>
                                <span className="font-mono text-sm">${item.amount}</span>
                            </div>
                            <button 
                                onClick={() => deleteItem(item.id)} 
                                className="text-slate-600 hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity p-1"
                            >
                                <Icon name="Trash2" size={14} />
                            </button>
                        </div>
                    ))
                ) : (
                    <p className="text-slate-500 font-bold text-sm italic py-4 text-center">No items in this week's ledger</p>
                )}
                
                <form onSubmit={addItem} className="flex items-center gap-3 pt-4 mt-2 border-t border-dashed border-base-content/5">
                    <input 
                        placeholder="Quick add..." 
                        className="flex-1 bg-transparent font-bold text-sm outline-none placeholder:text-base-content/20 text-base-content" 
                        value={newItem.title} 
                        onChange={e => setNewItem({...newItem, title: e.target.value})} 
                    />
                    <div className="flex items-center w-20">
                        <span className="text-base-content/20 font-bold mr-1">$</span>
                        <input 
                            type="number" 
                            placeholder="0" 
                            className="w-full bg-transparent font-mono font-bold text-sm outline-none placeholder:text-base-content/20 text-right text-base-content no-spinner" 
                            value={newItem.amount} 
                            onChange={e => setNewItem({...newItem, amount: e.target.value})} 
                        />
                    </div>
                    <button type="submit" className="text-primary/40 hover:text-primary transition-colors">
                        <Icon name="PlusCircle" size={18} />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LedgerCurrentWeek;
