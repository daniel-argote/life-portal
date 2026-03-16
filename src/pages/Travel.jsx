import Icon from '../components/Icon';
import PageContainer from '../components/PageContainer';
import { format, isAfter, parseISO } from 'date-fns';

const Travel = ({ travelTrips = [], travelBucketList = [], config = {}, dismissWelcome }) => {
    const today = new Date();
    const upcomingTrips = travelTrips
        .filter(t => t.start_date && isAfter(parseISO(t.start_date), today))
        .sort((a, b) => parseISO(a.start_date).getTime() - parseISO(b.start_date).getTime());
    
    const nextTrip = upcomingTrips[0];
    const bucketItem = travelBucketList[Math.floor(Math.random() * travelBucketList.length)];

    return (
        <PageContainer>
            {config.showWelcomes && !config.dismissedWelcomes?.includes('travel') && (
                <div className="bg-primary/5 border border-primary/10 p-10 rounded-[3rem] text-center mb-6 relative group">
                    <button 
                        onClick={() => dismissWelcome('travel')}
                        className="absolute top-6 right-6 p-2 rounded-full hover:bg-primary/10 transition-colors text-primary/40 hover:text-primary"
                        title="Dismiss"
                    >
                        <Icon name="X" size={20} />
                    </button>
                    <Icon name="Plane" size={48} className="text-primary/20 mx-auto mb-4" />
                    <h4 className="text-2xl font-black text-base-content mb-2">Welcome to your Travel Hub</h4>
                    <p className="text-slate-600 font-bold max-w-md mx-auto">
                        Plan your next adventure, track your bucket list, and never forget an essential item.
                    </p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Next Adventure */}
                <div className="bg-base-200 p-8 rounded-[2.5rem] border border-base-300 shadow-sm flex flex-col transition-all hover:border-primary/30">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-primary/10 text-primary rounded-2xl">
                            <Icon name="Compass" size={24} />
                        </div>
                        <h3 className="font-black text-lg">Next Adventure</h3>
                    </div>
                    {nextTrip ? (
                        <div className="bg-base-100 p-6 rounded-3xl border border-base-300/50">
                            <p className="text-[10px] font-black uppercase text-primary mb-2">Starting {format(parseISO(nextTrip.start_date), 'MMM do, yyyy')}</p>
                            <h4 className="text-2xl font-black text-base-content">{nextTrip.name}</h4>
                            <div className="mt-4 flex items-center gap-2 text-slate-600 font-bold text-sm">
                                <Icon name="MapPin" size={14} />
                                {nextTrip.status}
                            </div>
                        </div>
                    ) : (
                        <p className="text-slate-500 font-bold text-sm italic flex-1 flex items-center justify-center text-center">No trips planned. Where to next?</p>
                    )}
                </div>

                {/* Wishlist Spotlight */}
                <div className="bg-base-200 p-8 rounded-[2.5rem] border border-base-300 shadow-sm flex flex-col transition-all hover:border-emerald-500/30">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl">
                            <Icon name="Star" size={24} />
                        </div>
                        <h3 className="font-black text-lg">Bucket List Spotlight</h3>
                    </div>
                    {bucketItem ? (
                        <div className="bg-base-100 p-6 rounded-3xl border border-base-300/50 flex-1">
                            <p className="text-[10px] font-black uppercase text-emerald-500 mb-2">{bucketItem.country || 'Global'}</p>
                            <h4 className="text-2xl font-black text-base-content mb-2">{bucketItem.name}</h4>
                            <p className="text-sm font-bold text-slate-600 line-clamp-2 italic">&quot;{bucketItem.notes || 'No notes yet...'}&quot;</p>
                        </div>
                    ) : (
                        <p className="text-slate-500 font-bold text-sm italic flex-1 flex items-center justify-center text-center">Your wishlist is empty. Dream big!</p>
                    )}
                </div>
            </div>
        </PageContainer>
    );
};

export default Travel;
