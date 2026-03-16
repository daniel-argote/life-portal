import { useEffect } from 'react';

const PageContainer = ({ children, className = "" }) => {
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    return (
        <div className={`space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both ${className}`}>
            {children}
        </div>
    );
};

export default PageContainer;
