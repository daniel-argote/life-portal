import Icon from '../components/Icon';
import MoneySummary from '../components/MoneySummary';
import PageContainer from '../components/PageContainer';
import { format, isAfter, parseISO } from 'date-fns';

const Money = ({ accounts = [], bills = [] }) => {
    const today = new Date();
    const upcomingBills = bills
        .filter(b => !b.is_paid && isAfter(parseISO(b.due_date), today))
        .sort((a, b) => parseISO(a.due_date).getTime() - parseISO(b.due_date).getTime());
    
    const nextBill = upcomingBills[0];

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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Next Obligation */}
                <div className="bg-base-200 p-8 rounded-[2.5rem] border border-base-300 shadow-sm flex flex-col transition-all hover:border-danger/30">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-danger/10 text-danger rounded-2xl">
                            <Icon name="AlertCircle" size={24} />
                        </div>
                        <h3 className="font-black text-lg">Next Obligation</h3>
                    </div>
                    {nextBill ? (
                        <div className="bg-base-100 p-6 rounded-3xl border border-base-300/50">
                            <p className="text-[10px] font-black uppercase text-danger mb-2">Due {format(parseISO(nextBill.due_date), 'MMM do')}</p>
                            <h4 className="text-2xl font-black text-base-content">{nextBill.name}</h4>
                            <p className="text-3xl font-black text-danger mt-2">${nextBill.amount}</p>
                        </div>
                    ) : (
                        <p className="text-slate-500 font-bold text-sm italic flex-1 flex items-center justify-center text-center">No upcoming bills</p>
                    )}
                </div>

                {/* Top Asset */}
                <div className="bg-base-200 p-8 rounded-[2.5rem] border border-base-300 shadow-sm flex flex-col transition-all hover:border-success/30">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-success/10 text-success rounded-2xl">
                            <Icon name="TrendingUp" size={24} />
                        </div>
                        <h3 className="font-black text-lg">Largest Account</h3>
                    </div>
                    {accounts.length > 0 ? (
                        (() => {
                            const topAccount = [...accounts].sort((a, b) => b.balance - a.balance)[0];
                            return (
                                <div className="bg-base-100 p-6 rounded-3xl border border-base-300/50">
                                    <p className="text-[10px] font-black uppercase text-success mb-2">Priority Fund</p>
                                    <h4 className="text-2xl font-black text-base-content">{topAccount.name}</h4>
                                    <p className="text-3xl font-black text-success mt-2">${Number(topAccount.balance).toLocaleString()}</p>
                                </div>
                            );
                        })()
                    ) : (
                        <p className="text-slate-500 font-bold text-sm italic flex-1 flex items-center justify-center text-center">Add your first account</p>
                    )}
                </div>
            </div>
        </PageContainer>
    );
};

export default Money;
