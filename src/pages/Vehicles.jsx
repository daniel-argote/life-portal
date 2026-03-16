import Icon from '../components/Icon';
import PageContainer from '../components/PageContainer';

const Vehicles = () => {
    return (
        <PageContainer>
            <div className="bg-primary/5 border border-primary/10 p-10 rounded-[3rem] text-center mb-10">
                <Icon name="CarFront" size={48} className="text-primary/20 mx-auto mb-4" />
                <h4 className="text-2xl font-black text-base-content mb-2">Welcome to your Vehicle Hub</h4>
                <p className="text-slate-600 font-bold max-w-md mx-auto">
                    Keep your vehicles in peak condition. Track every oil change, repair, and upgrade in one place.
                </p>
            </div>
        </PageContainer>
    );
};

export default Vehicles;
