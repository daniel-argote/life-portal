import { setDate, isAfter, addMonths } from 'date-fns';

const MoneySummary = ({ accounts = [], bills = [] }) => {
    const totalValue = accounts.reduce((acc, curr) => acc + Number(curr.balance || 0), 0);
    const paidBills = bills.filter(b => b.is_paid).length;
    const totalBills = bills.length;

    const calculateWeekly = (dueDay, balance) => {
        if (!dueDay || !balance || balance <= 0) return 0;
        const today = new Date();
        let targetDate = setDate(new Date(), dueDay);
        if (!isAfter(targetDate, today)) {
            targetDate = addMonths(targetDate, 1);
        }
        const diffDays = Math.max(1, Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
        const weeks = Math.ceil(diffDays / 7);
        return balance / weeks;
    };

    const totalWeeklyReq = accounts.reduce((acc, curr) => acc + calculateWeekly(curr.due_day, curr.statement_balance), 0);

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
            <div className="bg-base-200 p-6 rounded-3xl border border-base-300 flex flex-col items-center justify-center text-center transition-all hover:border-primary/30 h-full">
                <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-2">Liquid Assets</p>
                <div className="text-3xl font-black text-primary">${totalValue.toLocaleString()}</div>
            </div>

            <div className="bg-base-200 p-6 rounded-3xl border border-base-300 flex flex-col items-center justify-center text-center transition-all hover:border-success/30 h-full">
                <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-2">Bills Paid</p>
                <div className="text-3xl font-black text-success">{paidBills}/{totalBills}</div>
            </div>

            <div className="bg-base-200 p-6 rounded-3xl border border-base-300 flex flex-col items-center justify-center text-center transition-all hover:border-indigo-500/30 h-full">
                <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-2">Weekly Goal</p>
                <div className="text-3xl font-black text-indigo-500">${totalWeeklyReq.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>
        </div>
    );
};

export default MoneySummary;
