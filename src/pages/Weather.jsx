import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { format } from 'date-fns';
import Icon from '../components/Icon';
import EditableHeader from '../components/EditableHeader';

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

const Weather = ({ user, notify, pageName, setPageName, showHeaders, config }) => {
    const [locations, setLocations] = useState([]);
    const [search, setSearch] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [forecast, setForecast] = useState(null);
    const [loading, setLoading] = useState(false);

    const unit = config?.weatherUnit || 'fahrenheit';

    const fetchLocations = useCallback(async () => {
        if (!user) return;
        const { data, error } = await supabase
            .from('weather_locations')
            .select('*')
            .order('created_at', { ascending: true });
        
        if (!error) {
            setLocations(data || []);
            if (data?.length > 0 && !selectedLocation) {
                setSelectedLocation(data[0]);
            }
        }
    }, [user, selectedLocation]);

    const fetchForecast = useCallback(async (loc) => {
        if (!loc) return;
        setLoading(true);
        try {
            const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto&temperature_unit=${unit}`);
            const data = await res.json();
            setForecast(data);
        } catch (e) {
            console.error(e);
            if (notify) notify('Failed to fetch forecast', 'error');
        }
        setLoading(false);
    }, [notify, unit]);

    useEffect(() => {
        fetchLocations();
    }, [fetchLocations]);

    useEffect(() => {
        if (selectedLocation) fetchForecast(selectedLocation);
    }, [selectedLocation, fetchForecast]);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!search.trim()) return;
        try {
            const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(search)}&count=5&language=en&format=json`);
            const data = await res.json();
            setSearchResults(data.results || []);
        } catch (e) {
            console.error(e);
        }
    };

    const addLocation = async (result) => {
        if (locations.length >= 10) {
            if (notify) notify('Maximum 10 locations allowed', 'error');
            return;
        }
        const newLoc = {
            user_id: user.id,
            name: `${result.name}, ${result.admin1 || result.country}`,
            latitude: result.latitude,
            longitude: result.longitude,
            is_primary: locations.length < 2
        };
        const { error } = await supabase.from('weather_locations').insert([newLoc]);
        if (!error) {
            setSearch('');
            setSearchResults([]);
            fetchLocations();
            if (notify) notify('Location added');
        }
    };

    const deleteLocation = async (id) => {
        const { error } = await supabase.from('weather_locations').delete().eq('id', id);
        if (!error) {
            if (selectedLocation?.id === id) setSelectedLocation(null);
            fetchLocations();
            if (notify) notify('Location removed');
        }
    };

    const togglePrimary = async (loc) => {
        const primaryCount = locations.filter(l => l.is_primary).length;
        if (!loc.is_primary && primaryCount >= 2) {
            if (notify) notify('Max 2 primary locations allowed', 'error');
            return;
        }
        const { error } = await supabase.from('weather_locations').update({ is_primary: !loc.is_primary }).eq('id', loc.id);
        if (!error) fetchLocations();
    };

    return (
        <div className="space-y-8 pb-20">
            {showHeaders && (
                <EditableHeader 
                    value={pageName} 
                    onSave={setPageName} 
                    subtext="Global Forecasts" 
                />
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Location List & Search */}
                <div className="space-y-6">
                    <div className="bg-base-200 p-6 rounded-[2.5rem] border border-base-300 shadow-sm space-y-4">
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 ml-2">Locales</h3>
                        <div className="space-y-2">
                            {locations.map(loc => (
                                <div 
                                    key={loc.id} 
                                    onClick={() => setSelectedLocation(loc)}
                                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer group flex items-center justify-between
                                        ${selectedLocation?.id === loc.id ? 'bg-primary/10 border-primary text-primary' : 'bg-base-100 border-transparent text-base-content hover:border-primary/30'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); togglePrimary(loc); }}
                                            className={`p-1.5 rounded-lg transition-colors ${loc.is_primary ? 'bg-primary text-primary-content' : 'bg-base-200 text-slate-300 hover:text-primary'}`}
                                            title="Show on Dashboard"
                                        >
                                            <Icon name="LayoutDashboard" size={14} />
                                        </button>
                                        <span className="font-bold truncate max-w-[120px]">{loc.name}</span>
                                    </div>
                                    <button onClick={(e) => { e.stopPropagation(); deleteLocation(loc.id); }} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-danger p-1">
                                        <Icon name="Trash2" size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <form onSubmit={handleSearch} className="relative mt-6">
                            <input 
                                placeholder="Search city..." 
                                className="w-full bg-base-100 p-4 pr-12 rounded-xl font-bold outline-none border-2 border-transparent focus:border-primary transition-all"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                            <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary">
                                <Icon name="Search" size={20} />
                            </button>
                        </form>

                        {searchResults.length > 0 && (
                            <div className="bg-base-100 border border-base-300 rounded-xl overflow-hidden mt-2 divide-y divide-base-300">
                                {searchResults.map(res => (
                                    <button 
                                        key={`${res.latitude}-${res.longitude}`}
                                        onClick={() => addLocation(res)}
                                        className="w-full p-4 text-left hover:bg-primary/5 font-bold text-sm transition-colors flex justify-between items-center group"
                                    >
                                        <span>{res.name}, {res.admin1 || res.country}</span>
                                        <Icon name="Plus" size={16} className="text-slate-300 group-hover:text-primary" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Selected Location Detail */}
                <div className="lg:col-span-2 space-y-6">
                    {selectedLocation ? (
                        <div className="bg-base-200 p-10 rounded-[3rem] border border-base-300 shadow-sm relative overflow-hidden">
                            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                                <div>
                                    <h3 className="text-4xl font-black text-base-content tracking-tighter">{selectedLocation.name}</h3>
                                    <p className="text-sm font-bold text-slate-400 mt-1">Current Conditions</p>
                                </div>
                                {forecast && (
                                    <div className="flex items-center gap-6">
                                        <div className="text-right">
                                            <div className="text-6xl font-black text-primary leading-none">
                                                {Math.round(forecast.current_weather.temperature)}°
                                            </div>
                                            <p className="text-xs font-black uppercase tracking-widest text-slate-400 mt-2">
                                                {unit.charAt(0).toUpperCase() + unit.slice(1)}
                                            </p>
                                        </div>
                                        <div className="bg-primary/10 p-6 rounded-[2rem] text-primary">
                                            <Icon name={getWeatherIcon(forecast.current_weather.weathercode)} size={48} strokeWidth={2.5} />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {forecast && (
                                <div className="mt-12 pt-12 border-t border-base-300/50">
                                    <div className="flex justify-between items-center mb-6">
                                        <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">7-Day Forecast</h4>
                                        <a href="https://open-meteo.com/" target="_blank" rel="noreferrer" className="text-[10px] font-bold text-primary hover:underline">Weather data by Open-Meteo</a>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-4">
                                        {forecast.daily.time.map((date, i) => (
                                            <div key={date} className="bg-base-100/50 p-4 rounded-2xl flex flex-col items-center text-center group hover:bg-base-100 transition-colors border border-transparent hover:border-primary/20">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-3">
                                                    {i === 0 ? 'Today' : format(new Date(date.replace(/-/g, '\/')), 'EEE')}
                                                </p>
                                                <Icon name={getWeatherIcon(forecast.daily.weathercode[i])} size={24} className="text-primary mb-3" />
                                                <div className="space-y-0.5">
                                                    <p className="text-sm font-black text-base-content">{Math.round(forecast.daily.temperature_2m_max[i])}°</p>
                                                    <p className="text-[10px] font-bold text-slate-400">{Math.round(forecast.daily.temperature_2m_min[i])}°</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-base-200 p-20 rounded-[3rem] border border-base-300 border-dashed flex flex-col items-center text-center">
                            <div className="w-20 h-20 rounded-[2rem] bg-base-300 flex items-center justify-center text-slate-400 mb-6">
                                <Icon name="CloudSun" size={40} />
                            </div>
                            <h3 className="text-xl font-black text-base-content mb-2">No Locale Selected</h3>
                            <p className="text-sm font-bold text-slate-400 max-w-xs">Select or search for a location to view the forecast.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Weather;