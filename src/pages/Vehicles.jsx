import Icon from '../components/Icon';
import EditableHeader from '../components/EditableHeader';

const Vehicles = ({ pageName, setPageName, showHeaders, setTab }) => {
    const categories = [
        { id: 'vehicle_fleet', label: 'The Fleet', icon: 'Car', description: 'Manage your cars, trucks, and bikes' },
        { id: 'vehicle_service', label: 'Service Log', icon: 'Wrench', description: 'Track maintenance and repairs' }
    ];

    return (
        <div className="space-y-8 pb-20 animate-in fade-in duration-500">
            {showHeaders && (
                <EditableHeader 
                    value={pageName} 
                    onSave={setPageName} 
                    subtext="Fleet & Maintenance Log" 
                />
            )}

            <div className="bg-primary/5 border border-primary/10 p-10 rounded-[3rem] text-center mb-10">
                <Icon name="CarFront" size={48} className="text-primary/20 mx-auto mb-4" />
                <h4 className="text-2xl font-black text-base-content mb-2">Welcome to your Vehicle Hub</h4>
                <p className="text-slate-600 font-bold max-w-md mx-auto">
                    Keep your vehicles in peak condition. Track every oil change, repair, and upgrade in one place.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {categories.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setTab(cat.id)}
                        className="bg-base-200 p-8 rounded-[2.5rem] border border-base-300 text-left hover:border-primary/50 transition-all group flex items-start gap-6 shadow-sm"
                    >
                        <div className="bg-primary/10 text-primary p-4 rounded-2xl group-hover:bg-primary group-hover:text-primary-content transition-all">
                            <Icon name={cat.icon} size={32} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-base-content mb-2">{cat.label}</h3>
                            <p className="text-slate-600 font-bold text-sm leading-relaxed">{cat.description}</p>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default Vehicles;
