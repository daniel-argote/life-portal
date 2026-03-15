import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import Icon from '../components/Icon';
import EditableHeader from '../components/EditableHeader';
import { format } from 'date-fns';

const MoneyBills = ({ user, notify, pageName, setPageName, showHeaders }) => {
    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({ name: '', amount: '', due_date: format(new Date(), 'yyyy-MM-dd') });

    const fetchBills = useCallback(async () => {
        if (!user) return;
        const { data } = await supabase.from('money_bills').select('*').order('due_date', { ascending: true });
        setBills(data || []);
    }, [user]);

    useEffect(() => { fetchBills(); }, [fetchBills]);

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!form.name || !form.amount) return;
        setLoading(true);
        const { error } = await supabase.from('money_bills').insert([{ ...form, user_id: user.id }]);
        if (!error) { setForm({ name: '', amount: '', due_date: format(new Date(), 'yyyy-MM-dd') }); fetchBills(); notify('Bill added to system'); }
        setLoading(false);
    };

    const togglePaid = async (bill) => {
        const { error } = await supabase.from('money_bills').update({ is_paid: !bill.is_paid }).eq('id', bill.id);
        if (!error) fetchBills();
    };

    const deleteBill = async (id) => {
        const { error } = await supabase.from('money_bills').delete().eq('id', id);
        if (!error) { fetchBills(); notify('Bill removed'); }
    };

    return (
        <div className="space-y-8 pb-20">
            {showHeaders && (
                <EditableHeader value={pageName} onSave={setPageName} subtext="Recurring Obligations" />
            )}

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

export default MoneyBills;
