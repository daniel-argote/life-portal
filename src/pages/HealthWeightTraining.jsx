import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import Icon from '../components/Icon';
import PageContainer from '../components/PageContainer';
import { format } from 'date-fns';

const HealthWeightTraining = ({ user, notify }) => {
    const [workouts, setWorkouts] = useState([]);
    const [exercises, setExercises] = useState([]);
    const [activeWorkout, setActiveWorkout] = useState(null);
    const [isLogging, setIsLogging] = useState(false);
    const [workoutItems, setWorkoutItems] = useState([]);
    const [logEntries, setLogEntries] = useState({});
    const [showCreator, setShowCreator] = useState(false);
    const [newWorkout, setNewWorkout] = useState({ name: '', description: '' });

    // Inline editing state
    const [editingItemId, setEditingItemId] = useState(null);
    const [editForm, setEditForm] = useState({});

    // Inline adding state
    const [addingToGroup, setAddingToGroup] = useState(null); // 'new' or a group_id
    const [itemForm, setItemCreator] = useState({
        exercise_name: '',
        prescribed_sets: 3,
        prescribed_reps: 10,
        prescribed_weight: '',
        target_rpe: '',
        rest_period: '',
        template_type: 'standard',
        group_id: null
    });

    const fetchExercises = useCallback(async () => {
        if (!user) return;
        const { data } = await supabase.from('health_exercises').select('*').order('name');
        setExercises(data || []);
    }, [user]);

    const fetchWorkouts = useCallback(async () => {
        if (!user) return;
        const { data } = await supabase.from('health_workouts').select('*').order('created_at', { ascending: false });
        setWorkouts(data || []);
    }, [user]);

    useEffect(() => {
        fetchExercises();
        fetchWorkouts();
    }, [fetchExercises, fetchWorkouts]);

    const fetchWorkoutItems = async (workoutId) => {
        const { data } = await supabase
            .from('health_workout_items')
            .select('*')
            .eq('workout_id', workoutId)
            .order('position');
        setWorkoutItems(data || []);
        
        const initialLogs = {};
        (data || []).forEach(item => {
            initialLogs[item.id] = {
                reps: item.prescribed_reps,
                weight: item.prescribed_weight || '',
                sets: item.prescribed_sets,
                rpe: item.target_rpe || ''
            };
        });
        setLogEntries(initialLogs);
    };

    const handleStartWorkout = (workout) => {
        setActiveWorkout(workout);
        fetchWorkoutItems(workout.id);
        setIsLogging(true);
    };

    const handleCreateWorkout = async (e) => {
        e.preventDefault();
        const { data, error } = await supabase.from('health_workouts').insert([{ ...newWorkout, user_id: user.id }]).select();
        if (error) notify(error.message, 'error');
        else {
            notify('Workout created');
            setNewWorkout({ name: '', description: '' });
            setShowCreator(false);
            fetchWorkouts();
        }
    };

    const handleAddItem = async (e) => {
        if (e) e.preventDefault();
        if (!activeWorkout || !itemForm.exercise_name) return;

        const { error } = await supabase.from('health_workout_items').insert([{
            ...itemForm,
            workout_id: activeWorkout.id,
            position: workoutItems.length,
            prescribed_weight: parseFloat(itemForm.prescribed_weight) || null,
            target_rpe: parseInt(itemForm.target_rpe) || null
        }]);

        if (error) notify(error.message, 'error');
        else {
            notify('Exercise added');
            setItemCreator({ 
                exercise_name: '', 
                prescribed_sets: 3, 
                prescribed_reps: 10, 
                prescribed_weight: '', 
                target_rpe: '', 
                rest_period: '', 
                template_type: 'standard', 
                group_id: null 
            });
            setAddingToGroup(null);
            fetchWorkoutItems(activeWorkout.id);
        }
    };

    const deleteWorkoutItem = async (id) => {
        const { error } = await supabase.from('health_workout_items').delete().eq('id', id);
        if (!error) fetchWorkoutItems(activeWorkout.id);
    };

    const handleUpdateItem = async (id) => {
        const { error } = await supabase
            .from('health_workout_items')
            .update({
                exercise_name: editForm.exercise_name,
                prescribed_weight: parseFloat(editForm.prescribed_weight) || null,
                target_rpe: parseInt(editForm.target_rpe) || null,
                prescribed_sets: parseInt(editForm.prescribed_sets) || 0,
                prescribed_reps: parseInt(editForm.prescribed_reps) || 0,
                rest_period: editForm.rest_period
            })
            .eq('id', id);

        if (error) notify(error.message, 'error');
        else {
            notify('Exercise updated');
            setEditingItemId(null);
            fetchWorkoutItems(activeWorkout.id);
        }
    };

    const saveSession = async () => {
        const { data: logData, error: logError } = await supabase
            .from('health_workout_logs')
            .insert([{ user_id: user.id, workout_id: activeWorkout.id }])
            .select()
            .single();

        if (logError) return notify(logError.message, 'error');

        const itemsToInsert = workoutItems.map(item => ({
            log_id: logData.id,
            exercise_name: item.exercise_name,
            sets_completed: parseInt(logEntries[item.id].sets),
            reps_completed: parseInt(logEntries[item.id].reps),
            weight_used: parseFloat(logEntries[item.id].weight),
            rpe_achieved: parseInt(logEntries[item.id].rpe)
        }));

        const { error: itemsError } = await supabase.from('health_workout_log_items').insert(itemsToInsert);
        if (itemsError) notify(itemsError.message, 'error');
        else {
            for (const entry of itemsToInsert) {
                const existing = exercises.find(e => e.name.toLowerCase() === entry.exercise_name.toLowerCase());
                const currentEstimated1RM = entry.weight_used * (1 + entry.reps_completed / 30);
                const bestEstimated1RM = existing ? (existing.best_weight * (1 + existing.best_reps / 30)) : 0;

                if (!existing) {
                    await supabase.from('health_exercises').insert([{
                        user_id: user.id,
                        name: entry.exercise_name,
                        best_weight: entry.weight_used,
                        best_reps: entry.reps_completed,
                        best_at: new Date().toISOString()
                    }]);
                } else if (currentEstimated1RM > bestEstimated1RM) {
                    await supabase.from('health_exercises').update({
                        best_weight: entry.weight_used,
                        best_reps: entry.reps_completed,
                        best_at: new Date().toISOString()
                    }).eq('id', existing.id);
                }
            }

            notify('Session saved!');
            setIsLogging(false);
            setActiveWorkout(null);
            fetchExercises();
        }
    };

    const renderStrengthStat = (exercise) => {
        const weight = parseFloat(exercise.best_weight);
        const reps = parseInt(exercise.best_reps);
        const oneRM = weight * (1 + reps / 30);
        const fiveRM = Math.round(oneRM / (1 + 5 / 30));
        const tenRM = Math.round(oneRM / (1 + 10 / 30));

        return (
            <div key={exercise.id} className="bg-base-200 p-6 rounded-3xl border border-base-300">
                <h4 className="font-black text-lg mb-4">{exercise.name}</h4>
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-base-100 p-3 rounded-2xl text-center shadow-inner">
                        <p className="text-[10px] font-black uppercase text-slate-500">Est. 5-Rep Max</p>
                        <p className="text-xl font-black text-primary">{fiveRM} <span className="text-xs">lbs</span></p>
                    </div>
                    <div className="bg-base-100 p-3 rounded-2xl text-center shadow-inner">
                        <p className="text-[10px] font-black uppercase text-slate-500">Est. 10-Rep Max</p>
                        <p className="text-xl font-black text-indigo-500">{tenRM} <span className="text-xs">lbs</span></p>
                    </div>
                </div>
                <p className="text-[8px] font-black uppercase text-slate-400 mt-4 text-center tracking-widest">
                    Best: {weight}lbs x {reps} ({new Date(exercise.best_at).toLocaleDateString()})
                </p>
            </div>
        );
    };

    // Grouping items for the blueprint view
    const getBlueprintGroups = () => {
        const groups = [];
        let currentGroupId = null;
        let currentGroup = null;

        workoutItems.forEach((item) => {
            if (item.template_type === 'superset' && item.group_id) {
                if (item.group_id === currentGroupId) {
                    currentGroup.items.push(item);
                } else {
                    currentGroupId = item.group_id;
                    currentGroup = { type: 'superset', group_id: item.group_id, items: [item] };
                    groups.push(currentGroup);
                }
            } else {
                currentGroupId = null;
                groups.push({ type: 'standard', items: [item] });
            }
        });
        return groups;
    };

    if (activeWorkout && !isLogging) {
        const groups = getBlueprintGroups();
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

        return (
            <PageContainer>
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <button onClick={() => setActiveWorkout(null)} className="text-slate-500 font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:text-primary transition-colors mb-2">
                            <Icon name="ArrowLeft" size={14} /> Back to Templates
                        </button>
                        <h2 className="text-4xl font-black">{activeWorkout.name}</h2>
                        <p className="text-slate-500 font-bold text-sm">{activeWorkout.description || 'Workout Blueprint'}</p>
                    </div>
                    <button onClick={() => setIsLogging(true)} className="bg-primary text-primary-content px-10 py-5 rounded-[2rem] font-black uppercase tracking-widest shadow-xl shadow-primary/20 active:scale-95 transition-all flex items-center gap-3">
                        <Icon name="Play" size={20} /> Start Session
                    </button>
                </div>

                <div className="max-w-3xl mx-auto space-y-12 pb-24">
                    {groups.map((group, gIdx) => (
                        <div key={group.group_id || gIdx} className="relative">
                            {/* Group Header/Label */}
                            <div className="absolute -left-12 top-0 bottom-0 flex flex-col items-center">
                                <div className="w-8 h-8 rounded-full bg-base-300 flex items-center justify-center font-black text-xs text-slate-600 border-2 border-base-100 shadow-sm">
                                    {alphabet[gIdx % alphabet.length]}
                                </div>
                                <div className="w-0.5 flex-1 bg-base-300/50 border-l border-dashed border-slate-400 my-2"></div>
                            </div>

                            <div className={`p-8 rounded-[3rem] border-2 transition-all ${group.type === 'superset' ? 'bg-indigo-500/5 border-indigo-500/20 shadow-indigo-500/5' : 'bg-base-200 border-base-300 shadow-sm'}`}>
                                {group.type === 'superset' && (
                                    <div className="flex items-center gap-2 mb-6">
                                        <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-lg">
                                            <Icon name="RefreshCw" size={16} />
                                        </div>
                                        <span className="text-[10px] font-black uppercase text-indigo-500 tracking-widest">Superset Block</span>
                                    </div>
                                )}

                                <div className="space-y-6">
                                    {group.items.map((item, iIdx) => (
                                        <div key={item.id} className="group relative">
                                            {editingItemId === item.id ? (
                                                <div className="bg-base-100 p-6 rounded-2xl border-2 border-primary ring-4 ring-primary/5 animate-in zoom-in-95">
                                                    <div className="space-y-4">
                                                        <input 
                                                            className="w-full bg-base-200 p-3 rounded-xl font-black text-lg outline-none focus:ring-2 ring-primary/20"
                                                            value={editForm.exercise_name}
                                                            onChange={e => setEditForm({...editForm, exercise_name: e.target.value})}
                                                            autoFocus
                                                        />
                                                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                                                            <div>
                                                                <label className="text-[8px] font-black uppercase text-slate-400 block mb-1">Sets</label>
                                                                <input type="number" className="w-full bg-base-200 p-3 rounded-xl font-black text-center outline-none" value={editForm.prescribed_sets} onChange={e => setEditForm({...editForm, prescribed_sets: e.target.value})} />
                                                            </div>
                                                            <div>
                                                                <label className="text-[8px] font-black uppercase text-slate-400 block mb-1">Reps</label>
                                                                <input type="number" className="w-full bg-base-200 p-3 rounded-xl font-black text-center outline-none" value={editForm.prescribed_reps} onChange={e => setEditForm({...editForm, prescribed_reps: e.target.value})} />
                                                            </div>
                                                            <div>
                                                                <label className="text-[8px] font-black uppercase text-slate-400 block mb-1">Weight</label>
                                                                <input className="w-full bg-base-200 p-3 rounded-xl font-black text-center outline-none" value={editForm.prescribed_weight} onChange={e => setEditForm({...editForm, prescribed_weight: e.target.value})} />
                                                            </div>
                                                            <div>
                                                                <label className="text-[8px] font-black uppercase text-slate-400 block mb-1">Target RPE</label>
                                                                <input type="number" className="w-full bg-base-200 p-3 rounded-xl font-black text-center outline-none" value={editForm.target_rpe} onChange={e => setEditForm({...editForm, target_rpe: e.target.value})} />
                                                            </div>
                                                            <div>
                                                                <label className="text-[8px] font-black uppercase text-slate-400 block mb-1">Rest</label>
                                                                <input className="w-full bg-base-200 p-3 rounded-xl font-black text-center outline-none" value={editForm.rest_period} onChange={e => setEditForm({...editForm, rest_period: e.target.value})} />
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2 pt-2">
                                                            <button onClick={() => handleUpdateItem(item.id)} className="flex-1 bg-primary text-primary-content py-3 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg active:scale-95 transition-all">Save Changes</button>
                                                            <button onClick={() => setEditingItemId(null)} className="px-6 bg-base-200 text-slate-500 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest">Cancel</button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer" onClick={() => { setEditingItemId(item.id); setEditForm(item); }}>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3 mb-3">
                                                            <span className="text-slate-400 font-black text-xs">{alphabet[gIdx % alphabet.length]}{iIdx + 1}</span>
                                                            <h4 className="text-2xl font-black group-hover:text-primary transition-colors">{item.exercise_name}</h4>
                                                        </div>
                                                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 max-w-2xl">
                                                            <div className="flex flex-col">
                                                                <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest mb-1">Sets</span>
                                                                <span className="font-black text-sm text-slate-600">{item.prescribed_sets}</span>
                                                            </div>
                                                            <div className="flex flex-col border-l border-base-300/50 pl-4">
                                                                <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest mb-1">Reps</span>
                                                                <span className="font-black text-sm text-slate-600">{item.prescribed_reps}</span>
                                                            </div>
                                                            <div className="flex flex-col border-l border-base-300/50 pl-4">
                                                                <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest mb-1">Weight</span>
                                                                <span className="font-black text-sm text-slate-600">{item.prescribed_weight ? `${item.prescribed_weight} lbs` : '—'}</span>
                                                            </div>
                                                            <div className="flex flex-col border-l border-base-300/50 pl-4">
                                                                <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest mb-1">Target RPE</span>
                                                                <span className="font-black text-sm text-indigo-500">{item.target_rpe || '—'}</span>
                                                            </div>
                                                            <div className="flex flex-col border-l border-base-300/50 pl-4">
                                                                <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest mb-1">Rest</span>
                                                                <span className="font-black text-sm text-slate-500">{item.rest_period || '—'}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="opacity-0 group-hover:opacity-100 p-3 text-primary transition-all">
                                                            <Icon name="Edit3" size={18} />
                                                        </div>
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); deleteWorkoutItem(item.id); }} 
                                                            className="opacity-0 group-hover:opacity-100 p-3 text-slate-400 hover:text-danger hover:bg-danger/5 rounded-2xl transition-all"
                                                        >
                                                            <Icon name="Trash2" size={18} />
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                            {iIdx < group.items.length - 1 && <div className="h-px bg-base-300/50 mt-6"></div>}
                                        </div>
                                    ))}
                                </div>

                                {group.type === 'superset' && (
                                    <button 
                                        onClick={() => {
                                            setItemCreator({...itemForm, template_type: 'superset', group_id: group.group_id});
                                            setAddingToGroup(group.group_id);
                                        }}
                                        className="mt-6 w-full py-3 rounded-2xl border-2 border-dashed border-indigo-500/20 text-indigo-500/50 hover:border-indigo-500 hover:text-indigo-500 font-black text-[10px] uppercase tracking-widest transition-all"
                                    >
                                        + Pair Another Exercise
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}

                    {/* The "Blueprint" Adder */}
                    {addingToGroup === 'new' ? (
                        <form onSubmit={handleAddItem} className="bg-base-100 p-10 rounded-[3rem] border-2 border-primary ring-8 ring-primary/5 animate-in zoom-in-95 duration-200">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="font-black text-xl uppercase tracking-tight">New Building Block</h3>
                                <button type="button" onClick={() => setAddingToGroup(null)} className="text-slate-400 hover:text-primary"><Icon name="X" size={24} /></button>
                            </div>
                            
                            <div className="space-y-6">
                                <div>
                                    <label className="text-[10px] font-black uppercase text-slate-400 ml-4 mb-1 block">Exercise Name</label>
                                    <input 
                                        placeholder="e.g. Barbell Squat"
                                        className="w-full bg-base-200 p-5 rounded-2xl border-2 border-transparent focus:border-primary font-black text-xl outline-none transition-all"
                                        value={itemForm.exercise_name}
                                        onChange={e => setItemCreator({...itemForm, exercise_name: e.target.value})}
                                        autoFocus
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-slate-400 ml-4 mb-1 block">Sets</label>
                                        <input type="number" className="w-full bg-base-200 p-4 rounded-2xl font-black text-center outline-none" value={itemForm.prescribed_sets} onChange={e => setItemCreator({...itemForm, prescribed_sets: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-slate-400 ml-4 mb-1 block">Reps</label>
                                        <input type="number" className="w-full bg-base-200 p-4 rounded-2xl font-black text-center outline-none" value={itemForm.prescribed_reps} onChange={e => setItemCreator({...itemForm, prescribed_reps: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-slate-400 ml-4 mb-1 block">Weight</label>
                                        <input placeholder="lbs" className="w-full bg-base-200 p-4 rounded-2xl font-black text-center outline-none" value={itemForm.prescribed_weight} onChange={e => setItemCreator({...itemForm, prescribed_weight: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-slate-400 ml-4 mb-1 block">RPE</label>
                                        <input type="number" placeholder="1-10" className="w-full bg-base-200 p-4 rounded-2xl font-black text-center outline-none" value={itemForm.target_rpe} onChange={e => setItemCreator({...itemForm, target_rpe: e.target.value})} />
                                    </div>
                                </div>

                                <div className="flex flex-col md:flex-row gap-4">
                                    <div className="flex-1">
                                        <label className="text-[10px] font-black uppercase text-slate-400 ml-4 mb-1 block">Rest Period</label>
                                        <input placeholder="e.g. 90s" className="w-full bg-base-200 p-4 rounded-2xl font-black outline-none" value={itemForm.rest_period} onChange={e => setItemCreator({...itemForm, rest_period: e.target.value})} />
                                    </div>
                                    <div className="flex-1">
                                        <label className="text-[10px] font-black uppercase text-slate-400 ml-4 mb-1 block">Block Type</label>
                                        <div className="flex p-1 bg-base-200 rounded-2xl">
                                            <button 
                                                type="button" 
                                                onClick={() => setItemCreator({...itemForm, template_type: 'standard', group_id: null})}
                                                className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${itemForm.template_type === 'standard' ? 'bg-white text-primary shadow-md' : 'text-slate-400'}`}
                                            >Standard</button>
                                            <button 
                                                type="button" 
                                                onClick={() => setItemCreator({...itemForm, template_type: 'superset', group_id: crypto.randomUUID()})}
                                                className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${itemForm.template_type === 'superset' ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-400'}`}
                                            >Superset</button>
                                        </div>
                                    </div>
                                </div>

                                <button type="submit" className="w-full bg-primary text-primary-content p-6 rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 active:scale-95 transition-all">
                                    Add to Blueprint
                                </button>
                            </div>
                        </form>
                    ) : addingToGroup ? (
                        <form onSubmit={handleAddItem} className="bg-indigo-500/10 p-8 rounded-[2.5rem] border-2 border-indigo-500 animate-in slide-in-from-top-4">
                            <div className="flex flex-col md:flex-row gap-4">
                                <input 
                                    placeholder="Paired Exercise Name"
                                    className="flex-1 bg-base-100 p-4 rounded-2xl border-2 border-transparent focus:border-indigo-500 font-black outline-none"
                                    value={itemForm.exercise_name}
                                    onChange={e => setItemCreator({...itemForm, exercise_name: e.target.value})}
                                    autoFocus
                                    required
                                />
                                <div className="flex gap-2">
                                    <input type="number" placeholder="S" className="w-16 bg-base-100 p-4 rounded-2xl font-black text-center outline-none" value={itemForm.prescribed_sets} onChange={e => setItemCreator({...itemForm, prescribed_sets: e.target.value})} />
                                    <input type="number" placeholder="R" className="w-16 bg-base-100 p-4 rounded-2xl font-black text-center outline-none" value={itemForm.prescribed_reps} onChange={e => setItemCreator({...itemForm, prescribed_reps: e.target.value})} />
                                    <button type="submit" className="bg-indigo-500 text-white px-6 rounded-2xl font-black uppercase text-xs">Add</button>
                                    <button type="button" onClick={() => setAddingToGroup(null)} className="bg-base-200 text-slate-400 px-4 rounded-2xl font-black uppercase text-xs">X</button>
                                </div>
                            </div>
                        </form>
                    ) : (
                        <div className="flex justify-center">
                            <button 
                                onClick={() => {
                                    setAddingToGroup('new');
                                    setItemCreator({...itemForm, template_type: 'standard', group_id: null});
                                }}
                                className="group flex items-center gap-4 px-8 py-4 rounded-[2rem] border-2 border-dashed border-base-300 text-slate-400 hover:border-primary hover:text-primary transition-all active:scale-95"
                            >
                                <div className="p-2 bg-base-200 rounded-xl group-hover:bg-primary/10 transition-colors">
                                    <Icon name="Plus" size={20} />
                                </div>
                                <span className="font-black uppercase tracking-widest text-xs">Add Building Block</span>
                            </button>
                        </div>
                    )}
                </div>
            </PageContainer>
        );
    }

    if (isLogging) {
        return (
            <PageContainer>
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <button onClick={() => setIsLogging(false)} className="text-slate-500 font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:text-primary transition-colors mb-2">
                            <Icon name="ArrowLeft" size={14} /> Back to Template
                        </button>
                        <h2 className="text-3xl font-black">Session Log: {activeWorkout.name}</h2>
                    </div>
                    <button onClick={saveSession} className="bg-success text-success-content px-10 py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-lg shadow-success/20 active:scale-95 transition-all">
                        Complete Session
                    </button>
                </div>

                <div className="max-w-3xl mx-auto space-y-6">
                    {workoutItems.map((item, idx) => {
                        const isSuperset = item.template_type === 'superset';
                        const nextItem = workoutItems[idx + 1];
                        const prevItem = workoutItems[idx - 1];
                        const isInSupersetGroup = isSuperset && (
                            (nextItem && nextItem.group_id === item.group_id) || 
                            (prevItem && prevItem.group_id === item.group_id)
                        );

                        return (
                            <div key={item.id} className={`p-8 rounded-[3rem] border-2 transition-all ${isInSupersetGroup ? 'bg-indigo-500/5 border-indigo-500/20 ring-1 ring-indigo-500/10' : 'bg-base-200 border-base-300 shadow-sm'}`}>
                                <div className="flex flex-col md:flex-row md:items-center gap-8">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="font-black text-2xl">{item.exercise_name}</h3>
                                            {isSuperset && <span className="bg-indigo-500 text-white text-[8px] font-black uppercase px-2 py-0.5 rounded shadow-sm">Superset</span>}
                                        </div>
                                        <div className="flex flex-wrap gap-4">
                                            <div className="flex items-center gap-1.5 text-slate-500 font-black uppercase text-[10px] tracking-widest">
                                                <Icon name="Target" size={12} className="text-primary" /> {item.prescribed_sets}x{item.prescribed_reps} {item.prescribed_weight ? `@ ${item.prescribed_weight}lb` : ''}
                                            </div>
                                            {item.target_rpe && (
                                                <div className="flex items-center gap-1.5 text-indigo-500 font-black uppercase text-[10px] tracking-widest">
                                                    <Icon name="Zap" size={12} /> Target RPE: {item.target_rpe}
                                                </div>
                                            )}
                                            {item.rest_period && (
                                                <div className="flex items-center gap-1.5 text-slate-400 font-black uppercase text-[10px] tracking-widest">
                                                    <Icon name="Clock" size={12} /> {item.rest_period} Rest
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-4 gap-3 bg-base-100 p-2 rounded-[2rem] border border-base-300 shadow-inner">
                                        <div className="flex flex-col items-center">
                                            <span className="text-[8px] font-black uppercase text-slate-400 mb-1">Sets</span>
                                            <input type="number" className="w-12 bg-transparent font-black text-center outline-none" value={logEntries[item.id]?.sets || ''} onChange={e => setLogEntries({...logEntries, [item.id]: {...logEntries[item.id], sets: e.target.value}})} />
                                        </div>
                                        <div className="flex flex-col items-center border-l border-base-300">
                                            <span className="text-[8px] font-black uppercase text-slate-400 mb-1">Reps</span>
                                            <input type="number" className="w-12 bg-transparent font-black text-center outline-none" value={logEntries[item.id]?.reps || ''} onChange={e => setLogEntries({...logEntries, [item.id]: {...logEntries[item.id], reps: e.target.value}})} />
                                        </div>
                                        <div className="flex flex-col items-center border-l border-base-300">
                                            <span className="text-[8px] font-black uppercase text-slate-400 mb-1">Weight</span>
                                            <input type="number" className="w-12 bg-transparent font-black text-center outline-none" value={logEntries[item.id]?.weight || ''} onChange={e => setLogEntries({...logEntries, [item.id]: {...logEntries[item.id], weight: e.target.value}})} />
                                        </div>
                                        <div className="flex flex-col items-center border-l border-base-300">
                                            <span className="text-[8px] font-black uppercase text-slate-400 mb-1">RPE</span>
                                            <input type="number" className="w-12 bg-transparent font-black text-center text-indigo-500 outline-none" placeholder="1-10" value={logEntries[item.id]?.rpe || ''} onChange={e => setLogEntries({...logEntries, [item.id]: {...logEntries[item.id], rpe: e.target.value}})} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </PageContainer>
        );
    }

    return (
        <PageContainer>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-1 space-y-8">
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-primary/10 text-primary rounded-2xl">
                                <Icon name="TrendingUp" size={24} />
                            </div>
                            <h3 className="font-black text-xl">Strength Stats</h3>
                        </div>
                        <div className="space-y-4">
                            {exercises.length > 0 ? exercises.map(renderStrengthStat) : (
                                <div className="bg-base-200/50 p-12 rounded-[2.5rem] border-2 border-dashed border-base-300 text-center">
                                    <Icon name="Activity" size={32} className="mx-auto text-slate-300 mb-2" />
                                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">No stats recorded</p>
                                </div>
                            )}
                        </div>
                    </section>
                </div>

                <div className="lg:col-span-2 space-y-8">
                    <section>
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-2xl">
                                    <Icon name="Dumbbell" size={24} />
                                </div>
                                <h3 className="font-black text-xl">Workout Blueprints</h3>
                            </div>
                            <button onClick={() => setShowCreator(!showCreator)} className="p-3 bg-base-200 hover:bg-primary/10 text-slate-600 hover:text-primary rounded-2xl transition-all">
                                <Icon name={showCreator ? "X" : "Plus"} size={24} />
                            </button>
                        </div>

                        {showCreator && (
                            <form onSubmit={handleCreateWorkout} className="bg-base-200 p-8 rounded-[3rem] border-2 border-primary shadow-2xl mb-8 animate-in slide-in-from-top-4 duration-300">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <input placeholder="Workout Name (e.g. Upper Body A)" className="bg-base-100 p-5 rounded-2xl border-2 border-transparent focus:border-primary font-black outline-none" value={newWorkout.name} onChange={e => setNewWorkout({...newWorkout, name: e.target.value})} required />
                                    <input placeholder="Short description..." className="bg-base-100 p-5 rounded-2xl border-2 border-transparent focus:border-primary font-bold outline-none" value={newWorkout.description} onChange={e => setNewWorkout({...newWorkout, description: e.target.value})} />
                                </div>
                                <button type="submit" className="w-full bg-primary text-primary-content p-5 rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 active:scale-95 transition-all">Create Blueprint</button>
                            </form>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {workouts.map(workout => (
                                <div key={workout.id} onClick={() => { setActiveWorkout(workout); fetchWorkoutItems(workout.id); }} className="bg-base-200 p-10 rounded-[3rem] border border-base-300 hover:border-primary/30 hover:shadow-xl transition-all cursor-pointer flex flex-col group relative overflow-hidden">
                                    <div className="absolute -top-4 -right-4 p-8 opacity-5 group-hover:opacity-10 group-hover:-rotate-12 transition-all">
                                        <Icon name="Dumbbell" size={96} />
                                    </div>
                                    <h4 className="text-3xl font-black mb-2 z-10">{workout.name}</h4>
                                    <p className="text-slate-500 font-bold text-sm mb-8 flex-1 z-10 line-clamp-2">{workout.description || 'View and edit workout blueprint'}</p>
                                    <div className="flex items-center justify-between z-10">
                                        <span className="text-[10px] font-black uppercase text-primary tracking-widest group-hover:translate-x-2 transition-transform flex items-center gap-2">
                                            Edit Blueprint <Icon name="ArrowRight" size={12} />
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {workouts.length === 0 && !showCreator && (
                            <div className="h-full min-h-[300px] flex flex-col items-center justify-center bg-base-200/50 rounded-[3rem] border-4 border-dashed border-base-300 p-12 text-center">
                                <Icon name="Dumbbell" size={48} className="text-slate-300 mb-4" />
                                <h3 className="font-black text-slate-400 text-xl uppercase tracking-tighter">Empty Archive</h3>
                                <p className="text-slate-400 font-bold max-w-xs mt-2">Create your first workout template above to start tracking your progress.</p>
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </PageContainer>
    );
};

export default HealthWeightTraining;
