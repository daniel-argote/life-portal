import Icon from '../components/Icon';
import PageContainer from '../components/PageContainer';
import { VehiclePlaceholder } from '../components/VehicleIcons';
import { format } from 'date-fns';

const Vehicles = ({ vehicles = [], vehicleRecords = [], config = {}, dismissWelcome }) => {
    const totalVehicles = vehicles.length;
    const latestRecord = vehicleRecords[0];
    
    // Count records in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentRecordsCount = vehicleRecords.filter(r => new Date(r.date) > thirtyDaysAgo).length;

    return (
        <PageContainer>
            {config.showWelcomes && !config.dismissedWelcomes?.includes('vehicles') && (
                <div className="bg-primary/5 border border-primary/10 p-10 rounded-[3rem] text-center mb-6 relative group">
                    <button 
                        onClick={() => dismissWelcome('vehicles')}
                        className="absolute top-6 right-6 p-2 rounded-full hover:bg-primary/10 transition-colors text-primary/40 hover:text-primary"
                        title="Dismiss"
                    >
                        <Icon name="X" size={20} />
                    </button>
                    <Icon name="CarFront" size={48} className="text-primary/20 mx-auto mb-4" />
                    <h4 className="text-2xl font-black text-base-content mb-2">Welcome to your Vehicle Hub</h4>
                    <p className="text-slate-600 font-bold max-w-md mx-auto">
                        Keep your vehicles in peak condition. Track every oil change, repair, and upgrade in one place.
                    </p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Fleet Overview */}
                <div className="bg-base-200 p-8 rounded-[2.5rem] border border-base-300 shadow-sm flex flex-col items-center justify-center text-center transition-all hover:border-primary/30">
                    <div className="text-6xl font-black text-primary mb-2">{totalVehicles}</div>
                    <p className="text-xs font-black uppercase tracking-widest text-slate-600">Active Fleet</p>
                    <div className="mt-6 flex -space-x-2">
                        {vehicles.slice(0, 3).map(v => (
                            <div key={v.id} className="w-10 h-10 rounded-full border-2 border-base-200 bg-base-300 flex items-center justify-center overflow-hidden">
                                {v.image_url ? <img src={v.image_url} className="w-full h-full object-cover" /> : <Icon name="Car" size={16} />}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Maintenance Status */}
                <div className="md:col-span-2 bg-base-200 p-8 rounded-[2.5rem] border border-base-300 shadow-sm flex flex-col transition-all hover:border-indigo-500/30">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-2xl">
                            <Icon name="Wrench" size={24} />
                        </div>
                        <h3 className="font-black text-lg">Service Activity</h3>
                    </div>
                    {latestRecord ? (
                        <div className="bg-base-100 p-6 rounded-3xl border border-base-300/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <p className="text-[10px] font-black uppercase text-indigo-500 mb-1">{latestRecord.type} • {format(new Date(latestRecord.date.replace(/-/g, '\/')), 'MMM do')}</p>
                                <h4 className="text-xl font-black text-base-content">{latestRecord.description}</h4>
                                <p className="text-xs font-bold text-slate-600 mt-1 uppercase tracking-widest">{latestRecord.vehicles?.name}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Recent (30d)</p>
                                <p className="text-2xl font-black text-indigo-500">{recentRecordsCount} Records</p>
                            </div>
                        </div>
                    ) : (
                        <p className="text-slate-500 font-bold text-sm italic flex-1 flex items-center justify-center text-center">No service records found</p>
                    )}
                </div>
            </div>
        </PageContainer>
    );
};

export default Vehicles;
