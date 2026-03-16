export const getWeatherIcon = (code) => {
    if (code === 0) return 'Sun';
    if (code >= 1 && code <= 3) return 'CloudSun';
    if (code >= 45 && code <= 48) return 'CloudFog';
    if (code >= 51 && code <= 67) return 'CloudRain';
    if (code >= 71 && code <= 77) return 'CloudSnow';
    if (code >= 80 && code <= 82) return 'CloudRainWind';
    if (code >= 85 && code <= 86) return 'CloudSnow';
    if (code >= 95) return 'CloudLightning';
    return 'Cloud';
};
