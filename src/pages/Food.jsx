import Icon from '../components/Icon';

const Food = () => {
    return (
        <div className="space-y-8 pb-20 animate-in fade-in duration-500">
            <div className="bg-primary/5 border border-primary/10 p-10 rounded-[3rem] text-center mb-10">
                <Icon name="Utensils" size={48} className="text-primary/20 mx-auto mb-4" />
                <h4 className="text-2xl font-black text-base-content mb-2">Welcome to your Food Hub</h4>
                <p className="text-slate-600 font-bold max-w-md mx-auto">
                    Manage your nutrition, plan your week, and organize your kitchen from one central location.
                </p>
            </div>
        </div>
    );
};

export default Food;
