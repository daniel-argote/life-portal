import { useState, useEffect, useCallback, useRef } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { supabase } from '../lib/supabaseClient';
import Icon from '../components/Icon';
import PageContainer from '../components/PageContainer';
import { calculateWeeklyRequirement } from '../lib/moneyUtils';

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
        const { error } = await supabase.from('money_accounts').update(updates).eq('id', id);
        if (!error) { 
            fetchAccounts(); 
            notify('Account updated'); 
        } else {
            console.error(error);
            notify('Failed to update account', 'error');
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
                                                                defaultValue={account.balance}
                                                                onBlur={(e) => updateAccount(account.id, { balance: parseFloat(e.target.value) || 0 })}
                                                                onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
                                                            />
                                                        </div>
                                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter mt-1">Current Balance</p>
                                                    </div>

                                                    <div className="mt-auto space-y-4 pt-6 border-t border-base-300/50">
                                                        <div className="flex gap-2 mb-2">
                                                            <button 
                                                                onClick={() => updateAccount(account.id, { payoff_mode: 'monthly' })}
                                                                className={`flex-1 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${account.payoff_mode === 'monthly' ? 'bg-primary text-primary-content shadow-sm' : 'bg-base-300 text-slate-500'}`}
                                                            >
                                                                Monthly
                                                            </button>
                                                            <button 
                                                                onClick={() => updateAccount(account.id, { payoff_mode: 'fixed' })}
                                                                className={`flex-1 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${account.payoff_mode === 'fixed' ? 'bg-indigo-500 text-white shadow-sm' : 'bg-base-300 text-slate-500'}`}
                                                            >
                                                                Fixed Term
                                                            </button>
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div className="space-y-1">
                                                                <label className="text-[8px] font-black uppercase text-slate-500 ml-1">
                                                                    {account.payoff_mode === 'fixed' ? 'Total Weeks' : 'Due Day'}
                                                                </label>
                                                                <input 
                                                                    type="number"
                                                                    placeholder={account.payoff_mode === 'fixed' ? 'Weeks' : 'DD'}
                                                                    className="w-full bg-base-100 p-2 rounded-xl text-center font-bold text-xs outline-none border-2 border-transparent focus:border-indigo-500/30"
                                                                    defaultValue={account.payoff_mode === 'fixed' ? (account.payoff_weeks || '') : (account.due_day || '')}
                                                                    onBlur={(e) => {
                                                                        const val = parseInt(e.target.value) || null;
                                                                        const update = account.payoff_mode === 'fixed' ? { payoff_weeks: val } : { due_day: val };
                                                                        updateAccount(account.id, update);
                                                                    }}
                                                                />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <label className="text-[8px] font-black uppercase text-slate-500 ml-1">Statement</label>
                                                                <div className="relative">
                                                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">$</span>
                                                                    <input 
                                                                        type="number"
                                                                        placeholder="0.00"
                                                                        className="w-full bg-base-100 p-2 pl-4 rounded-xl text-center font-bold text-xs outline-none border-2 border-transparent focus:border-indigo-500/30"
                                                                        defaultValue={account.statement_balance || ''}
                                                                        onBlur={(e) => updateAccount(account.id, { statement_balance: parseFloat(e.target.value) || 0 })}
                                                                    />
                                                                </div>
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
