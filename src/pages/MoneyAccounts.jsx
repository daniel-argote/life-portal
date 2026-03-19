import { useState, useEffect, useCallback, useRef } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { supabase } from '../lib/supabaseClient';
import Icon from '../components/Icon';
import PageContainer from '../components/PageContainer';
import { calculateWeeklyRequirement } from '../lib/moneyUtils';
import { parseISO, startOfDay, getDay, subDays } from 'date-fns';

const MoneyAccounts = ({ user, notify, config }) => {
    const [accounts, setAccounts] = useState([]);
    const [filter, setFilter] = useState('all'); // 'all', 'liabilities', 'assets'
    const [newAccountName, setNewAccountName] = useState('');
    const [isShaking, setIsShaking] = useState(false);
    const accountInputRef = useRef(null);

    const fetchAccounts = useCallback(async () => {
        if (!user) return;
        const { data } = await supabase
            .from('money_accounts')
            .select('*')
            .is('deleted_at', null)
            .order('position', { ascending: true });
        setAccounts(data || []);
    }, [user]);

    useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

    const filteredAccounts = accounts.filter(a => {
        if (filter === 'liabilities') return ['credit', 'loan'].includes(a.account_type);
        if (filter === 'assets') return ['cash', 'savings', 'investment'].includes(a.account_type);
        return true;
    });

    const getTypeIcon = (account) => {
        if (account.custom_icon) return account.custom_icon;
        
        const type = account.account_type;
        if (type === 'credit') return 'CreditCard';
        if (type === 'loan') return 'Car';
        if (type === 'savings') return 'PiggyBank';
        if (type === 'investment') return 'TrendingUp';
        if (type === 'cash') return 'Wallet';
        return 'CircleDollarSign';
    };

    const LOAN_ICONS = ['Car', 'Bike', 'Home', 'Landmark', 'Key', 'Briefcase', 'GraduationCap'];
    const ASSET_ICONS = ['Wallet', 'PiggyBank', 'TrendingUp', 'Coins', 'Gem', 'Vault'];

    const cycleIcon = async (account) => {
        const icons = ['credit', 'loan'].includes(account.account_type) ? LOAN_ICONS : ASSET_ICONS;
        const currentIdx = icons.indexOf(getTypeIcon(account));
        const nextIcon = icons[(currentIdx + 1) % icons.length];
        await updateAccount(account.id, { custom_icon: nextIcon });
    };

    const getTypeColor = (type) => {
        if (['credit', 'loan'].includes(type)) return 'text-danger';
        if (['savings', 'investment'].includes(type)) return 'text-success';
        return 'text-primary';
    };

    // Helper to sanitize dollar inputs
    const parseCurrency = (val) => {
        if (typeof val === 'number') return val;
        const clean = String(val).replace(/[^0-9.]/g, '');
        return parseFloat(clean) || 0;
    };

    const addAccount = async (e) => {
        e.preventDefault();
        const name = newAccountName.trim();
        if (!name) {
            setIsShaking(true);
            setTimeout(() => setIsShaking(false), 500);
            accountInputRef.current?.focus();
            return;
        }
        const { error } = await supabase.from('money_accounts').insert([{ 
            name, 
            balance: 0, 
            user_id: user.id, 
            position: accounts.length, 
            payoff_mode: 'monthly', 
            payoff_weeks: 1,
            account_type: 'credit'
        }]);
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
            if (updates.statement_balance !== undefined) {
                // CASCADE UPDATE
                const { data: updatedAccount } = await supabase.from('money_accounts').select('*').eq('id', id).single();
                const { data: existingItems } = await supabase
                    .from('money_items')
                    .select(`id, amount, money_weeks!inner (start_date)`)
                    .eq('account_id', id)
                    .eq('is_paid', false);

                if (existingItems && existingItems.length > 0) {
                    for (const item of existingItems) {
                        const weekStart = parseISO(item.money_weeks.start_date);
                        const newAmount = calculateWeeklyRequirement(updatedAccount, weekStart, config?.financialWeekStart || 0);
                        await supabase.from('money_items').update({ amount: Math.ceil(newAmount) }).eq('id', item.id);
                    }
                }
            }
            fetchAccounts(); 
            notify('Account updated'); 
        } else {
            console.error(error);
            notify('Failed to update account', 'error');
            fetchAccounts();
        }
    };

    const deleteAccount = async (id) => {
        const { error } = await supabase.from('money_accounts').update({ deleted_at: new Date().toISOString() }).eq('id', id);
        if (!error) { 
            fetchAccounts(); 
            notify('Account deleted', 'success', () => undoDelete(id)); 
        } else {
            notify('Failed to delete account', 'error');
        }
    };

    const undoDelete = async (id) => {
        const { error } = await supabase.from('money_accounts').update({ deleted_at: null }).eq('id', id);
        if (!error) {
            fetchAccounts();
            notify('Account restored');
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
            {/* Filter Hub */}
            <div className="flex gap-4 mb-10 overflow-x-auto no-scrollbar pb-2">
                {[
                    { id: 'all', label: 'All Accounts', icon: 'LayoutGrid' },
                    { id: 'liabilities', label: 'Liabilities', icon: 'ArrowDownCircle' },
                    { id: 'assets', label: 'Assets', icon: 'ArrowUpCircle' }
                ].map(item => (
                    <button
                        key={item.id}
                        onClick={() => setFilter(item.id)}
                        className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 transition-all whitespace-nowrap shadow-sm border ${filter === item.id ? 'bg-primary text-primary-content border-primary' : 'bg-base-200 text-slate-500 border-base-300 hover:border-primary/30'}`}
                    >
                        <Icon name={item.icon} size={16} />
                        {item.label}
                    </button>
                ))}
            </div>

            <DragDropContext onDragEnd={handleOnDragEnd}>
                <Droppable droppableId="accounts" direction="horizontal">
                    {(provided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredAccounts.map((account, index) => {
                                // Align calculation strictly with the start of the CURRENT financial week
                                // this ensures stable math throughout the week.
                                const targetDay = config?.financialWeekStart || 0;
                                let weekStartFloor = startOfDay(new Date());
                                while (getDay(weekStartFloor) !== targetDay) {
                                    weekStartFloor = subDays(weekStartFloor, 1);
                                }

                                const weeklyReq = calculateWeeklyRequirement(account, weekStartFloor, targetDay);
                                const isLiability = ['credit', 'loan'].includes(account.account_type);

                                return (
                                    <Draggable key={account.id} draggableId={account.id} index={index}>
                                        {(provided, snapshot) => (
                                            <div {...provided.draggableProps} ref={provided.innerRef}>
                                                <div className={`bg-base-200 p-8 rounded-[2.5rem] border-2 transition-all relative group flex flex-col h-full
                                                    ${snapshot.isDragging ? 'border-primary shadow-2xl scale-[1.05] z-50 bg-base-100' : (isLiability && account.statement_balance > 0 ? 'border-primary/20 hover:border-primary/40' : 'border-base-300 hover:border-primary/30')}`}>
                                                    
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
                                                        <div className="flex justify-center mb-4">
                                                            <button 
                                                                onClick={() => cycleIcon(account)}
                                                                className={`p-3 bg-base-100 rounded-2xl shadow-inner transition-all active:scale-95 hover:bg-base-300 ${getTypeColor(account.account_type)}`}
                                                                title="Change Icon"
                                                            >
                                                                <Icon name={getTypeIcon(account)} size={24} />
                                                            </button>
                                                        </div>
                                                        <input 
                                                            className="bg-transparent text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2 text-center w-full outline-none focus:text-primary"
                                                            defaultValue={account.name}
                                                            onBlur={(e) => updateAccount(account.id, { name: e.target.value })}
                                                        />
                                                        <div className="flex items-center justify-center text-primary font-black text-4xl">
                                                            <span className="text-2xl mr-1 opacity-50">$</span>
                                                            <input 
                                                                type="number"
                                                                step="0.01"
                                                                className="bg-transparent w-full text-center outline-none"
                                                                defaultValue={account.statement_balance || 0}
                                                                onPointerDown={e => e.stopPropagation()}
                                                                onFocus={e => e.target.select()}
                                                                onBlur={(e) => {
                                                                    const val = parseCurrency(e.target.value);
                                                                    updateAccount(account.id, { 
                                                                        statement_balance: val,
                                                                        last_statement_amount: val 
                                                                    });
                                                                }}
                                                                onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
                                                            />
                                                        </div>
                                                        <p className="text-[8px] font-black text-indigo-500 uppercase tracking-tighter mt-1">
                                                            {isLiability ? `Statement Balance (Due Day ${account.due_day})` : 'Available Balance'}
                                                        </p>
                                                    </div>

                                                    <div className="mt-auto space-y-4 pt-6 border-t border-base-300/50">
                                                        <div className="grid grid-cols-2 gap-4 px-2">
                                                            <div className="space-y-1">
                                                                <label className="text-[7px] font-black uppercase text-slate-500 ml-1">Account Type</label>
                                                                <select 
                                                                    className="w-full bg-base-100 p-1.5 rounded-lg text-[10px] font-bold outline-none appearance-none text-center cursor-pointer border border-transparent focus:border-primary/30"
                                                                    value={account.account_type || 'credit'}
                                                                    onChange={(e) => updateAccount(account.id, { account_type: e.target.value, custom_icon: null })}
                                                                >
                                                                    <option value="credit">Credit Card</option>
                                                                    <option value="loan">Loan / Lease</option>
                                                                    <option value="cash">Cash / Checking</option>
                                                                    <option value="savings">Savings</option>
                                                                    <option value="investment">Investment</option>
                                                                    <option value="other">Other</option>
                                                                </select>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <label className="text-[7px] font-black uppercase text-slate-500 ml-1">Strategy</label>
                                                                <select 
                                                                    className="w-full bg-base-100 p-1.5 rounded-lg text-[10px] font-bold outline-none appearance-none text-center cursor-pointer border border-transparent focus:border-primary/30"
                                                                    value={account.payoff_mode || 'monthly'}
                                                                    onChange={(e) => updateAccount(account.id, { payoff_mode: e.target.value })}
                                                                >
                                                                    <option value="monthly">Monthly</option>
                                                                    <option value="fixed">Fixed Term</option>
                                                                    <option value="fixed_amount">Fixed Amount</option>
                                                                </select>
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-4 px-2">
                                                            <div className="space-y-1">
                                                                <label className="text-[7px] font-black uppercase text-slate-500 ml-1">
                                                                    {account.payoff_mode === 'fixed' ? 'Weeks' : account.payoff_mode === 'fixed_amount' ? 'Fixed Amt' : 'Due Day'}
                                                                </label>
                                                                <input 
                                                                    type="number"
                                                                    className="w-full bg-base-100 p-1.5 rounded-lg text-[10px] font-bold outline-none text-center border border-transparent focus:border-primary/30"
                                                                    defaultValue={account.payoff_mode === 'fixed' ? (account.payoff_weeks || '') : account.payoff_mode === 'fixed_amount' ? (account.fixed_amount || '') : (account.due_day || '')}
                                                                    onPointerDown={e => e.stopPropagation()}
                                                                    onFocus={e => e.target.select()}
                                                                    onBlur={(e) => {
                                                                        const val = parseCurrency(e.target.value);
                                                                        const field = account.payoff_mode === 'fixed' ? 'payoff_weeks' : account.payoff_mode === 'fixed_amount' ? 'fixed_amount' : 'due_day';
                                                                        updateAccount(account.id, { [field]: val });
                                                                    }}
                                                                />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <label className="text-[7px] font-black uppercase text-slate-500 ml-1">Current Balance</label>
                                                                <div className="relative">
                                                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[8px] text-slate-400">$</span>
                                                                    <input 
                                                                        type="number"
                                                                        step="0.01"
                                                                        className="w-full bg-base-100 p-1.5 pl-4 rounded-lg text-[10px] font-bold outline-none text-center border border-transparent focus:border-primary/30"
                                                                        defaultValue={account.balance || 0}
                                                                        onPointerDown={e => e.stopPropagation()}
                                                                        onFocus={e => e.target.select()}
                                                                        onBlur={(e) => updateAccount(account.id, { balance: parseCurrency(e.target.value) })}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {isLiability && weeklyReq > 0 && (
                                                            <div className="bg-primary/5 border border-primary/10 p-4 rounded-2xl text-center animate-in fade-in zoom-in-95 duration-300">
                                                                <p className="text-[8px] font-black uppercase text-primary tracking-widest mb-1">Weekly Requirement</p>
                                                                <div className="text-xl font-black text-primary">${Number(weeklyReq).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
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
                            <form onSubmit={addAccount} className={`bg-base-200/50 p-8 rounded-[2.5rem] border-2 border-dashed border-base-300 flex flex-col justify-center items-center gap-4 hover:border-primary/50 transition-colors group min-h-[350px] ${isShaking ? 'animate-shake' : ''}`}>
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
