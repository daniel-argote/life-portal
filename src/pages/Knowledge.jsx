import Icon from '../components/Icon';
import PageContainer from '../components/PageContainer';

const Knowledge = ({ vault = [], readingList = [], config = {}, dismissWelcome }) => {
    const latestNote = vault[0];
    const currentRead = readingList.find(r => r.status === 'reading');

    return (
        <PageContainer>
            {config.showWelcomes && !config.dismissedWelcomes?.includes('knowledge') && (
                <div className="bg-primary/5 border border-primary/10 p-10 rounded-[3rem] text-center mb-6 relative group">
                    <button 
                        onClick={() => dismissWelcome('knowledge')}
                        className="absolute top-6 right-6 p-2 rounded-full hover:bg-primary/10 transition-colors text-primary/40 hover:text-primary"
                        title="Dismiss"
                    >
                        <Icon name="X" size={20} />
                    </button>
                    <Icon name="BrainCircuit" size={48} className="text-primary/20 mx-auto mb-4" />
                    <h4 className="text-2xl font-black text-base-content mb-2">Welcome to your Knowledge Hub</h4>
                    <p className="text-slate-600 font-bold max-w-md mx-auto">
                        Capture everything that matters. Organize your thoughts and track your learning journey.
                    </p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Latest Intelligence */}
                <div className="bg-base-200 p-8 rounded-[2.5rem] border border-base-300 shadow-sm flex flex-col transition-all hover:border-indigo-500/30">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-2xl">
                            <Icon name="Vault" size={24} />
                        </div>
                        <h3 className="font-black text-lg">Latest Note</h3>
                    </div>
                    {latestNote ? (
                        <div className="bg-base-100 p-6 rounded-3xl border border-base-300/50 flex-1">
                            <h4 className="text-xl font-black text-base-content mb-2">{latestNote.title}</h4>
                            <p className="text-sm font-bold text-slate-600 line-clamp-3 leading-relaxed">{latestNote.content}</p>
                        </div>
                    ) : (
                        <p className="text-slate-500 font-bold text-sm italic flex-1 flex items-center justify-center text-center">Your vault is empty</p>
                    )}
                </div>

                {/* Reading Status */}
                <div className="bg-base-200 p-8 rounded-[2.5rem] border border-base-300 shadow-sm flex flex-col transition-all hover:border-emerald-500/30">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl">
                            <Icon name="BookOpen" size={24} />
                        </div>
                        <h3 className="font-black text-lg">Now Learning</h3>
                    </div>
                    {currentRead ? (
                        <div className="bg-base-100 p-6 rounded-3xl border border-base-300/50 flex-1">
                            <p className="text-[10px] font-black uppercase text-emerald-500 mb-2">{currentRead.type}</p>
                            <h4 className="text-xl font-black text-base-content mb-1">{currentRead.title}</h4>
                            <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">{currentRead.author}</p>
                        </div>
                    ) : (
                        <p className="text-slate-500 font-bold text-sm italic flex-1 flex items-center justify-center text-center">Start a new resource</p>
                    )}
                </div>
            </div>
        </PageContainer>
    );
};

export default Knowledge;
