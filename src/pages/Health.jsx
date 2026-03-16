import Icon from '../components/Icon';
import PageContainer from '../components/PageContainer';

const Health = () => {
    return (
        <PageContainer>
            <div className="bg-primary/5 border border-primary/10 p-10 rounded-[3rem] text-center mb-10">
                <Icon name="Heart" size={48} className="text-primary/20 mx-auto mb-4" />
                <h4 className="text-2xl font-black text-base-content mb-2">Welcome to your Health Hub</h4>
                <p className="text-slate-600 font-bold max-w-md mx-auto">
                    A centralized place to monitor your physical well-being and stay on top of your medical schedule.
                </p>
            </div>
        </PageContainer>
    );
};

export default Health;
