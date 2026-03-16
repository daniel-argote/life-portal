import Icon from '../components/Icon';
import PageContainer from '../components/PageContainer';
import { format, isAfter, parseISO } from 'date-fns';

const Health = ({ appointments = [], biometrics = [] }) => {
    const today = new Date();
    const upcoming = appointments
        .filter(a => isAfter(parseISO(a.date), today))
        .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime())[0];
    
    const latestMetric = biometrics[0];

    return (
        <PageContainer>
            <div className="bg-primary/5 border border-primary/10 p-10 rounded-[3rem] text-center mb-6">
                <Icon name="Heart" size={48} className="text-primary/20 mx-auto mb-4" />
                <h4 className="text-2xl font-black text-base-content mb-2">Welcome to your Health Hub</h4>
                <p className="text-slate-600 font-bold max-w-md mx-auto">
                    A centralized place to monitor your physical well-being and stay on top of your medical schedule.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Next Appointment */}
                <div className="bg-base-200 p-8 rounded-[2.5rem] border border-base-300 shadow-sm flex flex-col transition-all hover:border-primary/30">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-primary/10 text-primary rounded-2xl">
                            <Icon name="Calendar" size={24} />
                        </div>
                        <h3 className="font-black text-lg">Next Appointment</h3>
                    </div>
                    {upcoming ? (
                        <div className="bg-base-100 p-6 rounded-3xl border border-base-300/50">
                            <p className="text-[10px] font-black uppercase text-primary mb-2">{format(parseISO(upcoming.date), 'EEEE, MMM do')}</p>
                            <h4 className="text-2xl font-black text-base-content">{upcoming.provider}</h4>
                            <p className="text-xs font-bold text-slate-600 mt-1 uppercase tracking-widest">{upcoming.type}</p>
                        </div>
                    ) : (
                        <p className="text-slate-500 font-bold text-sm italic flex-1 flex items-center justify-center text-center">No upcoming visits</p>
                    )}
                </div>

                {/* Latest Metric */}
                <div className="bg-base-200 p-8 rounded-[2.5rem] border border-base-300 shadow-sm flex flex-col transition-all hover:border-indigo-500/30">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-2xl">
                            <Icon name="Activity" size={24} />
                        </div>
                        <h3 className="font-black text-lg">Latest Biometric</h3>
                    </div>
                    {latestMetric ? (
                        <div className="bg-base-100 p-6 rounded-3xl border border-base-300/50">
                            <p className="text-[10px] font-black uppercase text-indigo-500 mb-2">{latestMetric.metric}</p>
                            <h4 className="text-3xl font-black text-base-content">{latestMetric.value}</h4>
                            <p className="text-[10px] font-bold text-slate-600 mt-2 italic">{new Date(latestMetric.created_at).toLocaleDateString()}</p>
                        </div>
                    ) : (
                        <p className="text-slate-500 font-bold text-sm italic flex-1 flex items-center justify-center text-center">No data logged yet</p>
                    )}
                </div>
            </div>
        </PageContainer>
    );
};

export default Health;
