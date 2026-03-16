import Icon from '../components/Icon';
import PageContainer from '../components/PageContainer';
import { format, isAfter, parseISO } from 'date-fns';

const Recreation = ({ hikes = [], camping = [], config = {}, dismissWelcome, setTab }) => {
    const today = new Date();
    
    // Hike stats
    const thisYear = new Date().getFullYear();
    const hikesThisYear = hikes.filter(h => new Date(h.date).getFullYear() === thisYear);
    const totalMiles = hikesThisYear.reduce((acc, curr) => acc + (parseFloat(curr.distance) || 0), 0);
    const totalElevation = hikesThisYear.reduce((acc, curr) => acc + (parseInt(curr.elevation_gain) || 0), 0);

    // Next camping trip
    const nextCamping = camping
        .filter(c => isAfter(parseISO(c.start_date), today))
        .sort((a, b) => parseISO(a.start_date).getTime() - parseISO(b.start_date).getTime())[0];

    const categories = [
        { id: 'recreation_hikes', label: 'Hike Log', icon: 'Footprints', description: 'Record trail distance, gain, and ratings' },
        { id: 'recreation_camping', label: 'Camping', icon: 'Tent', description: 'Track campsites and future adventures' }
    ];

    return (
        <PageContainer>
            {config.showWelcomes && !config.dismissedWelcomes?.includes('recreation') && (
                <div className="bg-primary/5 border border-primary/10 p-10 rounded-[3rem] text-center mb-6 relative group">
                    <button 
                        onClick={() => dismissWelcome('recreation')}
                        className="absolute top-6 right-6 p-2 rounded-full hover:bg-primary/10 transition-colors text-primary/40 hover:text-primary"
                        title="Dismiss"
                    >
                        <Icon name="X" size={20} />
                    </button>
                    <Icon name="Trees" size={48} className="text-primary/20 mx-auto mb-4" />
                    <h4 className="text-2xl font-black text-base-content mb-2">Welcome to Recreation</h4>
                    <p className="text-slate-600 font-bold max-w-md mx-auto">
                        Log your trail adventures and plan your next escape into the great outdoors.
                    </p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Trail Stats */}
                <div className="bg-base-200 p-8 rounded-[2.5rem] border border-base-300 shadow-sm flex flex-col transition-all hover:border-primary/30">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-primary/10 text-primary rounded-2xl">
                            <Icon name="Footprints" size={24} />
                        </div>
                        <h3 className="font-black text-lg">Trail Stats ({thisYear})</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4 flex-1 items-center">
                        <div className="text-center">
                            <p className="text-4xl font-black text-primary">{totalMiles.toFixed(1)}</p>
                            <p className="text-[10px] font-black uppercase text-slate-600 tracking-widest">Total Miles</p>
                        </div>
                        <div className="text-center border-l border-base-300">
                            <p className="text-4xl font-black text-indigo-500">{totalElevation.toLocaleString()}</p>
                            <p className="text-[10px] font-black uppercase text-slate-600 tracking-widest">Vertical Ft</p>
                        </div>
                    </div>
                </div>

                {/* Next Camping */}
                <div className="bg-base-200 p-8 rounded-[2.5rem] border border-base-300 shadow-sm flex flex-col transition-all hover:border-emerald-500/30">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl">
                            <Icon name="Tent" size={24} />
                        </div>
                        <h3 className="font-black text-lg">Next Camping Trip</h3>
                    </div>
                    {nextCamping ? (
                        <div className="bg-base-100 p-6 rounded-3xl border border-base-300/50">
                            <p className="text-[10px] font-black uppercase text-emerald-500 mb-2">{format(parseISO(nextCamping.start_date), 'MMMM do')}</p>
                            <h4 className="text-2xl font-black text-base-content leading-tight">{nextCamping.site_name}</h4>
                            <p className="text-xs font-bold text-slate-600 mt-1">{nextCamping.location}</p>
                        </div>
                    ) : (
                        <p className="text-slate-500 font-bold text-sm italic flex-1 flex items-center justify-center text-center">No upcoming trips planned</p>
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

export default Recreation;
