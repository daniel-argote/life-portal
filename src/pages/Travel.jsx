import Icon from '../components/Icon';
import PageContainer from '../components/PageContainer';
import { format, isAfter, parseISO, differenceInDays } from 'date-fns';

const Travel = ({ travelTrips = [], travelBucketList = [], travelPacking = [], config = {}, updateConfig, setTab }) => {
    // Find next trip
    const upcomingTrips = travelTrips
        .filter(t => isAfter(parseISO(t.start_date), new Date()))
        .sort((a, b) => parseISO(a.start_date) - parseISO(b.start_date));
    
    const nextTrip = upcomingTrips[0];
    const daysToNext = nextTrip ? differenceInDays(parseISO(nextTrip.start_date), new Date()) : null;

    // Packing progress for next trip
    const nextTripPacking = travelPacking.filter(p => p.trip_id === nextTrip?.id);
    const packedCount = nextTripPacking.filter(p => p.is_packed).length;
    const packingPercent = nextTripPacking.length > 0 ? Math.round((packedCount / nextTripPacking.length) * 100) : 0;

    const showWishlist = !config.hideTravelWishlist;

    return (
        <PageContainer>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Hero: Next Trip Countdown */}
                <div className="lg:col-span-2 bg-primary text-primary-content p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group">
                    <Icon name="Plane" size={200} className="absolute -right-10 -bottom-10 opacity-10 -rotate-12 group-hover:scale-110 transition-transform duration-700" />
                    
                    {nextTrip ? (
                        <div className="relative z-10 space-y-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-xs font-black uppercase tracking-[0.2em] opacity-70 mb-2 text-primary-content/80">Next Adventure</p>
                                    <h2 className="text-5xl font-black tracking-tight leading-none">{nextTrip.name}</h2>
                                </div>
                                <div className="text-right">
                                    <p className="text-6xl font-black leading-none">{daysToNext}</p>
                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Days to go</p>
                                </div>
                            </div>

                            <div className="pt-8 space-y-4">
                                <div className="flex justify-between items-end">
                                    <p className="text-sm font-bold flex items-center gap-2">
                                        <Icon name="Briefcase" size={16} />
                                        Packing Readiness
                                    </p>
                                    <p className="text-2xl font-black">{packingPercent}%</p>
                                </div>
                                <div className="w-full h-4 bg-white/20 rounded-full overflow-hidden p-1 border border-white/10">
                                    <div 
                                        className="h-full bg-white rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(255,255,255,0.5)]" 
                                        style={{ width: `${packingPercent}%` }} 
                                    />
                                </div>
                                <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest">
                                    {packedCount} of {nextTripPacking.length} essentials ready
                                </p>
                            </div>

                            <button 
                                onClick={() => setTab('travel_trips')}
                                className="mt-4 bg-white text-primary px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl"
                            >
                                Open Itinerary
                            </button>
                        </div>
                    ) : (
                        <div className="relative z-10 h-full flex flex-col justify-center items-center text-center p-10 space-y-4">
                            <Icon name="Compass" size={48} className="opacity-50" />
                            <h2 className="text-3xl font-black">Where to next?</h2>
                            <p className="max-w-xs font-bold opacity-80">You don't have any upcoming journeys planned yet.</p>
                            <button 
                                onClick={() => setTab('travel_trips')}
                                className="bg-white text-primary px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl"
                            >
                                Plan a Trip
                            </button>
                        </div>
                    )}
                </div>

                {/* Quick Stats Sidebar */}
                <div className="space-y-6">
                    <div className="bg-base-200 p-8 rounded-[2.5rem] border border-base-300 shadow-sm">
                        <h4 className="text-xs font-black uppercase tracking-widest text-primary mb-6 flex justify-between items-center">
                            Trip Stats
                            <Icon name="BarChart3" size={14} />
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-base-100 p-4 rounded-2xl border border-base-300/50">
                                <p className="text-2xl font-black text-base-content">{travelTrips.length}</p>
                                <p className="text-[10px] font-black uppercase text-slate-400">Total Trips</p>
                            </div>
                            <div className="bg-base-100 p-4 rounded-2xl border border-base-300/50">
                                <p className="text-2xl font-black text-base-content">{travelBucketList.filter(i => i.is_visited).length}</p>
                                <p className="text-[10px] font-black uppercase text-slate-400">Visited</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-base-200 p-8 rounded-[2.5rem] border border-base-300 shadow-sm overflow-hidden relative">
                        <div className="flex justify-between items-center mb-6">
                            <h4 className="text-xs font-black uppercase tracking-widest text-primary">Wishlist</h4>
                            <button 
                                onClick={() => updateConfig('hideTravelWishlist', !config.hideTravelWishlist)}
                                className="text-[10px] font-black uppercase text-slate-400 hover:text-primary transition-colors"
                            >
                                {showWishlist ? 'Hide' : 'Show'}
                            </button>
                        </div>

                        {showWishlist ? (
                            <div className="space-y-3">
                                {travelBucketList
                                    .filter(i => !i.is_visited && i.priority === 'high')
                                    .slice(0, 3)
                                    .map(item => (
                                        <div key={item.id} className="flex items-center gap-3 bg-base-100 p-3 rounded-xl border border-base-300/50 group">
                                            <div className="w-8 h-8 bg-primary/10 text-primary rounded-lg flex items-center justify-center font-black text-xs">
                                                <Icon name="Star" size={14} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-base-content leading-tight">{item.name}</p>
                                                <p className="text-[10px] font-bold text-slate-400">{item.country}</p>
                                            </div>
                                        </div>
                                    ))}
                                {travelBucketList.filter(i => !i.is_visited && i.priority === 'high').length === 0 && (
                                    <p className="text-[10px] font-bold text-slate-400 italic py-4 text-center">Pin some high-priority dreams!</p>
                                )}
                                <button 
                                    onClick={() => setTab('travel_bucket')}
                                    className="w-full py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary hover:bg-base-300/50 rounded-xl transition-all mt-2"
                                >
                                    View Full Bucket List
                                </button>
                            </div>
                        ) : (
                            <div className="py-8 text-center">
                                <Icon name="EyeOff" size={24} className="mx-auto text-slate-300 mb-2" />
                                <p className="text-[10px] font-black uppercase text-slate-400">Wishlist Hidden</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </PageContainer>
    );
};

export default Travel;
