import Icon from '../components/Icon';

const Calendar = () => {
    return (
        <div className="space-y-10">
            <header>
                <h2 className="text-5xl font-black tracking-tighter dark:text-white">Calendar</h2>
                <p className="text-slate-400 font-bold mt-2 uppercase tracking-widest text-[10px]">Schedule & Events</p>
            </header>
            <div className="bg-white dark:bg-slate-800 p-10 rounded-[3rem] border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col items-center justify-center text-center h-64">
                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4 text-slate-300 dark:text-slate-500">
                    <Icon name="Calendar" size={32} />
                </div>
                <p className="text-slate-500 dark:text-slate-400 font-bold">Time synchronization offline.</p>
            </div>
        </div>
    );
};

export default Calendar;