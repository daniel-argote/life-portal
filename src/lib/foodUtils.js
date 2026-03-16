export const scaleAmount = (amountStr, multiplier) => {
    if (!amountStr || multiplier === 1) return amountStr;
    
    const parseValue = (str) => {
        str = str.toString().trim();
        const parts = str.split(/[\s-]|and/).filter(p => p.trim());
        
        let total = 0;
        let hasValue = false;

        for (const part of parts) {
            if (part.includes('/')) {
                const [num, den] = part.split('/').map(Number);
                if (!isNaN(num) && !isNaN(den) && den !== 0) {
                    total += num / den;
                    hasValue = true;
                }
            } else {
                const num = Number(part);
                if (!isNaN(num)) {
                    total += num;
                    hasValue = true;
                }
            }
        }
        return hasValue ? total : NaN;
    };

    const val = parseValue(amountStr);
    if (isNaN(val)) return amountStr;

    const result = val * multiplier;
    
    if (result % 1 === 0) return result.toString();
    
    const whole = Math.floor(result);
    const frac = result - whole;
    
    let fracStr = '';
    const tolerance = 0.01;
    if (Math.abs(frac - 0.5) < tolerance) fracStr = '1/2';
    else if (Math.abs(frac - 0.25) < tolerance) fracStr = '1/4';
    else if (Math.abs(frac - 0.75) < tolerance) fracStr = '3/4';
    else if (Math.abs(frac - 0.333) < 0.02) fracStr = '1/3';
    else if (Math.abs(frac - 0.666) < 0.02) fracStr = '2/3';
    else if (Math.abs(frac - 0.125) < tolerance) fracStr = '1/8';
    else fracStr = frac.toFixed(2).replace(/^0/, '');

    if (whole === 0) return fracStr;
    return `${whole} ${fracStr}`;
};
