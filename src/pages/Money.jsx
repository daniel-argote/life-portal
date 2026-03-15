import { useState, useEffect, useCallback, useRef } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { supabase } from '../lib/supabaseClient';
import Icon from '../components/Icon';
import EditableHeader from '../components/EditableHeader';
import { format, addDays, parseISO, getDay, subDays, startOfDay } from 'date-fns';

const Money = ({ user, notify, pageName, setPageName, showHeaders, config }) => {
    const [activeTab, setActiveTab] = useState('ledger');
    const [loading, setLoading] = useState(false);

    // Data State
    const [accounts, setAccounts] = useState([]);
    const [weeks, setWeeks] = useState([]);
    const [weekItems, setWeekItems] = useState([]);
    const [bills, setBills] = useState([]);
    const [activeWeekIndex, setActiveWeekIndex] = useState(0);
    const activeWeek = weeks[activeWeekIndex] || null;

    // --- Data Fetching ---

    const fetchAllData = useCallback(async () => {
        if (!user) return;
        
        // Accounts
        const { data: accs } = await supabase.from('money_accounts').select('*').order('position', { ascending: true });
        setAccounts(accs || []);

        // Weeks
        const { data: wks } = await supabase.from('money_weeks').select('*').order('start_date', { ascending: false });
        setWeeks(wks || []);

        // Bills
        const { data: bls } = await supabase.from('money_bills').select('*').order('due_date', { ascending: true });
        setBills(bls || []);
    }, [user]);

    const fetchWeekItems = useCallback(async () => {
        if (!activeWeek) {
            setWeekItems([]);
            return;
        }
        const { data, error } = await supabase.from('money_items').select('*').eq('week_id', activeWeek.id).order('created_at', { ascending: true });
        if (!error) setWeekItems(data || []);
    }, [activeWeek]);

    useEffect(() => { fetchAllData(); }, [fetchAllData]);
    useEffect(() => { fetchWeekItems(); }, [fetchWeekItems]);

    // --- Components ---

    const NetWorthWidget = () => {
        const totalValue = accounts.reduce((acc, curr) => acc + Number(curr.balance || 0), 0);
        const paidBills = bills.filter(b => b.is_paid).length;
        const totalBills = bills.length;

        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
                <div className="bg-base-200 p-6 rounded-3xl border border-base-300 flex flex-col items-center justify-center text-center transition-all hover:border-primary/30">
                    <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-2">Liquid Assets</p>
                    <div className="text-3xl font-black text-primary">${totalValue.toLocaleString()}</div>
                </div>

                <div className="bg-base-200 p-6 rounded-3xl border border-base-300 flex flex-col items-center justify-center text-center transition-all hover:border-success/30">
                    <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-2">Bills Paid</p>
                    <div className="text-3xl font-black text-success">{paidBills}/{totalBills}</div>
                </div>

                <div className="bg-base-200 p-6 rounded-3xl border border-base-300 flex flex-col items-center justify-center text-center transition-all hover:border-indigo-500/30">
                    <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-2">Net Position</p>
                    <div className="text-3xl font-black text-indigo-500">Stable</div>
                </div>
            </div>
        );
    };

    const AccountsTab = () => {
        const [newAccountName, setNewAccountName] = useState('');
        const [isShaking, setIsShaking] = useState(false);
        const accountInputRef = useRef(null);

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
            if (!error) { setNewAccountName(''); fetchAllData(); notify('Account added'); }
        };

        const updateBalance = async (id, newBalance) => {
            const { error } = await supabase.from('money_accounts').update({ balance: newBalance }).eq('id', id);
            if (!error) { fetchAllData(); notify('Balance updated'); }
        };

        const deleteAccount = async (id) => {
            const { error } = await supabase.from('money_accounts').delete().eq('id', id);
            if (!error) { fetchAllData(); notify('Account deleted'); }
        };

        const handleOnDragEnd = async (result) => {
            if (!result.destination) return;
            const items = Array.from(accounts);
            const [reorderedItem] = items.splice(result.source.index, 1);
            items.splice(result.destination.index, 0, reorderedItem);
            setAccounts(items);
            const updates = items.map((item, index) => supabase.from('money_accounts').update({ position: index }).eq('id', item.id));
            await Promise.all(updates);
            fetchAllData();
        };

        return (
            <section className="space-y-6">
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
            </section>
        );
    };

    const LedgerTab = () => {
        const [newItem, setNewItem] = useState({ title: '', amount: '' });

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
                        const newItems = itemsToCopy.map(({ id, created_at, week_id, is_paid, ...rest }) => ({ ...rest, week_id: newWeekData[0].id, user_id: user.id, is_paid: false }));
                        await supabase.from('money_items').insert(newItems);
                    }
                }
                await fetchAllData();
                setActiveWeekIndex(0);
                notify(`New week starting ${format(parseISO(startDate), 'EEEE, MMM do')}`);
            }
            setLoading(false);
        };

        const addItem = async (e) => {
            e.preventDefault();
            if (!activeWeek || !newItem.title || !newItem.amount) return;
            const { error } = await supabase.from('money_items').insert([{ week_id: activeWeek.id, user_id: user.id, title: newItem.title, amount: newItem.amount, is_paid: false }]);
            if (!error) { setNewItem({ title: '', amount: '' }); fetchWeekItems(); notify('Item added'); }
        };

        const togglePaid = async (item) => {
            const { error } = await supabase.from('money_items').update({ is_paid: !item.is_paid }).eq('id', item.id);
            if (!error) fetchWeekItems();
        };

        const deleteItem = async (id) => {
            const { error } = await supabase.from('money_items').delete().eq('id', id);
            if (!error) { fetchWeekItems(); notify('Item removed'); }
        };

        const weekTotal = weekItems.reduce((acc, item) => acc + Number(item.amount), 0);
        const paidTotal = weekItems.filter(i => i.is_paid).reduce((acc, item) => acc + Number(item.amount), 0);

        return (
            <section className="space-y-6">
                <header className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <h3 className="text-xl font-black tracking-tighter text-base-content">Weekly Ledger</h3>
                        {activeWeek && (
                            <div className="flex items-center gap-2 bg-base-200 rounded-lg p-1">
                                <button onClick={() => setActiveWeekIndex(Math.min(weeks.length - 1, activeWeekIndex + 1))} disabled={activeWeekIndex >= weeks.length - 1} className="p-2 hover:bg-base-300 rounded-md disabled:opacity-30 transition-colors"><Icon name="ChevronLeft" size={16} /></button>
                                <span className="text-[10px] font-black uppercase tracking-widest min-w-[80px] text-center">{new Date(activeWeek.start_date.replace(/-/g, '\/')).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
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
                        <form onSubmit={addItem} className="flex items-center gap-4 pt-4 mt-4 border-t-2 border-dashed border-base-content/5">
                            <Icon name="Plus" size={16} className="text-base-content/30" />
                            <input placeholder="New Item..." className="flex-1 bg-transparent font-bold text-lg outline-none placeholder:text-base-content/30 text-base-content" value={newItem.title} onChange={e => setNewItem({...newItem, title: e.target.value})} />
                            <div className="flex items-center w-24">
                                <span className="text-base-content/30 font-bold mr-1">$</span>
                                <input type="number" placeholder="0" className="w-full bg-transparent font-mono font-bold text-lg outline-none placeholder:text-base-content/30 text-right text-base-content" value={newItem.amount} onChange={e => setNewItem({...newItem, amount: e.target.value})} />
                            </div>
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
            </section>
        );
    };

    const BillsTab = () => {
        const [form, setForm] = useState({ name: '', amount: '', due_date: format(new Date(), 'yyyy-MM-dd') });

        const handleAdd = async (e) => {
            e.preventDefault();
            if (!form.name || !form.amount) return;
            setLoading(true);
            const { error } = await supabase.from('money_bills').insert([{ ...form, user_id: user.id }]);
            if (!error) { setForm({ name: '', amount: '', due_date: format(new Date(), 'yyyy-MM-dd') }); fetchAllData(); notify('Bill added to system'); }
            setLoading(false);
        };

        const togglePaid = async (bill) => {
            const { error } = await supabase.from('money_bills').update({ is_paid: !bill.is_paid }).eq('id', bill.id);
            if (!error) fetchAllData();
        };

        const deleteBill = async (id) => {
            const { error } = await supabase.from('money_bills').delete().eq('id', id);
            if (!error) { fetchAllData(); notify('Bill removed'); }
        };

        return (
            <div className="space-y-8">
                <form onSubmit={handleAdd} className="bg-base-200 p-8 rounded-[2rem] border border-base-300 shadow-xl flex flex-col md:flex-row gap-4 animate-in slide-in-from-top-4 duration-300">
                    <div className="flex-1 space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-600 ml-2">Description</label>
                        <input placeholder="Rent, Electric, etc." className="w-full bg-base-100 p-4 rounded-xl font-bold outline-none text-base-content border-2 border-transparent focus:border-primary transition-all" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                    </div>
                    <div className="w-full md:w-32 space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-600 ml-2">Amount</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 font-bold">$</span>
                            <input type="number" placeholder="0" className="w-full bg-base-100 p-4 pl-8 rounded-xl font-bold outline-none text-base-content border-2 border-transparent focus:border-primary transition-all" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} />
                        </div>
                    </div>
                    <div className="w-full md:w-48 space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-600 ml-2">Due Date</label>
                        <input type="date" className="w-full bg-base-100 p-4 rounded-xl font-bold outline-none text-base-content [color-scheme:light] dark:[color-scheme:dark]" value={form.due_date} onChange={e => setForm({...form, due_date: e.target.value})} />
                    </div>
                    <button disabled={loading} className="md:mt-5 bg-primary text-primary-content px-8 py-4 rounded-xl font-black shadow-lg hover:scale-105 transition-transform disabled:opacity-50">
                        {loading ? 'Processing...' : 'Add Bill'}
                    </button>
                </form>

                <div className="grid gap-4">
                    {bills.map(bill => (
                        <div key={bill.id} className={`bg-base-200 p-6 rounded-[2rem] border border-base-300 flex items-center gap-6 group transition-all hover:border-success/30 ${bill.is_paid ? 'opacity-50' : ''}`}>
                            <button onClick={() => togglePaid(bill)} className={`w-10 h-10 rounded-2xl border-2 flex items-center justify-center transition-all ${bill.is_paid ? 'bg-success border-success text-white' : 'border-base-content/10 hover:border-success text-transparent hover:text-success'}`}>
                                <Icon name="Check" size={20} />
                            </button>
                            <div className="flex-1">
                                <h4 className={`text-xl font-black ${bill.is_paid ? 'line-through text-slate-600' : 'text-base-content'}`}>{bill.name}</h4>
                                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mt-1">Due {new Date(bill.due_date.replace(/-/g, '\/')).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}</p>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-black text-success">${bill.amount}</div>
                                <button onClick={() => deleteBill(bill.id)} className="text-slate-600 hover:text-danger opacity-0 group-hover:opacity-100 transition-all p-1 mt-1">
                                    <Icon name="Trash2" size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                    {bills.length === 0 && <div className="p-12 text-center text-slate-600 font-black uppercase tracking-widest border-2 border-dashed border-base-300 rounded-[2rem]">No pending obligations</div>}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-8 pb-20">
            {showHeaders && (
                <EditableHeader 
                    value={pageName} 
                    onSave={setPageName} 
                    subtext="Financial Management" 
                />
            )}

            {/* Global Financial State Widget */}
            <NetWorthWidget />

            {/* Internal Nav */}
            <div className="flex gap-2 p-1 bg-base-200 rounded-2xl w-fit border border-base-300">
                {[
                    { id: 'ledger', label: 'Ledger', icon: 'BookText' },
                    { id: 'accounts', label: 'Accounts', icon: 'Wallet' },
                    { id: 'bills', label: 'Bills', icon: 'CreditCard' }
                ].map(t => (
                    <button
                        key={t.id}
                        onClick={() => setActiveTab(t.id)}
                        className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all ${activeTab === t.id ? 'bg-primary text-primary-content shadow-md' : 'text-slate-600 hover:text-primary hover:bg-base-300/50'}`}
                    >
                        <Icon name={t.icon} size={14} />
                        {t.label}
                    </button>
                ))}
            </div>

            <div className="fade-in transition-all duration-500">
                {activeTab === 'ledger' && <LedgerTab />}
                {activeTab === 'accounts' && <AccountsTab />}
                {activeTab === 'bills' && <BillsTab />}
            </div>
        </div>
    );
};

export default Money;