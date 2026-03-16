import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import Icon from '../components/Icon';
import { format, startOfWeek, addDays, eachDayOfInterval } from 'date-fns';
import PageContainer from '../components/PageContainer';

const FoodPlanner = ({ user, notify }) => {
    const [mealPlan, setMealPlan] = useState([]);
    const [recipes, setRecipes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editingDay, setEditingDay] = useState(null);
    const [form, setForm] = useState({ meal_type: 'Dinner', recipe_id: '', note: '' });

    const fetchData = useCallback(async () => {
        if (!user) return;
        const { data: plan } = await supabase.from('meal_plan').select('*, recipes(title)').order('day_date', { ascending: true });
        setMealPlan(plan || []);
        const { data: recs } = await supabase.from('recipes').select('*').order('title', { ascending: true });
        setRecipes(recs || []);
    }, [user]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        const { error } = await supabase.from('meal_plan').insert([{
            ...form,
            day_date: format(editingDay, 'yyyy-MM-dd'),
            recipe_id: form.recipe_id || null,
            user_id: user.id
        }]);
        
        if (!error) {
            setEditingDay(null);
            setForm({ meal_type: 'Dinner', recipe_id: '', note: '' });
            fetchData();
            if (notify) notify('Meal planned');
        }
        setLoading(false);
    };

    const deleteMeal = async (id) => {
        const { error } = await supabase.from('meal_plan').delete().eq('id', id);
        if (!error) fetchData();
    };

    const start = startOfWeek(new Date());
    const days = eachDayOfInterval({ start, end: addDays(start, 6) });

    return (
        <PageContainer>
            <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                {days.map(day => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const plannedMeals = mealPlan.filter(m => m.day_date === dateStr);
                    
                    return (
                        <div key={dateStr} className="bg-base-200 rounded-3xl border border-base-300 p-4 flex flex-col min-h-[200px]">
                            <header className="text-center border-b border-base-300 pb-2 mb-3">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">{format(day, 'EEE')}</p>
                                <p className="text-lg font-black text-base-content">{format(day, 'd')}</p>
                            </header>
                            
                            <div className="flex-1 space-y-2">
                                {plannedMeals.map(m => (
                                    <div key={m.id} className="bg-primary/5 border border-primary/10 p-2 rounded-xl relative group/meal">
                                        <p className="text-[8px] font-black uppercase text-primary/60">{m.meal_type}</p>
                                        <p className="text-[10px] font-bold text-base-content truncate">{m.recipes?.title || m.note}</p>
                                        <button onClick={() => deleteMeal(m.id)} className="absolute -top-1 -right-1 bg-danger text-white rounded-full p-0.5 opacity-0 group-hover/meal:opacity-100 transition-opacity shadow-sm">
                                            <Icon name="X" size={10} />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <button 
                                onClick={() => setEditingDay(day)}
                                className="mt-3 w-full py-2 rounded-xl border-2 border-dashed border-base-300 text-slate-600 hover:border-primary hover:text-primary transition-all flex items-center justify-center"
                            >
                                <Icon name="Plus" size={14} />
                            </button>
                        </div>
                    );
                })}
            </div>

            {editingDay && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
                    <form onSubmit={handleSave} className="bg-base-200 w-full max-w-md p-8 rounded-[2.5rem] border border-base-300 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
                        <h3 className="text-2xl font-black text-base-content mb-6">Plan for {format(editingDay, 'EEEE, MMM do')}</h3>
                        
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-600 mb-2 ml-2">Meal Type</label>
                            <select 
                                className="w-full bg-base-100 p-4 rounded-xl font-bold outline-none"
                                value={form.meal_type}
                                onChange={e => setForm({...form, meal_type: e.target.value})}
                            >
                                <option>Breakfast</option>
                                <option>Lunch</option>
                                <option>Dinner</option>
                                <option>Snack</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-600 mb-2 ml-2">Recipe Link (Optional)</label>
                            <select 
                                className="w-full bg-base-100 p-4 rounded-xl font-bold outline-none"
                                value={form.recipe_id}
                                onChange={e => {
                                    const r = recipes.find(rec => rec.id === e.target.value);
                                    setForm({...form, recipe_id: e.target.value, note: r ? r.title : ''});
                                }}
                            >
                                <option value="">No recipe linked</option>
                                {recipes.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
                            </select>
                        </div>

                        {!form.recipe_id && (
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-600 mb-2 ml-2">Quick Note</label>
                                <input 
                                    placeholder="e.g. Pizza Night"
                                    className="w-full bg-base-100 p-4 rounded-xl font-bold outline-none border-2 border-transparent focus:border-primary"
                                    value={form.note}
                                    onChange={e => setForm({...form, note: e.target.value})}
                                />
                            </div>
                        )}

                        <div className="flex gap-3 pt-4">
                            <button type="button" onClick={() => setEditingDay(null)} className="flex-1 py-4 font-bold text-slate-600 hover:bg-base-300 rounded-xl transition-colors">Cancel</button>
                            <button disabled={loading} className="flex-[2] bg-primary text-primary-content py-4 rounded-xl font-black shadow-lg">Plan Meal</button>
                        </div>
                    </form>
                </div>
            )}
        </PageContainer>
    );
};

export default FoodPlanner;
