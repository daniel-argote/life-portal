import Icon from '../components/Icon';
import PageContainer from '../components/PageContainer';
import { format } from 'date-fns';

const Food = ({ mealPlan = [], food = [], inventory = [], config = {}, dismissWelcome, setTab }) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const todayMeals = mealPlan.filter(m => m.day_date === today);
    const latestLog = food[0];
    const lowStockCount = inventory.length > 0 ? Math.floor(inventory.length * 0.2) : 0; // Simple simulation

    return (
        <PageContainer>
            {config.showWelcomes && !config.dismissedWelcomes?.includes('food') && (
                <div className="bg-primary/5 border border-primary/10 p-10 rounded-[3rem] text-center mb-6 relative group">
                    <button 
                        onClick={() => dismissWelcome('food')}
                        className="absolute top-6 right-6 p-2 rounded-full hover:bg-primary/10 transition-colors text-primary/40 hover:text-primary"
                        title="Dismiss"
                    >
                        <Icon name="X" size={20} />
                    </button>
                    <Icon name="Utensils" size={48} className="text-primary/20 mx-auto mb-4" />
                    <h4 className="text-2xl font-black text-base-content mb-2">Welcome to your Food Hub</h4>
                    <p className="text-slate-600 font-bold max-w-md mx-auto">
                        Manage your nutrition, plan your week, and organize your kitchen from one central location.
                    </p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Today's Plan */}
                <div className="bg-base-200 p-8 rounded-[2.5rem] border border-base-300 shadow-sm flex flex-col h-full transition-all hover:border-primary/30">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-primary/10 text-primary rounded-2xl">
                            <Icon name="CalendarDays" size={24} />
                        </div>
                        <h3 className="font-black text-lg">Today&apos;s Plan</h3>
                    </div>
                    {todayMeals.length > 0 ? (
                        <div className="space-y-3 flex-1">
                            {todayMeals.map(m => (
                                <div key={m.id} className="bg-base-100 p-4 rounded-2xl border border-base-300/50">
                                    <p className="text-[10px] font-black uppercase text-primary mb-1">{m.meal_type}</p>
                                    <p className="font-bold text-base-content truncate">{m.recipes?.title || m.note}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-slate-500 font-bold text-sm italic flex-1 flex items-center justify-center text-center">No meals planned for today</p>
                    )}
                </div>

                {/* Latest Activity */}
                <div className="bg-base-200 p-8 rounded-[2.5rem] border border-base-300 shadow-sm flex flex-col h-full transition-all hover:border-indigo-500/30">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-2xl">
                            <Icon name="History" size={24} />
                        </div>
                        <h3 className="font-black text-lg">Last Logged</h3>
                    </div>
                    {latestLog ? (
                        <div className="bg-base-100 p-6 rounded-2xl border border-base-300/50 flex-1">
                            <p className="text-[10px] font-black uppercase text-indigo-500 mb-2">{latestLog.meal}</p>
                            <p className="text-xl font-black text-base-content mb-2">{latestLog.content}</p>
                            {latestLog.calories && <p className="text-xs font-bold text-slate-600">{latestLog.calories} kcal</p>}
                        </div>
                    ) : (
                        <p className="text-slate-500 font-bold text-sm italic flex-1 flex items-center justify-center text-center">No entries in your journal</p>
                    )}
                </div>

                {/* Kitchen Status */}
                <div className="bg-base-200 p-8 rounded-[2.5rem] border border-base-300 shadow-sm flex flex-col h-full transition-all hover:border-emerald-500/30">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl">
                            <Icon name="Library" size={24} />
                        </div>
                        <h3 className="font-black text-lg">Pantry Status</h3>
                    </div>
                    <div className="flex-1 flex flex-col justify-center items-center text-center">
                        <div className="text-6xl font-black text-base-content mb-2">{inventory.length}</div>
                        <p className="text-xs font-black uppercase tracking-widest text-slate-600">Items Tracked</p>
                        <div className="mt-6 w-full bg-base-100 p-4 rounded-2xl border border-base-300/50">
                            <p className="text-xs font-bold text-emerald-600">{lowStockCount} items potentially low</p>
                        </div>
                    </div>
                </div>

                {/* Culinary Standings */}
                <div 
                    onClick={() => setTab('food_top_lists')}
                    className="bg-base-200 p-8 rounded-[2.5rem] border border-base-300 shadow-sm flex flex-col h-full transition-all hover:border-primary/30 cursor-pointer group"
                >
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-primary/10 text-primary rounded-2xl group-hover:bg-primary group-hover:text-primary-content transition-all">
                            <Icon name="Trophy" size={24} />
                        </div>
                        <h3 className="font-black text-lg">Culinary Standings</h3>
                    </div>
                    <p className="text-sm font-bold text-slate-500 italic flex-1">
                        Rank your favorite dishes and establishments. From the best Reuben to the ultimate Burger.
                    </p>
                    <div className="mt-6 flex justify-end">
                        <Icon name="ArrowRight" className="text-primary opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" size={20} />
                    </div>
                </div>
            </div>
        </PageContainer>
    );
};

export default Food;
