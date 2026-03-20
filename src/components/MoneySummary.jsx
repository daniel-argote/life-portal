const MoneySummary = ({ accounts = [], bills = [] }) => {
    const totalValue = accounts.reduce((acc, curr) => acc + Number(curr.balance || 0), 0);
    const paidBills = bills.filter(b => b.is_paid).length;
    const totalBills = bills.length;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
            <div className="bg-base-200 p-6 rounded-3xl border border-base-300 flex flex-col items-center justify-center text-center transition-all hover:border-primary/30 h-full">
                <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-2">Liquid Assets</p>
                <div className="text-3xl font-black text-primary">${totalValue.toLocaleString()}</div>
            </div>

            <div className="bg-base-200 p-6 rounded-3xl border border-base-300 flex flex-col items-center justify-center text-center transition-all hover:border-success/30 h-full">
                <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-2">Bills Paid</p>
                <div className="text-3xl font-black text-success">{paidBills}/{totalBills}</div>
            </div>
        </div>
    );
};

export default MoneySummary;
