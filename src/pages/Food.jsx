import Icon from '../components/Icon';
import EditableHeader from '../components/EditableHeader';

const Food = ({ pageName, setPageName, showHeaders, setTab }) => {
    const categories = [
        { id: 'food_journal', label: 'Journal', icon: 'BookText', description: 'Log daily meals and calories' },
        { id: 'food_planner', label: 'Planner', icon: 'CalendarDays', description: 'Schedule meals for the week' },
        { id: 'food_recipes', label: 'Recipes', icon: 'Salad', description: 'Your personal cookbook' },
        { id: 'food_inventory', label: 'Inventory', icon: 'Library', description: 'Track pantry and fridge stock' }
    ];

    return (
        <div className="space-y-8 pb-20 animate-in fade-in duration-500">
            {showHeaders && (
                <EditableHeader 
                    value={pageName} 
                    onSave={setPageName} 
                    subtext="Culinary Center Management" 
                />
            )}

            <div className="bg-primary/5 border border-primary/10 p-10 rounded-[3rem] text-center mb-10">
                <Icon name="Utensils" size={48} className="text-primary/20 mx-auto mb-4" />
                <h4 className="text-2xl font-black text-base-content mb-2">Welcome to your Food Hub</h4>
                <p className="text-slate-600 font-bold max-w-md mx-auto">
                    Manage your nutrition, plan your week, and organize your kitchen from one central location.
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

export default Food;
