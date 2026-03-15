import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import Icon from '../components/Icon';
import EditableHeader from '../components/EditableHeader';
import MoneySummary from '../components/MoneySummary';

const Money = ({ user, pageName, setPageName, showHeaders, setTab }) => {
    const [accounts, setAccounts] = useState([]);
    const [bills, setBills] = useState([]);

    const fetchData = useCallback(async () => {
        if (!user) return;
        const { data: accs } = await supabase.from('money_accounts').select('*');
        setAccounts(accs || []);
        const { data: bls } = await supabase.from('money_bills').select('*');
        setBills(bls || []);
    }, [user]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const categories = [
        { id: 'money_ledger', label: 'Weekly Ledger', icon: 'BookText', description: 'Track weekly spending and cashflow' },
        { id: 'money_accounts', label: 'Accounts', icon: 'Wallet', description: 'Manage balances and assets' },
        { id: 'money_bills', label: 'Bills', icon: 'CreditCard', description: 'Monitor recurring obligations' }
    ];

    return (
        <div className="space-y-8 pb-20 animate-in fade-in duration-500">
            {showHeaders && (
                <EditableHeader 
                    value={pageName} 
                    onSave={setPageName} 
                    subtext="Financial Control Center" 
                />
            )}

            <div className="bg-primary/5 border border-primary/10 p-10 rounded-[3rem] text-center mb-6">
                <Icon name="Wallet" size={48} className="text-primary/20 mx-auto mb-4" />
                <h4 className="text-2xl font-black text-base-content mb-2">Welcome to your Money Hub</h4>
                <p className="text-slate-600 font-bold max-w-md mx-auto">
                    Stay in command of your finances. Monitor assets, track budgets, and never miss a bill.
                </p>
            </div>

            <MoneySummary accounts={accounts} bills={bills} />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setTab(cat.id)}
                        className="bg-base-200 p-8 rounded-[2.5rem] border border-base-300 text-left hover:border-primary/50 transition-all group flex flex-col gap-4 shadow-sm"
                    >
                        <div className="bg-primary/10 text-primary p-4 rounded-2xl w-fit group-hover:bg-primary group-hover:text-primary-content transition-all">
                            <Icon name={cat.icon} size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-base-content mb-1">{cat.label}</h3>
                            <p className="text-slate-600 font-bold text-xs leading-relaxed">{cat.description}</p>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default Money;
