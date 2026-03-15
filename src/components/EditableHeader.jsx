import { useState, useEffect } from 'react';
import Icon from './Icon';

const EditableHeader = ({ value, subtext, onSave, className }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [tempValue, setTempValue] = useState(value);

    // Sync temp value if external value changes
    useEffect(() => {
        setTempValue(value);
    }, [value]);

    const handleSave = () => {
        if (tempValue.trim()) {
            onSave(tempValue.trim());
        } else {
            setTempValue(value);
        }
        setIsEditing(false);
    };

    if (isEditing) {
        return (
            <div className={`fade-in ${className}`}>
                <div className="flex items-center gap-4">
                    <input
                        autoFocus
                        value={tempValue}
                        onChange={(e) => setTempValue(e.target.value)}
                        onBlur={handleSave}
                        onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                        className="text-5xl font-black tracking-tighter bg-transparent border-b-4 border-primary outline-none dark:text-white w-full max-w-lg"
                    />
                </div>
                {subtext && <p className="text-slate-600 font-bold mt-2 uppercase tracking-widest text-[10px]">{subtext}</p>}
            </div>
        );
    }

    return (
        <header className={className}>
            <div className="flex items-center gap-4">
                <h2 className="text-5xl font-black tracking-tighter dark:text-white">{value}</h2>
                <button 
                    onClick={() => setIsEditing(true)}
                    className="p-3 bg-base-300/30 hover:bg-primary hover:text-primary-content rounded-2xl text-base-content/20 transition-all active:scale-95"
                    title="Rename"
                >
                    <Icon name="Pencil" size={20} />
                </button>
            </div>
            {subtext && <p className="text-slate-600 font-bold mt-2 uppercase tracking-widest text-[10px]">{subtext}</p>}
        </header>
    );
};

export default EditableHeader;