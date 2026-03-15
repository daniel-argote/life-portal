import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import Icon from '../components/Icon';
import EditableHeader from '../components/EditableHeader';
import { scaleAmount } from '../lib/foodUtils';

const FoodRecipes = ({ user, notify, pageName, setPageName, showHeaders }) => {
    const [recipes, setRecipes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [recipeMultipliers, setRecipeMultipliers] = useState({});
    const [ingredientLibrary, setIngredientLibrary] = useState([]);
    const [form, setForm] = useState({ 
        title: '', 
        ingredients: [{ amount: '', unit: 'unit', name: '' }], 
        instructions: [''] 
    });

    const UNITS = ['unit', 'cup', 'oz', 'g', 'ml', 'tsp', 'tbsp', 'lb', 'bunch', 'clove', 'can', 'pinch', 'piece'];

    const fetchData = useCallback(async () => {
        if (!user) return;
        const { data: recs } = await supabase.from('recipes').select('*').order('title', { ascending: true });
        setRecipes(recs || []);
        const { data: lib } = await supabase.from('ingredients_library').select('*').order('name', { ascending: true });
        setIngredientLibrary(lib || []);
    }, [user]);

    useEffect(() => { fetchData(); }, [fetchData]);

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
            if (notify) notify(editingId ? 'Recipe updated' : 'Recipe added to vault');
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

    const deleteRecipe = async (id) => {
        const { error } = await supabase.from('recipes').delete().eq('id', id);
        if (!error) { fetchData(); if (notify) notify('Recipe removed'); }
    };

    return (
        <div className="space-y-8 pb-20">
            {showHeaders && (
                <EditableHeader value={pageName} onSave={setPageName} subtext="Your Culinary Library" />
            )}

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
                                <input className="flex-1 bg-base-100 p-3 rounded-xl font-bold outline-none border-2 border-transparent focus:border-primary instruction-input" placeholder="Describe the step..." value={inst} onChange={e => updateInstruction(idx, e.target.value)} />
                            </div>
                        ))}
                        <button type="button" onClick={() => setForm({...form, instructions: [...form.instructions, '']})} className="text-primary text-xs font-black uppercase tracking-widest flex items-center gap-2 px-2 hover:opacity-70 transition-opacity"><Icon name="Plus" size={14} /> Add Step</button>
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

export default FoodRecipes;
