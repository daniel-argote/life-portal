import Icon from './Icon';

export const MotorcycleIcon = ({ style, className = "w-16 h-16" }) => {
    const stroke = "currentColor";
    const sw = 2;

    const base = (
        <g>
            <circle cx="5" cy="18" r="4" />
            <circle cx="19" cy="18" r="4" />
        </g>
    );

    if (style === 'adventure') {
        return (
            <svg viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" className={className}>
                {base}
                <path d="M5 18l3-9h8l3 9" />
                <path d="M8 9l-1-4h2" />
                <path d="M11 9h5l1 3h-7z" />
                <path d="M16 9l2 4" />
            </svg>
        );
    }
    if (style === 'cruiser') {
        return (
            <svg viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" className={className}>
                <circle cx="5" cy="18" r="4" />
                <circle cx="20" cy="18" r="4" />
                <path d="M5 18l5-6h6l4 6" />
                <path d="M10 12l-2-4" />
                <path d="M11 12c0-2 4-2 5 0v2h-5v-2z" />
            </svg>
        );
    }
    if (style === 'sportbike') {
        return (
            <svg viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" className={className}>
                {base}
                <path d="M5 18l4-10h7l3 10" />
                <path d="M9 8c-1 0-2 2-2 4s1 3 3 3h6l2-7H9z" />
                <path d="M10 8l-1-2" />
            </svg>
        );
    }
    if (style === 'dirtbike') {
        return (
            <svg viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" className={className}>
                <circle cx="5" cy="18" r="3" />
                <circle cx="19" cy="18" r="3" />
                <path d="M5 18l4-11h6l4 11" />
                <path d="M4 14h3" />
                <path d="M9 7l-1-3" />
                <path d="M9 7h6l1 2h-7z" />
            </svg>
        );
    }
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" className={className}>
            {base}
            <path d="M5 18l4-8h7l3 8" />
            <path d="M9 10l-1-3" />
            <path d="M10 10h6v2h-6z" />
        </svg>
    );
};

export const VehiclePlaceholder = ({ category, style }) => {
    if (category === 'truck') return <Icon name="Truck" size={64} strokeWidth={1} />;
    if (category === 'motorcycle') return <MotorcycleIcon style={style} />;
    return <Icon name="Car" size={64} strokeWidth={1} />;
};
