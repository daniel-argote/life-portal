import Icon from '../components/Icon';
import PageContainer from '../components/PageContainer';
import { format } from 'date-fns';

const CalendarHub = ({ events = [], appointments = [], config = {}, dismissWelcome, setTab }) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const todayEvents = events.filter(e => e.start_time.split('T')[0] === today);
    const nextAppt = appointments[0];

    const categories = [
        { id: 'calendar_grid', label: 'Month View', icon: 'Calendar', description: 'Traditional grid layout for monthly planning' },
        { id: 'calendar_timeline', label: 'Timeline', icon: 'History', description: 'Vertical chronological view of all upcoming items' }
    ];

    return (
        <PageContainer>
            {config.showWelcomes && !config.dismissedWelcomes?.includes('calendar') && (
                <div className="bg-primary/5 border border-primary/10 p-10 rounded-[3rem] text-center mb-6 relative group">
                    <button 
                        onClick={() => dismissWelcome('calendar')}
                        className="absolute top-6 right-6 p-2 rounded-full hover:bg-primary/10 transition-colors text-primary/40 hover:text-primary"
                        title="Dismiss"
                    >
                        <Icon name="X" size={20} />
                    </button>
                    <Icon name="Calendar" size={48} className="text-primary/20 mx-auto mb-4" />
                    <h4 className="text-2xl font-black text-base-content mb-2">Welcome to your Calendar Hub</h4>
                    <p className="text-slate-600 font-bold max-w-md mx-auto">
                        Manage your schedule, track your deadlines, and visualize your journey in multiple views.
                    </p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Today's Agenda */}
                <div className="bg-base-200 p-8 rounded-[2.5rem] border border-base-300 shadow-sm flex flex-col transition-all hover:border-primary/30">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-primary/10 text-primary rounded-2xl">
                            <Icon name="Clock" size={24} />
                        </div>
                        <h3 className="font-black text-lg">Today&apos;s Agenda</h3>
                    </div>
                    {todayEvents.length > 0 ? (
                        <div className="space-y-3 flex-1">
                            {todayEvents.map(e => (
                                <div key={e.id} className="bg-base-100 p-4 rounded-2xl border border-base-300/50">
                                    <p className="font-bold text-base-content">{e.title}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-slate-500 font-bold text-sm italic flex-1 flex items-center justify-center text-center">Nothing scheduled for today</p>
                    )}
                </div>

                {/* Next Appointment */}
                <div className="bg-base-200 p-8 rounded-[2.5rem] border border-base-300 shadow-sm flex flex-col transition-all hover:border-indigo-500/30">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-2xl">
                            <Icon name="HeartPulse" size={24} />
                        </div>
                        <h3 className="font-black text-lg">Coming Up</h3>
                    </div>
                    {nextAppt ? (
                        <div className="bg-base-100 p-6 rounded-3xl border border-base-300/50 flex-1">
                            <p className="text-[10px] font-black uppercase text-indigo-500 mb-2">{format(new Date(nextAppt.date.replace(/-/g, '/')), 'MMMM do')}</p>
                            <h4 className="text-xl font-black text-base-content leading-tight">{nextAppt.provider}</h4>
                            <p className="text-xs font-bold text-slate-600 mt-1 uppercase tracking-widest">{nextAppt.type}</p>
                        </div>
                    ) : (
                        <p className="text-slate-500 font-bold text-sm italic flex-1 flex items-center justify-center text-center">No upcoming appointments</p>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                {categories.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setTab(cat.id)}
                        className="bg-base-200 p-6 rounded-[2rem] border border-base-300 text-left hover:border-primary/50 transition-all group flex flex-col gap-3"
                    >
                        <div className="bg-primary/10 text-primary p-3 rounded-xl w-fit group-hover:bg-primary group-hover:text-primary-content transition-all">
                            <Icon name={cat.icon} size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-base-content mb-1">{cat.label}</h3>
                            <p className="text-slate-600 font-bold text-[10px] leading-relaxed line-clamp-2">{cat.description}</p>
                        </div>
                    </button>
                ))}
            </div>
        </PageContainer>
    );
};

export default CalendarHub;
