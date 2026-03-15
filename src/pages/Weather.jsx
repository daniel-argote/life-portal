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
    const [forecasts, setForecasts] = useState({});
    const [loading, setLoading] = useState(false);

    const unit = config?.weatherUnit || 'fahrenheit';

    const fetchForecasts = useCallback(async (locs) => {
        if (!locs || locs.length === 0) return;
        setLoading(true);
        try {
            const promises = locs.map(async (loc) => {
                const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto&temperature_unit=${unit}`);
                const data = await res.json();
                return { id: loc.id, data };
            });
            const results = await Promise.all(promises);
            const newForecasts = {};
            results.forEach(r => { newForecasts[r.id] = r.data; });
            setForecasts(newForecasts);
        } catch (e) {
            console.error(e);
            if (notify) notify('Failed to fetch forecasts', 'error');
        }
        setLoading(false);
    }, [notify, unit]);

    const fetchLocations = useCallback(async () => {
        if (!user) return;
        const { data, error } = await supabase
            .from('weather_locations')
            .select('*')
            .order('created_at', { ascending: true });
        
        if (!error) {
            setLocations(data || []);
            if (data?.length > 0) {
                fetchForecasts(data);
                if (!selectedLocation) setSelectedLocation(data[0]);
            }
        }
    }, [user, selectedLocation, fetchForecasts]);

    useEffect(() => {
        fetchLocations();
    }, [user]); // Only fetch on mount or user change

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
                    subtext="Atmospheric Intelligence" 
                />
            )}

            {/* Locations Dashboard Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {locations.map(loc => {
                    const forecast = forecasts[loc.id];
                    const isSelected = selectedLocation?.id === loc.id;
                    
                    return (
                        <div 
                            key={loc.id}
                            onClick={() => setSelectedLocation(loc)}
                            className={`bg-base-200 p-6 rounded-[2.5rem] border-2 transition-all cursor-pointer relative overflow-hidden group
                                ${isSelected ? 'border-primary shadow-xl scale-[1.02]' : 'border-transparent hover:border-primary/20 shadow-sm'}`}
                        >
                            {/* Card Background Decoration */}
                            <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <Icon name={forecast ? getWeatherIcon(forecast.current_weather.weathercode) : 'Cloud'} size={120} />
                            </div>

                            <div className="relative z-10 space-y-4">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <h3 className="text-2xl font-black text-base-content tracking-tighter truncate pr-2">{loc.name}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); togglePrimary(loc); }}
                                                className={`p-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${loc.is_primary ? 'bg-primary text-primary-content' : 'bg-base-300 text-slate-400 hover:text-primary'}`}
                                            >
                                                <Icon name="LayoutDashboard" size={12} />
                                                <span className="text-[10px] font-black uppercase tracking-widest">{loc.is_primary ? 'Primary' : 'Set Primary'}</span>
                                            </button>
                                        </div>
                                    </div>
                                    {forecast && (
                                        <div className="bg-primary/10 p-4 rounded-2xl text-primary">
                                            <Icon name={getWeatherIcon(forecast.current_weather.weathercode)} size={32} />
                                        </div>
                                    )}
                                </div>

                                {forecast ? (
                                    <div className="flex items-end justify-between pt-2">
                                        <div>
                                            <div className="text-5xl font-black text-primary leading-none">
                                                {Math.round(forecast.current_weather.temperature)}°
                                            </div>
                                            <div className="flex gap-2 mt-2">
                                                <span className="text-xs font-black text-slate-400">H: {Math.round(forecast.daily.temperature_2m_max[0])}°</span>
                                                <span className="text-xs font-black text-slate-400 text-opacity-50">L: {Math.round(forecast.daily.temperature_2m_min[0])}°</span>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); deleteLocation(loc.id); }}
                                            className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-danger transition-all rounded-xl hover:bg-danger/10"
                                        >
                                            <Icon name="Trash2" size={18} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="h-16 flex items-center justify-center">
                                        <div className="animate-pulse text-slate-300 font-black text-xs uppercase tracking-widest">Updating...</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}

                {/* Add New Location Card */}
                <div className="bg-base-200/50 p-6 rounded-[2.5rem] border-2 border-dashed border-base-300 flex flex-col justify-center gap-4">
                    <form onSubmit={handleSearch} className="relative">
                        <input 
                            placeholder="Add city..." 
                            className="w-full bg-base-100 p-4 pr-12 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-primary transition-all text-sm"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                        <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary">
                            <Icon name="Search" size={18} />
                        </button>
                    </form>

                    {searchResults.length > 0 ? (
                        <div className="bg-base-100 border border-base-300 rounded-2xl overflow-hidden divide-y divide-base-300">
                            {searchResults.map(res => (
                                <button 
                                    key={`${res.latitude}-${res.longitude}`}
                                    onClick={() => addLocation(res)}
                                    className="w-full p-3 text-left hover:bg-primary/5 font-bold text-xs transition-colors flex justify-between items-center group"
                                >
                                    <span>{res.name}, {res.admin1 || res.country}</span>
                                    <Icon name="Plus" size={14} className="text-slate-300 group-hover:text-primary" />
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-2">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Search to add more</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Detailed Forecast for Selected Location */}
            {selectedLocation && forecasts[selectedLocation.id] && (
                <div className="fade-in bg-base-200 p-10 rounded-[3rem] border border-base-300 shadow-sm relative overflow-hidden animate-in slide-in-from-bottom duration-500">
                    <div className="flex justify-between items-center mb-10">
                        <div className="space-y-1">
                            <h4 className="text-xs font-black uppercase tracking-widest text-primary">Strategic 7-Day Outlook</h4>
                            <h3 className="text-3xl font-black text-base-content">{selectedLocation.name}</h3>
                        </div>
                        <a href="https://open-meteo.com/" target="_blank" rel="noreferrer" className="text-[10px] font-bold text-slate-400 hover:text-primary transition-colors">Data: Open-Meteo</a>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-4">
                        {forecasts[selectedLocation.id].daily.time.map((date, i) => (
                            <div key={date} className="bg-base-100/50 p-6 rounded-3xl flex flex-col items-center text-center group hover:bg-base-100 transition-all border border-transparent hover:border-primary/20 shadow-sm">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-4">
                                    {i === 0 ? 'Today' : format(new Date(date.replace(/-/g, '\/')), 'EEE')}
                                </p>
                                <Icon name={getWeatherIcon(forecasts[selectedLocation.id].daily.weathercode[i])} size={32} className="text-primary mb-4" />
                                <div className="space-y-1">
                                    <p className="text-lg font-black text-base-content leading-none">{Math.round(forecasts[selectedLocation.id].daily.temperature_2m_max[i])}°</p>
                                    <p className="text-[10px] font-bold text-slate-400">{Math.round(forecasts[selectedLocation.id].daily.temperature_2m_min[i])}°</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Weather;