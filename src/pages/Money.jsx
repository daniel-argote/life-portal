import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import Icon from '../components/Icon';
import MoneySummary from '../components/MoneySummary';
import PageContainer from '../components/PageContainer';

const Money = ({ user }) => {
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

    return (
        <PageContainer>
            <div className="bg-primary/5 border border-primary/10 p-10 rounded-[3rem] text-center mb-6">
                <Icon name="Wallet" size={48} className="text-primary/20 mx-auto mb-4" />
                <h4 className="text-2xl font-black text-base-content mb-2">Welcome to your Money Hub</h4>
                <p className="text-slate-600 font-bold max-w-md mx-auto">
                    Stay in command of your finances. Monitor assets, track budgets, and never miss a bill.
                </p>
            </div>

            <MoneySummary accounts={accounts} bills={bills} />
        </PageContainer>
    );
};

export default Money;
