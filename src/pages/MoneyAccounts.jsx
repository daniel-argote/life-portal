import { useState, useEffect, useCallback, useRef } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { supabase } from '../lib/supabaseClient';
import Icon from '../components/Icon';
import PageContainer from '../components/PageContainer';
import { calculateWeeklyRequirement, getCycleRange } from '../lib/moneyUtils';
import { format, startOfDay, parseISO, subDays } from 'date-fns';

const MoneyAccounts = ({ user, notify }) => {
    const [accounts, setAccounts] = useState([]);
    const [newAccountName, setNewAccountName] = useState('');
    const [isShaking, setIsShaking] = useState(false);
    const accountInputRef = useRef(null);

    const fetchAccounts = useCallback(async () => {
        if (!user) return;
        const { data } = await supabase.from('money_accounts').select('*').order('position', { ascending: true });
        setAccounts(data || []);
    }, [user]);

    useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

    const addAccount = async (e) => {
        e.preventDefault();
        const name = newAccountName.trim();
        if (!name) {
            setIsShaking(true);
            setTimeout(() => setIsShaking(false), 500);
            accountInputRef.current?.focus();
            return;
        }
        const { error } = await supabase.from('money_accounts').insert([{ name, balance: 0, user_id: user.id, position: accounts.length, payoff_mode: 'monthly', payoff_weeks: 1 }]);
        if (!error) { 
            setNewAccountName(''); 
            fetchAccounts(); 
            notify('Account added'); 
        } else {
            console.error(error);
            notify('Failed to add account', 'error');
        }
    };

    const updateAccount = async (id, updates) => {
        // Optimistic UI update for immediate feedback
        setAccounts(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));

        const { error } = await supabase.from('money_accounts').update(updates).eq('id', id);
        if (!error) { 
            // CASCADE UPDATE: If statement_balance was updated, sync ALL unpaid ledger items for this account
            if (updates.statement_balance !== undefined) {
                console.log(`[Cascade] Starting update for account ${id} to $${updates.statement_balance}`);
                
                // Fetch the fully updated account for accurate context
                const { data: updatedAccount } = await supabase.from('money_accounts').select('*').eq('id', id).single();
                
                const { data: existingItems, error: itemsError } = await supabase
                    .from('money_items')
                    .select(`
                        id, 
                        amount,
                        money_weeks!inner (
                            start_date
                        )
                    `)
                    .eq('account_id', id)
                    .eq('is_paid', false);

                if (itemsError) console.error('[Cascade] Error fetching items:', itemsError);

                if (existingItems && existingItems.length > 0) {
                    console.log(`[Cascade] Found ${existingItems.length} unpaid items to potentially update.`);
                    for (const item of existingItems) {
                        const weekStart = parseISO(item.money_weeks.start_date);
                        const newAmount = calculateWeeklyRequirement(updatedAccount, weekStart);
                        
                        console.log(`[Cascade] Item ${item.id} (Week ${item.money_weeks.start_date}): $${item.amount} -> $${Math.ceil(newAmount)}`);
                        
                        const { error: upError } = await supabase.from('money_items').update({ amount: Math.ceil(newAmount) }).eq('id', item.id);
                        if (upError) console.error(`[Cascade] Failed to update item ${item.id}:`, upError);
                    }
                } else {
                    console.log('[Cascade] No unpaid ledger items found for this account.');
                }
            }

            fetchAccounts(); 
            notify('Account updated'); 
        } else {
            console.error(error);
            notify('Failed to update account', 'error');
            fetchAccounts(); // Rollback on error
        }
    };

    const deleteAccount = async (id) => {
        const { error } = await supabase.from('money_accounts').delete().eq('id', id);
        if (!error) { 
            fetchAccounts(); 
            notify('Account deleted'); 
        } else {
            console.error(error);
            notify('Failed to delete account', 'error');
        }
    };

    const handleOnDragEnd = async (result) => {
        if (!result.destination) return;
        const items = Array.from(accounts);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);
        setAccounts(items);
        const updates = items.map((item, index) => supabase.from('money_accounts').update({ position: index }).eq('id', item.id));
        await Promise.all(updates);
        fetchAccounts();
    };

    return (
        <PageContainer>
            <DragDropContext onDragEnd={handleOnDragEnd}>
                <Droppable droppableId="accounts" direction="horizontal">
                    {(provided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {accounts.map((account, index) => {
                                const weeklyReq = calculateWeeklyRequirement(account);
                                const isLiability = account.statement_balance > 0 && (account.due_day || account.payoff_mode === 'fixed');

                                return (
                                    <Draggable key={account.id} draggableId={account.id} index={index}>
                                        {(provided, snapshot) => (
                                            <div {...provided.draggableProps} ref={provided.innerRef}>
                                                <div className={`bg-base-200 p-8 rounded-[2.5rem] border-2 transition-all relative group flex flex-col h-full
                                                    ${snapshot.isDragging ? 'border-primary shadow-2xl scale-[1.05] z-50 bg-base-100' : (isLiability ? 'border-indigo-500/20 hover:border-indigo-500/40' : 'border-base-300 hover:border-primary/30')}`}>
                                                    
                                                    <div {...provided.dragHandleProps} className="absolute top-6 right-6 p-1.5 hover:bg-base-300 rounded-lg cursor-grab active:cursor-grabbing text-slate-500 transition-colors">
                                                        <Icon name="GripVertical" size={16} />
                                                    </div>

                                                    <button 
                                                        onClick={() => deleteAccount(account.id)} 
                                                        className="absolute top-6 left-6 text-base-content/20 hover:text-danger opacity-0 group-hover:opacity-100 transition-all p-1"
                                                    >
                                                        <Icon name="X" size={14} />
                                                    </button>

                                                    <div className="text-center mb-6">
                                                        <input 
                                                            className="bg-transparent text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2 text-center w-full outline-none focus:text-primary"
                                                            defaultValue={account.name}
                                                            onBlur={(e) => updateAccount(account.id, { name: e.target.value })}
                                                        />
                                                        <div className="flex items-center justify-center text-primary font-black text-4xl">
                                                            <span className="text-2xl mr-1 opacity-50">$</span>
                                                            <input 
                                                                className="bg-transparent w-full text-center outline-none"
                                                                defaultValue={account.statement_balance || 0}
                                                                onPointerDown={e => e.stopPropagation()}
                                                                onFocus={e => e.target.select()}
                                                                onBlur={(e) => {
                                                                    const val = parseFloat(e.target.value) || 0;
                                                                    updateAccount(account.id, { 
                                                                        statement_balance: val,
                                                                        last_statement_amount: val // Sync historical goal
                                                                    });
                                                                }}
                                                                onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
                                                            />
                                                        </div>
                                                        <p className="text-[8px] font-black text-indigo-500 uppercase tracking-tighter mt-1">Statement Balance (Due Day {account.due_day})</p>
                                                    </div>

                                                    <div className="mt-auto space-y-4 pt-6 border-t border-base-300/50">
                                                        <div className="flex items-center justify-between px-4">
                                                            <span className="text-[8px] font-black uppercase text-slate-400">Current Balance (Optional)</span>
                                                            <div className="flex items-center text-slate-500 font-bold text-xs">
                                                                <span className="mr-0.5">$</span>
                                                                <input 
                                                                    className="bg-transparent w-16 text-right outline-none"
                                                                    defaultValue={account.balance || 0}
                                                                    onPointerDown={e => e.stopPropagation()}
                                                                    onFocus={e => e.target.select()}
                                                                    onBlur={(e) => updateAccount(account.id, { balance: parseFloat(e.target.value) || 0 })}
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-4 px-2">
                                                            <div className="space-y-1">
                                                                <label className="text-[7px] font-black uppercase text-slate-500 ml-1">Strategy</label>
                                                                <select 
                                                                    className="w-full bg-base-100 p-1.5 rounded-lg text-[10px] font-bold outline-none appearance-none text-center cursor-pointer border border-transparent focus:border-indigo-500/30"
                                                                    value={account.payoff_mode || 'monthly'}
                                                                    onChange={(e) => updateAccount(account.id, { payoff_mode: e.target.value })}
                                                                >
                                                                    <option value="monthly">Monthly</option>
                                                                    <option value="fixed">Fixed</option>
                                                                </select>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <label className="text-[7px] font-black uppercase text-slate-500 ml-1">
                                                                    {account.payoff_mode === 'fixed' ? 'Weeks' : 'Due Day'}
                                                                </label>
                                                                <input 
                                                                    type="number"
                                                                    className="w-full bg-base-100 p-1.5 rounded-lg text-[10px] font-bold outline-none text-center border border-transparent focus:border-indigo-500/30"
                                                                    defaultValue={account.payoff_mode === 'fixed' ? (account.payoff_weeks || '') : (account.due_day || '')}
                                                                    onBlur={(e) => {
                                                                        const val = parseInt(e.target.value) || null;
                                                                        const update = account.payoff_mode === 'fixed' ? { payoff_weeks: val } : { due_day: val };
                                                                        updateAccount(account.id, update);
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>

                                                        {isLiability && (
                                                            <div className="bg-indigo-500/5 border border-indigo-500/10 p-4 rounded-2xl text-center animate-in fade-in zoom-in-95 duration-300">
                                                                <p className="text-[8px] font-black uppercase text-indigo-500 tracking-widest mb-1">Weekly Requirement</p>
                                                                <div className="text-xl font-black text-indigo-600">${Number(weeklyReq).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </Draggable>
                                );
                            })}
                            {provided.placeholder}
                            <form onSubmit={addAccount} className={`bg-base-200/50 p-8 rounded-[2.5rem] border-2 border-dashed border-base-300 flex flex-col justify-center items-center gap-4 hover:border-primary/50 transition-colors group min-h-[300px] ${isShaking ? 'animate-shake' : ''}`}>
                                <button type="submit" className="w-14 h-14 rounded-full bg-base-300 flex items-center justify-center text-slate-600 group-hover:bg-primary group-hover:text-primary-content transition-all shadow-md">
                                    <Icon name="Plus" size={28} />
                                </button>
                                <input 
                                    ref={accountInputRef}
                                    value={newAccountName}
                                    onChange={e => setNewAccountName(e.target.value)}
                                    placeholder="Add New Account"
                                    className="bg-transparent text-center text-sm font-black uppercase tracking-widest w-full outline-none placeholder:text-slate-400"
                                />
                            </form>
                        </div>
                    )}
                </Droppable>
            </DragDropContext>
        </PageContainer>
    );
};

export default MoneyAccounts;
