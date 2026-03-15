import { useState, useEffect, useCallback, useRef } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { supabase } from '../lib/supabaseClient';
import Icon from '../components/Icon';

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
        const { error } = await supabase.from('money_accounts').insert([{ name, balance: 0, user_id: user.id, position: accounts.length }]);
        if (!error) { setNewAccountName(''); fetchAccounts(); notify('Account added'); }
    };

    const updateBalance = async (id, newBalance) => {
        const { error } = await supabase.from('money_accounts').update({ balance: newBalance }).eq('id', id);
        if (!error) { fetchAccounts(); notify('Balance updated'); }
    };

    const deleteAccount = async (id) => {
        const { error } = await supabase.from('money_accounts').delete().eq('id', id);
        if (!error) { fetchAccounts(); notify('Account deleted'); }
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
        <div className="space-y-8 pb-20">
            <header className="flex justify-between items-end">
                <h3 className="text-xl font-black tracking-tighter text-base-content">Manage Accounts</h3>
            </header>
            
            <DragDropContext onDragEnd={handleOnDragEnd}>
                <Droppable droppableId="accounts" direction="horizontal">
                    {(provided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {accounts.map((account, index) => (
                                <Draggable key={account.id} draggableId={account.id} index={index}>
                                    {(provided, snapshot) => (
                                        <div {...provided.draggableProps} ref={provided.innerRef}>
                                            <div className={`bg-base-200 p-6 rounded-3xl border-2 transition-all relative group
                                                ${snapshot.isDragging ? 'border-primary shadow-2xl scale-[1.05] z-50 bg-base-100' : 'border-base-300 hover:border-primary/30'}`}>
                                                
                                                <div {...provided.dragHandleProps} className="absolute top-4 right-4 p-1.5 hover:bg-base-300 rounded-lg cursor-grab active:cursor-grabbing text-slate-500 transition-colors">
                                                    <Icon name="GripVertical" size={16} />
                                                </div>

                                                <button 
                                                    onClick={() => deleteAccount(account.id)} 
                                                    className="absolute top-4 left-4 text-base-content/20 hover:text-danger opacity-0 group-hover:opacity-100 transition-all p-1"
                                                >
                                                    <Icon name="X" size={14} />
                                                </button>

                                                <div className="mt-2 text-center">
                                                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">{account.name}</p>
                                                    <div className="flex items-center justify-center text-primary font-black text-2xl">
                                                        <span className="text-lg mr-1 opacity-50">$</span>
                                                        <input 
                                                            className="bg-transparent w-24 text-center outline-none"
                                                            defaultValue={account.balance}
                                                            onBlur={(e) => updateBalance(account.id, e.target.value)}
                                                            onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                            <form onSubmit={addAccount} className={`bg-base-200/50 p-6 rounded-3xl border-2 border-dashed border-base-300 flex flex-col justify-center items-center gap-3 hover:border-primary/50 transition-colors group ${isShaking ? 'animate-shake' : ''}`}>
                                <button type="submit" className="w-10 h-10 rounded-full bg-base-300 flex items-center justify-center text-slate-600 group-hover:bg-primary group-hover:text-primary-content transition-all shadow-sm">
                                    <Icon name="Plus" size={20} />
                                </button>
                                <input 
                                    ref={accountInputRef}
                                    value={newAccountName}
                                    onChange={e => setNewAccountName(e.target.value)}
                                    placeholder="Add Account"
                                    className="bg-transparent text-center text-xs font-black uppercase tracking-widest w-full outline-none placeholder:text-slate-600"
                                />
                            </form>
                        </div>
                    )}
                </Droppable>
            </DragDropContext>
        </div>
    );
};

export default MoneyAccounts;
