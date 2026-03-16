import Icon from '../components/Icon';
import PageContainer from '../components/PageContainer';

const Actions = ({ todos = [], chores = [], config = {}, dismissWelcome, setTab }) => {
    const activeTodos = todos.filter(t => t.status !== 'done');

    const categories = [
        { id: 'action_objectives', label: 'Objectives', icon: 'CheckSquare', description: 'Kanban board for tasks and projects' },
        { id: 'action_chores', label: 'Chores', icon: 'RefreshCw', description: 'Recurring household maintenance' },
        { id: 'action_goals', label: 'Strategic Goals', icon: 'Star', description: 'Long-term mission tracking' }
    ];

    return (
        <PageContainer>
            {config.showWelcomes && !config.dismissedWelcomes?.includes('actions') && (
                <div className="bg-primary/5 border border-primary/10 p-10 rounded-[3rem] text-center mb-6 relative group">
                    <button 
                        onClick={() => dismissWelcome('actions')}
                        className="absolute top-6 right-6 p-2 rounded-full hover:bg-primary/10 transition-colors text-primary/40 hover:text-primary"
                        title="Dismiss"
                    >
                        <Icon name="X" size={20} />
                    </button>
                    <Icon name="Target" size={48} className="text-primary/20 mx-auto mb-4" />
                    <h4 className="text-2xl font-black text-base-content mb-2">Welcome to your Action Hub</h4>
                    <p className="text-slate-600 font-bold max-w-md mx-auto">
                        Track your daily tasks, maintain your space with chores, and stay focused on your long-term goals.
                    </p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-base-200 p-8 rounded-[2.5rem] border border-base-300 shadow-sm flex flex-col transition-all hover:border-primary/30">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-primary/10 text-primary rounded-2xl">
                            <Icon name="CheckSquare" size={24} />
                        </div>
                        <h3 className="font-black text-lg">Active Objectives</h3>
                    </div>
                    <div className="flex-1 flex flex-col justify-center items-center text-center">
                        <div className="text-6xl font-black text-base-content mb-2">{activeTodos.length}</div>
                        <p className="text-xs font-black uppercase tracking-widest text-slate-600">Pending Tasks</p>
                    </div>
                </div>

                <div className="bg-base-200 p-8 rounded-[2.5rem] border border-base-300 shadow-sm flex flex-col transition-all hover:border-indigo-500/30">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-2xl">
                            <Icon name="RefreshCw" size={24} />
                        </div>
                        <h3 className="font-black text-lg">Chore Status</h3>
                    </div>
                    <div className="flex-1 flex flex-col justify-center items-center text-center">
                        <div className="text-6xl font-black text-base-content mb-2">{chores.length}</div>
                        <p className="text-xs font-black uppercase tracking-widest text-slate-600">Items Tracked</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
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

export default Actions;
