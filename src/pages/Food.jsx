import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import Icon from '../components/Icon';
import EditableHeader from '../components/EditableHeader';
import { format, startOfWeek, addDays, eachDayOfInterval, isWithinInterval, startOfDay, endOfDay } from 'date-fns';

const Food = ({ user, notify, pageName, setPageName, showHeaders }) => {
    const [activeTab, setActiveTab] = useState('journal');
    const [loading, setLoading] = useState(false);

    // Data State
    const [journalItems, setJournalItems] = useState([]);
    const [recipes, setRecipes] = useState([]);
    const [mealPlan, setMealPlan] = useState([]);
    const [ingredientLibrary, setIngredientLibrary] = useState([]);
    const [inventory, setInventory] = useState([]);

    // --- Data Fetching ---

    const fetchData = useCallback(async () => {
        if (!user) return;
        
        // Fetch Journal
        const { data: journal } = await supabase.from('food').select('*').order('created_at', { ascending: false });
        setJournalItems(journal || []);

        // Fetch Recipes
        const { data: recs } = await supabase.from('recipes').select('*').order('title', { ascending: true });
        setRecipes(recs || []);

        // Fetch Meal Plan
        const { data: plan } = await supabase.from('meal_plan').select('*, recipes(title)').order('day_date', { ascending: true });
        setMealPlan(plan || []);

        // Fetch Ingredient Library
        const { data: lib } = await supabase.from('ingredients_library').select('*').order('name', { ascending: true });
        setIngredientLibrary(lib || []);

        // Fetch Inventory
        const { data: inv } = await supabase.from('food_inventory').select('*').order('category', { ascending: true });
        setInventory(inv || []);
    }, [user]);

    useEffect(() => { fetchData(); }, [fetchData]);

    // --- Utils ---
    const scaleAmount = (amountStr, multiplier) => {
        if (!amountStr || multiplier === 1) return amountStr;
        
        const parseValue = (str) => {
            str = str.toString().trim();
            const parts = str.split(/[\s\-]|and/).filter(p => p.trim());
            
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

    // --- Sub-Components ---

    const JournalTab = () => {
        const [form, setForm] = useState({ meal: 'Breakfast', content: '', calories: '', is_home_cooked: false });

        const handleSubmit = async (e) => {
            e.preventDefault();
            if (!form.content) return;
            setLoading(true);
            const { error } = await supabase.from('food').insert([{ 
                ...form,
                calories: form.calories ? parseInt(form.calories) : null,
                user_id: user.id 
            }]);
            
            if (!error) {
                setForm({ meal: 'Breakfast', content: '', calories: '', is_home_cooked: false });
                fetchData();
                if (notify) notify('Food record saved');
            }
            setLoading(false);
        };

        const deleteItem = async (id) => {
            const { error } = await supabase.from('food').delete().eq('id', id);
            if (!error) { fetchData(); if (notify) notify('Record deleted'); }
        };

        // Stats for current week
        const start = startOfWeek(new Date());
        const end = addDays(start, 6);
        const weekMeals = journalItems.filter(item => {
            const d = new Date(item.created_at);
            return isWithinInterval(d, { start: startOfDay(start), end: endOfDay(end) });
        });
        const homeCookedCount = weekMeals.filter(m => m.is_home_cooked).length;

        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                        <form onSubmit={handleSubmit} className="bg-base-200 p-6 rounded-[2rem] border border-base-300 shadow-sm flex flex-col gap-4">
                            <div className="flex flex-col md:flex-row gap-4">
                                <select
                                    className="bg-base-100 p-4 rounded-xl font-bold outline-none text-base-content min-w-[140px]"
                                    value={form.meal}
                                    onChange={e => setForm({ ...form, meal: e.target.value })}
                                >
                                    <option>Breakfast</option>
                                    <option>Lunch</option>
                                    <option>Dinner</option>
                                    <option>Snack</option>
                                    <option>Drink</option>
                                </select>
                                <input
                                    type="text"
                                    placeholder="What did you eat?"
                                    className="flex-1 bg-base-100 p-4 rounded-xl font-bold outline-none text-base-content border-2 border-transparent focus:border-primary transition-all"
                                    value={form.content}
                                    onChange={e => setForm({ ...form, content: e.target.value })}
                                />
                                <input
                                    type="number"
                                    placeholder="kcal"
                                    className="w-full md:w-32 bg-base-100 p-4 rounded-xl font-bold outline-none text-base-content border-2 border-transparent focus:border-primary transition-all"
                                    value={form.calories}
                                    onChange={e => setForm({ ...form, calories: e.target.value })}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <button 
                                    type="button"
                                    onClick={() => setForm({...form, is_home_cooked: !form.is_home_cooked})}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all border-2
                                        ${form.is_home_cooked ? 'bg-primary/10 border-primary text-primary' : 'bg-base-100 border-transparent text-slate-600'}`}
                                >
                                    <Icon name="Flame" size={18} />
                                    Home Cooked
                                </button>
                                <button disabled={loading} className="bg-primary text-primary-content p-4 rounded-xl font-bold shadow-lg hover:scale-105 transition-transform disabled:opacity-50">
                                    <Icon name="Plus" size={24} />
                                </button>
                            </div>
                        </form>
                    </div>
                    <div className="bg-primary/5 border border-primary/10 p-8 rounded-[2rem] flex flex-col items-center justify-center text-center">
                        <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">Home Cooked This Week</p>
                        <div className="text-6xl font-black text-primary">{homeCookedCount}</div>
                        <p className="text-xs font-bold text-slate-600 mt-2">Meals prepared with care</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {journalItems.map(item => (
                        <div key={item.id} className="bg-base-200 p-6 rounded-[2rem] border border-base-300 flex justify-between items-center group shadow-sm transition-all hover:border-primary/30">
                            <div className="flex-1">
                                <div className="flex justify-between items-start mb-1">
                                    <div className="flex items-center gap-2">
                                        <p className="text-xs font-black text-slate-600 uppercase tracking-widest">{item.meal}</p>
                                        {item.is_home_cooked && <Icon name="Flame" size={12} className="text-primary" />}
                                    </div>
                                    {item.calories && <p className="text-xs font-black text-primary uppercase tracking-widest">{item.calories} kcal</p>}
                                </div>
                                <p className="text-xl font-bold text-base-content">{item.content}</p>
                                <p className="text-[10px] font-bold text-slate-600 mt-2">{new Date(item.created_at).toLocaleDateString()} {new Date(item.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                            </div>
                            <button onClick={() => deleteItem(item.id)} className="text-slate-600 hover:text-danger opacity-0 group-hover:opacity-100 transition-all ml-4 p-2">
                                <Icon name="Trash2" size={20} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const InventoryTab = () => {
        const [showAdd, setShowAdd] = useState(false);
        const [form, setForm] = useState({ item_name: '', quantity: '', unit: 'unit', category: 'Pantry' });
        const CATEGORIES = ['Produce', 'Dairy', 'Meat', 'Pantry', 'Freezer', 'Fridge', 'Other'];

        const handleAdd = async (e) => {
            e.preventDefault();
            if (!form.item_name) return;
            setLoading(true);
            const { error } = await supabase.from('food_inventory').insert([{ ...form, user_id: user.id }]);
            if (!error) {
                setForm({ item_name: '', quantity: '', unit: 'unit', category: 'Pantry' });
                setShowAdd(false);
                fetchData();
                if (notify) notify('Inventory updated');
            }
            setLoading(false);
        };

        const deleteItem = async (id) => {
            const { error } = await supabase.from('food_inventory').delete().eq('id', id);
            if (!error) { fetchData(); if (notify) notify('Item removed'); }
        };

        return (
            <div className="space-y-6 animate-in fade-in duration-500">
                <div className="flex justify-between items-center">
                    <h3 className="text-2xl font-black text-base-content">Kitchen Inventory</h3>
                    <button onClick={() => setShowAdd(!showAdd)} className="bg-primary/10 text-primary px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-primary hover:text-primary-content transition-all">
                        <Icon name={showAdd ? "X" : "Plus"} size={18} />
                        {showAdd ? "Cancel" : "Add Item"}
                    </button>
                </div>

                {showAdd && (
                    <form onSubmit={handleAdd} className="bg-base-200 p-8 rounded-[2.5rem] border border-base-300 shadow-xl space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input placeholder="Item Name" className="w-full bg-base-100 p-4 rounded-xl font-bold outline-none border-2 border-transparent focus:border-primary" value={form.item_name} onChange={e => setForm({...form, item_name: e.target.value})} />
                            <select className="w-full bg-base-100 p-4 rounded-xl font-bold outline-none border-2 border-transparent focus:border-primary" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <input placeholder="Quantity (e.g. 2, 1/2)" className="w-full bg-base-100 p-4 rounded-xl font-bold outline-none border-2 border-transparent focus:border-primary" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} />
                            <input placeholder="Unit (e.g. lbs, boxes)" className="w-full bg-base-100 p-4 rounded-xl font-bold outline-none border-2 border-transparent focus:border-primary" value={form.unit} onChange={e => setForm({...form, unit: e.target.value})} />
                        </div>
                        <button disabled={loading} className="w-full bg-primary text-primary-content py-4 rounded-xl font-black shadow-lg">Save to Inventory</button>
                    </form>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {CATEGORIES.map(cat => {
                        const items = inventory.filter(i => i.category === cat);
                        if (items.length === 0) return null;
                        return (
                            <div key={cat} className="bg-base-200 p-6 rounded-[2rem] border border-base-300 shadow-sm">
                                <h4 className="text-xs font-black uppercase tracking-widest text-primary mb-4 ml-2">{cat}</h4>
                                <div className="space-y-2">
                                    {items.map(item => (
                                        <div key={item.id} className="bg-base-100/50 p-4 rounded-2xl flex justify-between items-center group transition-all hover:bg-base-100">
                                            <div>
                                                <p className="font-bold text-base-content">{item.item_name}</p>
                                                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{item.quantity} {item.unit}</p>
                                            </div>
                                            <button onClick={() => deleteItem(item.id)} className="text-slate-600 hover:text-danger opacity-0 group-hover:opacity-100 transition-all p-2">
                                                <Icon name="Trash2" size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const IngredientsTab = () => {
        const deleteIngredient = async (id) => {
            const { error } = await supabase.from('ingredients_library').delete().eq('id', id);
            if (!error) { fetchData(); if (notify) notify('Ingredient removed'); }
        };

        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h3 className="text-2xl font-black text-base-content">Ingredient Collection</h3>
                    <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">{ingredientLibrary.length} Items</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {ingredientLibrary.map(item => (
                        <div key={item.id} className="bg-base-200 p-4 rounded-2xl border border-base-300 flex justify-between items-center group hover:border-primary/30 transition-all">
                            <div>
                                <p className="font-bold text-base-content">{item.name}</p>
                                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mt-1">Last: {item.last_unit}</p>
                            </div>
                            <button onClick={() => deleteIngredient(item.id)} className="text-slate-600 hover:text-danger opacity-0 group-hover:opacity-100 transition-all p-2">
                                <Icon name="Trash2" size={16} />
                            </button>
                        </div>
                    ))}
                    {ingredientLibrary.length === 0 && (
                        <div className="col-span-full p-12 text-center text-slate-600 font-bold border-2 border-dashed border-base-300 rounded-[2rem]">
                            Your ingredient list is empty. Save a recipe to populate it!
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const RecipesTab = () => {
        const [showForm, setShowForm] = useState(false);
        const [editingId, setEditingId] = useState(null);
        const [recipeMultipliers, setRecipeMultipliers] = useState({});
        const [form, setForm] = useState({ 
            title: '', 
            ingredients: [{ amount: '', unit: 'unit', name: '' }], 
            instructions: [''] 
        });

        const UNITS = ['unit', 'cup', 'oz', 'g', 'ml', 'tsp', 'tbsp', 'lb', 'bunch', 'clove', 'can', 'pinch', 'piece'];

        const handleSave = async (e) => {
            e.preventDefault();
            if (!form.title) return;
            setLoading(true);
            
            const cleanedIngredients = form.ingredients.filter(i => i.name.trim());
            const cleanedInstructions = form.instructions.filter(i => i.trim());

            let error;
            if (editingId) {
                const { error: err } = await supabase.from('recipes').update({ title: form.title, ingredients: cleanedIngredients, instructions: cleanedInstructions }).eq('id', editingId);
                error = err;
            } else {
                const { error: err } = await supabase.from('recipes').insert([{ ...form, ingredients: cleanedIngredients, instructions: cleanedInstructions, user_id: user.id }]);
                error = err;
            }

            if (!error) {
                const libraryItems = cleanedIngredients.map(i => ({ user_id: user.id, name: i.name.trim().toLowerCase(), last_unit: i.unit }));
                if (libraryItems.length > 0) await supabase.from('ingredients_library').upsert(libraryItems, { onConflict: 'user_id,name' });
                resetForm();
                fetchData();
                notify(editingId ? 'Recipe updated' : 'Recipe added to vault');
            }
            setLoading(false);
        };

        const resetForm = () => {
            setForm({ title: '', ingredients: [{ amount: '', unit: 'unit', name: '' }], instructions: [''] });
            setShowForm(false);
            setEditingId(null);
        };

        const startEdit = (recipe) => {
            setForm({ title: recipe.title, ingredients: recipe.ingredients?.length ? recipe.ingredients : [{ amount: '', unit: 'unit', name: '' }], instructions: recipe.instructions?.length ? recipe.instructions : [''] });
            setEditingId(recipe.id);
            setShowForm(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        };

        const updateIngredient = (idx, field, val) => {
            const newIngs = [...form.ingredients];
            newIngs[idx][field] = val;
            setForm({ ...form, ingredients: newIngs });
        };

        const addIngredientRow = () => {
            setForm({ ...form, ingredients: [...form.ingredients, { amount: '', unit: 'unit', name: '' }] });
        };

        const removeIngredientRow = (idx) => {
            if (form.ingredients.length === 1) return;
            setForm({ ...form, ingredients: form.ingredients.filter((_, i) => i !== idx) });
        };

        const updateInstruction = (idx, val) => {
            const newInst = [...form.instructions];
            newInst[idx] = val;
            setForm({ ...form, instructions: newInst });
        };

        const handleInstructionKeyDown = (e, idx) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const newInst = [...form.instructions];
                newInst.splice(idx + 1, 0, '');
                setForm({ ...form, instructions: newInst });
                setTimeout(() => {
                    const inputs = document.querySelectorAll('.instruction-input');
                    inputs[idx + 1]?.focus();
                }, 0);
            } else if (e.key === 'Backspace' && !form.instructions[idx] && form.instructions.length > 1) {
                e.preventDefault();
                const newInst = form.instructions.filter((_, i) => i !== idx);
                setForm({ ...form, instructions: newInst });
                setTimeout(() => {
                    const inputs = document.querySelectorAll('.instruction-input');
                    inputs[Math.max(0, idx - 1)]?.focus();
                }, 0);
            }
        };

        const deleteRecipe = async (id) => {
            const { error } = await supabase.from('recipes').delete().eq('id', id);
            if (!error) { fetchData(); if (notify) notify('Recipe removed'); }
        };

        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h3 className="text-2xl font-black text-base-content">Recipe Vault</h3>
                    {!showForm && (
                        <button onClick={() => setShowForm(true)} className="bg-primary/10 text-primary px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-primary hover:text-primary-content transition-all">
                            <Icon name="Plus" size={18} />
                            New Recipe
                        </button>
                    )}
                </div>

                {showForm && (
                    <form onSubmit={handleSave} className="bg-base-200 p-8 rounded-[2.5rem] border border-base-300 shadow-xl space-y-6 animate-in slide-in-from-top-4 duration-300">
                        <div className="flex justify-between items-center">
                            <h4 className="font-black text-slate-600 uppercase tracking-widest text-xs">{editingId ? 'Editing Recipe' : 'Create New Recipe'}</h4>
                            <button type="button" onClick={resetForm} className="text-slate-600 hover:text-danger p-2"><Icon name="X" size={24} /></button>
                        </div>
                        <input placeholder="Recipe Title" className="w-full bg-base-100 p-4 rounded-xl font-bold outline-none text-2xl border-2 border-transparent focus:border-primary transition-all" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                        <div className="space-y-4">
                            <h4 className="text-xs font-black uppercase tracking-widest text-slate-600 ml-2">Ingredients</h4>
                            {form.ingredients.map((ing, idx) => (
                                <div key={idx} className="flex gap-2">
                                    <input placeholder="Amt" className="w-20 bg-base-100 p-3 rounded-xl font-bold outline-none border-2 border-transparent focus:border-primary" value={ing.amount} onChange={e => updateIngredient(idx, 'amount', e.target.value)} />
                                    <select className="bg-base-100 p-3 rounded-xl font-bold outline-none border-2 border-transparent focus:border-primary" value={ing.unit} onChange={e => updateIngredient(idx, 'unit', e.target.value)}>
                                        {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                                    </select>
                                    <div className="flex-1 relative">
                                        <input list="ingredient-suggestions" placeholder="Ingredient name..." className="w-full bg-base-100 p-3 rounded-xl font-bold outline-none border-2 border-transparent focus:border-primary" value={ing.name} onChange={e => updateIngredient(idx, 'name', e.target.value)} />
                                        <datalist id="ingredient-suggestions">{ingredientLibrary.map(item => <option key={item.id} value={item.name} />)}</datalist>
                                    </div>
                                    <button type="button" onClick={() => removeIngredientRow(idx)} className="p-3 text-slate-500 hover:text-danger"><Icon name="X" size={18} /></button>
                                </div>
                            ))}
                            <button type="button" onClick={addIngredientRow} className="text-primary text-xs font-black uppercase tracking-widest flex items-center gap-2 px-2 hover:opacity-70 transition-opacity"><Icon name="Plus" size={14} /> Add Ingredient</button>
                        </div>
                        <div className="space-y-4">
                            <h4 className="text-xs font-black uppercase tracking-widest text-slate-600 ml-2">Instructions</h4>
                            {form.instructions.map((inst, idx) => (
                                <div key={idx} className="flex gap-4 items-center group">
                                    <span className="text-xl font-black text-primary/30 group-focus-within:text-primary">{idx + 1}.</span>
                                    <input className="flex-1 bg-base-100 p-3 rounded-xl font-bold outline-none border-2 border-transparent focus:border-primary instruction-input" placeholder="Describe the step..." value={inst} onChange={e => updateInstruction(idx, e.target.value)} onKeyDown={e => handleInstructionKeyDown(e, idx)} />
                                </div>
                            ))}
                        </div>
                        <button disabled={loading} className="w-full bg-primary text-primary-content py-4 rounded-xl font-black shadow-lg hover:opacity-90 disabled:opacity-50">{editingId ? 'Update Recipe' : 'Save Recipe'}</button>
                    </form>
                )}

                <div className="grid grid-cols-1 gap-6">
                    {recipes.map(recipe => {
                        const multiplier = recipeMultipliers[recipe.id] || 1;
                        return (
                            <div key={recipe.id} className="bg-base-200 p-8 rounded-[2.5rem] border border-base-300 shadow-sm group">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h4 className="text-3xl font-black text-base-content">{recipe.title}</h4>
                                        <div className="flex gap-2 mt-4">
                                            {[0.5, 1, 2, 3].map(m => (
                                                <button key={m} onClick={() => setRecipeMultipliers({ ...recipeMultipliers, [recipe.id]: m })} className={`px-3 py-1 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all ${multiplier === m ? 'bg-primary text-primary-content' : 'bg-base-300 text-slate-600 hover:bg-primary/20'}`}>{m === 0.5 ? '1/2' : `x${m}`}</button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => startEdit(recipe)} className="text-slate-600 hover:text-primary opacity-0 group-hover:opacity-100 transition-all p-2"><Icon name="Pencil" size={20} /></button>
                                        <button onClick={() => deleteRecipe(recipe.id)} className="text-slate-600 hover:text-danger opacity-0 group-hover:opacity-100 transition-all p-2"><Icon name="Trash2" size={20} /></button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    <div className="bg-base-100/50 p-6 rounded-3xl border border-base-300/50">
                                        <h5 className="text-[10px] font-black uppercase tracking-widest text-primary mb-4">Ingredients</h5>
                                        <ul className="space-y-3">
                                            {recipe.ingredients?.map((ing, idx) => (
                                                <li key={idx} className="flex justify-between items-baseline border-b border-base-300/30 pb-2">
                                                    <span className="text-sm font-bold text-base-content/80">{ing.name}</span>
                                                    <span className="text-sm font-black text-primary">{scaleAmount(ing.amount, multiplier)} {ing.unit !== 'unit' ? ing.unit : ''}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="bg-base-100/50 p-6 rounded-3xl border border-base-300/50">
                                        <h5 className="text-[10px] font-black uppercase tracking-widest text-primary mb-4">Instructions</h5>
                                        <div className="space-y-4">
                                            {recipe.instructions?.map((inst, idx) => (
                                                <div key={idx} className="flex gap-4">
                                                    <span className="font-black text-primary/30 shrink-0">{idx + 1}.</span>
                                                    <p className="text-sm font-bold text-base-content/70 leading-relaxed">{inst}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const PlannerTab = () => {
        const start = startOfWeek(new Date());
        const days = eachDayOfInterval({ start, end: addDays(start, 6) });
        const [editingDay, setEditingDay] = useState(null);
        const [form, setForm] = useState({ meal_type: 'Dinner', recipe_id: '', note: '' });

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

        return (
            <div className="space-y-6">
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
            </div>
        );
    };

    return (
        <div className="space-y-8 pb-20">
            {showHeaders && (
                <EditableHeader 
                    value={pageName} 
                    onSave={setPageName} 
                    subtext="Culinary Center" 
                />
            )}

            {/* Internal Nav */}
            <div className="flex gap-2 p-1 bg-base-200 rounded-2xl w-fit border border-base-300 overflow-x-auto max-w-full">
                {[
                    { id: 'journal', label: 'Journal', icon: 'BookText' },
                    { id: 'planner', label: 'Planner', icon: 'CalendarDays' },
                    { id: 'recipes', label: 'Recipes', icon: 'Salad' },
                    { id: 'ingredients', label: 'Inventory', icon: 'Library' }
                ].map(t => (
                    <button
                        key={t.id}
                        onClick={() => setActiveTab(t.id)}
                        className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all shrink-0 ${activeTab === t.id ? 'bg-primary text-primary-content shadow-md' : 'text-slate-600 hover:text-primary hover:bg-base-300/50'}`}
                    >
                        <Icon name={t.icon} size={14} />
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="fade-in">
                {activeTab === 'journal' && <JournalTab />}
                {activeTab === 'planner' && <PlannerTab />}
                {activeTab === 'recipes' && <RecipesTab />}
                {activeTab === 'ingredients' && <InventoryTab />}
            </div>
        </div>
    );
};

export default Food;