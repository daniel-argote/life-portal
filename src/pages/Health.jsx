import Icon from '../components/Icon';
import EditableHeader from '../components/EditableHeader';

const Health = ({ pageName, setPageName, showHeaders, setTab }) => {
    const categories = [
        { id: 'health_metrics', label: 'Biometrics', icon: 'Activity', description: 'Log weight, steps, and vital signs' },
        { id: 'health_appointments', label: 'Appointments', icon: 'CalendarDays', description: 'Schedule and track medical visits' }
    ];

    return (
        <div className="space-y-8 pb-20">
            {showHeaders && (
                <EditableHeader 
                    value={pageName} 
                    onSave={setPageName} 
                    subtext="Health & Wellness Management" 
                />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {categories.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setTab(cat.id)}
                        className="bg-base-200 p-8 rounded-[2.5rem] border border-base-300 text-left hover:border-primary/50 transition-all group flex items-start gap-6"
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

            <div className="bg-primary/5 border border-primary/10 p-10 rounded-[3rem] text-center">
                <Icon name="Heart" size={48} className="text-primary/20 mx-auto mb-4" />
                <h4 className="text-xl font-black text-base-content mb-2">Welcome to your Health Hub</h4>
                <p className="text-slate-600 font-bold max-w-md mx-auto">
                    A centralized place to monitor your physical well-being and stay on top of your medical schedule.
                </p>
            </div>
        </div>
    );
};

export default Health;
