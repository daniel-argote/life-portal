import { useState, useEffect, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { supabase } from '../lib/supabaseClient';
import Icon from '../components/Icon';
import DatePicker from '../components/DatePicker';
import { format } from 'date-fns';

const Actions = ({ user, notify }) => {
    const [activeTab, setActiveTab] = useState('objectives');
    const [viewMode, setViewMode] = useState('kanban'); // 'kanban' or 'list'
    const [loading, setLoading] = useState(false);

    // Data State
    const [todos, setTodos] = useState([]);
    const [goals, setGoals] = useState([]);
    const [editingTodo, setEditingTodo] = useState(null);

    const fetchData = useCallback(async () => {
        if (!user) return;
        
        // Fetch Todos
        const { data: t } = await supabase.from('todos').select('*').order('position', { ascending: true });
        setTodos(t || []);

        // Fetch Goals
        const { data: g } = await supabase.from('goals').select('*').order('target_date', { ascending: true });
        setGoals(g || []);
    }, [user]);

    const updateTodo = async (id, updates) => {
        setLoading(true);
        // Clean up empty dates
        if (updates.due_date === '') updates.due_date = null;
        
        const { error } = await supabase.from('todos').update(updates).eq('id', id);
        if (error) {
            console.error('Update Error:', error);
            notify('Update failed: ' + error.message, 'error');
        } else {
            fetchData();
            notify('Objective updated');
            setEditingTodo(null);
        }
        setLoading(false);
    };

    useEffect(() => { fetchData(); }, [fetchData]);

    const EditTodoModal = ({ todo, onClose, onSave }) => {
        const [form, setForm] = useState({ 
            task: todo.task || '', 
            description: todo.description || '', 
            due_date: todo.due_date || '',
            status: todo.status || 'todo'
        });

        return (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
                <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-[3rem] shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden flex flex-col max-h-[90vh]">
                    <header className="p-8 pb-4 flex justify-between items-start">
                        <div className="space-y-1">
                            <h3 className="text-3xl font-black dark:text-white leading-none">Edit Objective</h3>
                            <p className="text-[10px] font-black uppercase tracking-widest text-primary">Mission Details</p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl transition-all">
                            <Icon name="X" size={24} />
                        </button>
                    </header>

                    <div className="flex-1 overflow-y-auto p-8 pt-4 space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Task Name</label>
                            <input 
                                value={form.task} 
                                onChange={e => setForm({...form, task: e.target.value})}
                                className="w-full bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl font-bold border-2 border-transparent focus:border-primary outline-none transition-all text-xl"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Timeline</label>
                                <DatePicker value={form.due_date} onChange={val => setForm({...form, due_date: val})} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Status</label>
                                <select 
                                    value={form.status} 
                                    onChange={e => setForm({...form, status: e.target.value})}
                                    className="w-full bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl font-bold border-2 border-transparent focus:border-primary outline-none appearance-none cursor-pointer"
                                >
                                    <option value="todo">To Do</option>
                                    <option value="progress">In Progress</option>
                                    <option value="done">Complete</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Strategic Details</label>
                            <textarea 
                                value={form.description} 
                                onChange={e => setForm({...form, description: e.target.value})}
                                placeholder="Add context, sub-tasks, or notes..."
                                className="w-full h-48 bg-slate-50 dark:bg-slate-900 p-5 rounded-[2rem] font-bold border-2 border-transparent focus:border-primary outline-none transition-all resize-none"
                            />
                        </div>
                    </div>

                    <footer className="p-8 bg-slate-50 dark:bg-slate-900/50 flex gap-3">
                        <button 
                            onClick={onClose}
                            className="flex-1 px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-800 transition-all"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={() => onSave(todo.id, form)}
                            className="flex-[2] bg-primary text-primary-content px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
                        >
                            Save Changes
                        </button>
                    </footer>
                </div>
            </div>
        );
    };

    const ObjectivesTab = () => {
        const [task, setTask] = useState('');
        const [dueDate, setDueDate] = useState('');

        const addTask = async (e) => {
            e.preventDefault();
            if (!task.trim()) return;
            setLoading(true);
            const { error } = await supabase.from('todos').insert([{ 
                task, 
                due_date: dueDate || null, 
                status: 'todo', 
                user_id: user.id,
                position: todos.filter(t => t.status === 'todo').length
            }]);
            if (!error) { setTask(''); setDueDate(''); fetchData(); notify('Objective added'); }
            setLoading(false);
        };

        const onDragEnd = async (result) => {
            if (!result.destination) return;
            const { source, destination, draggableId } = result;

            if (source.droppableId === destination.droppableId && source.index === destination.index) return;

            const newTodos = Array.from(todos);
            const movedTask = newTodos.find(t => t.id === draggableId);
            
            // Update local state first
            movedTask.status = destination.droppableId;
            const filtered = newTodos.filter(t => t.id !== draggableId);
            const inDest = filtered.filter(t => t.status === destination.droppableId);
            inDest.splice(destination.index, 0, movedTask);
            
            // Rebuild final list
            const final = [
                ...filtered.filter(t => t.status !== destination.droppableId),
                ...inDest
            ];
            setTodos(final);

            // Persist to DB
            const { error } = await supabase.from('todos').update({ status: destination.droppableId }).eq('id', draggableId);
            if (!error) fetchData();
        };

        const deleteTodo = async (id) => {
            const { error } = await supabase.from('todos').delete().eq('id', id);
            if (!error) { fetchData(); notify('Objective removed'); }
        };

        const columns = {
            todo: { title: 'To Do', icon: 'Circle' },
            progress: { title: 'In Progress', icon: 'Clock' },
            done: { title: 'Complete', icon: 'CheckCircle2' }
        };

        return (
            <div className="space-y-8">
                <form onSubmit={addTask} className="bg-base-200 p-6 rounded-[2rem] border border-base-300 shadow-sm flex flex-col md:flex-row gap-4">
                    <input
                        value={task}
                        onChange={(e) => setTask(e.target.value)}
                        placeholder="New Objective..."
                        className="flex-1 bg-base-100 p-4 rounded-xl font-bold outline-none text-base-content border-2 border-transparent focus:border-primary transition-all"
                    />
                    <div className="w-full md:w-64">
                        <DatePicker value={dueDate} onChange={setDueDate} />
                    </div>
                    <button disabled={loading} className="bg-primary text-primary-content p-4 rounded-xl font-bold shadow-lg hover:scale-105 transition-transform">
                        <Icon name="Plus" size={24} />
                    </button>
                </form>

                <div className="flex justify-end gap-2">
                    <button onClick={() => setViewMode('kanban')} className={`p-2 rounded-lg transition-all ${viewMode === 'kanban' ? 'bg-primary text-primary-content shadow-md' : 'bg-base-200 text-slate-600'}`}>
                        <Icon name="Layout" size={20} />
                    </button>
                    <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-primary text-primary-content shadow-md' : 'bg-base-200 text-slate-600'}`}>
                        <Icon name="List" size={20} />
                    </button>
                </div>

                {viewMode === 'kanban' ? (
                    <DragDropContext onDragEnd={onDragEnd}>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {Object.entries(columns).map(([id, col]) => (
                                <div key={id} className="bg-base-200/50 rounded-[2.5rem] p-6 border border-base-300 flex flex-col min-h-[500px]">
                                    <header className="flex items-center gap-3 mb-6 px-2">
                                        <Icon name={col.icon} size={18} className="text-primary" />
                                        <h4 className="font-black uppercase tracking-widest text-xs text-slate-600">{col.title}</h4>
                                        <span className="ml-auto bg-base-300 text-[10px] font-black px-2 py-1 rounded-full text-slate-500">
                                            {todos.filter(t => t.status === id).length}
                                        </span>
                                    </header>
                                    
                                    <Droppable droppableId={id}>
                                        {(provided) => (
                                            <div {...provided.droppableProps} ref={provided.innerRef} className="flex-1 space-y-3">
                                                {todos.filter(t => t.status === id).map((todo, index) => (
                                                    <Draggable key={todo.id} draggableId={todo.id} index={index}>
                                                        {(provided, snapshot) => (
                                                            <div
                                                                ref={provided.innerRef}
                                                                {...provided.draggableProps}
                                                                {...provided.dragHandleProps}
                                                                onClick={() => setEditingTodo(todo)}
                                                                className={`bg-base-100 p-5 rounded-2xl border-2 transition-all group cursor-pointer
                                                                    ${snapshot.isDragging ? 'border-primary shadow-2xl scale-[1.02] z-50' : 'border-transparent shadow-sm hover:border-primary/20'}`}
                                                            >
                                                                <div className="flex justify-between items-start mb-2">
                                                                    <p className="font-bold text-base-content leading-snug">{todo.task}</p>
                                                                    <button 
                                                                        onClick={(e) => { e.stopPropagation(); deleteTodo(todo.id); }} 
                                                                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-danger transition-all"
                                                                    >
                                                                        <Icon name="X" size={14} />
                                                                    </button>
                                                                </div>
                                                                {todo.due_date && (
                                                                    <div className="flex items-center gap-1.5 text-[10px] font-black text-primary uppercase tracking-tighter">
                                                                        <Icon name="Calendar" size={10} />
                                                                        {format(new Date(todo.due_date.replace(/-/g, '\/')), 'MMM d')}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </Draggable>
                                                ))}
                                                {provided.placeholder}
                                            </div>
                                        )}
                                    </Droppable>
                                </div>
                            ))}
                        </div>
                    </DragDropContext>
                ) : (
                    <div className="space-y-3">
                        {todos.map(todo => (
                            <div 
                                key={todo.id} 
                                onClick={() => setEditingTodo(todo)}
                                className="bg-base-200 p-4 rounded-2xl border border-base-300 flex items-center gap-4 group cursor-pointer hover:border-primary/20 transition-all"
                            >
                                <div className={`w-2 h-2 rounded-full ${todo.status === 'done' ? 'bg-success' : todo.status === 'progress' ? 'bg-indigo-500' : 'bg-slate-300'}`} />
                                <div className="flex-1">
                                    <p className={`font-bold ${todo.status === 'done' ? 'line-through text-slate-600' : 'text-base-content'}`}>{todo.task}</p>
                                    {todo.due_date && <p className="text-[10px] font-black text-primary uppercase mt-1">Due {format(new Date(todo.due_date.replace(/-/g, '\/')), 'MMMM do')}</p>}
                                </div>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); deleteTodo(todo.id); }} 
                                    className="text-slate-600 hover:text-danger opacity-0 group-hover:opacity-100 p-2 transition-all"
                                >
                                    <Icon name="Trash2" size={18} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    const GoalsTab = () => {
        const [showAdd, setShowAdd] = useState(false);
        const [form, setForm] = useState({ title: '', description: '', target_date: '', status: 'active' });

        const handleAdd = async (e) => {
            e.preventDefault();
            if (!form.title) return;
            setLoading(true);
            const { error } = await supabase.from('goals').insert([{ ...form, user_id: user.id }]);
            if (!error) {
                setForm({ title: '', description: '', target_date: '', status: 'active' });
                setShowAdd(false);
                fetchData();
                notify('Goal initialized');
            }
            setLoading(false);
        };

        const deleteGoal = async (id) => {
            const { error } = await supabase.from('goals').delete().eq('id', id);
            if (!error) { fetchData(); notify('Goal archived'); }
        };

        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h3 className="text-2xl font-black text-base-content">Strategic Goals</h3>
                    <button onClick={() => setShowAdd(!showAdd)} className="bg-primary/10 text-primary px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-primary hover:text-primary-content transition-all">
                        <Icon name={showAdd ? "X" : "Plus"} size={18} />
                        {showAdd ? "Cancel" : "New Goal"}
                    </button>
                </div>

                {showAdd && (
                    <form onSubmit={handleAdd} className="bg-base-200 p-8 rounded-[2.5rem] border border-base-300 shadow-xl space-y-4">
                        <input placeholder="What's the milestone?" className="w-full bg-base-100 p-4 rounded-xl font-bold outline-none border-2 border-transparent focus:border-primary text-xl" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
                        <textarea placeholder="Describe the outcome..." className="w-full h-32 bg-base-100 p-4 rounded-xl font-bold outline-none resize-none" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
                        <div className="w-full md:w-64">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-600 ml-2 mb-1 block">Target Date</label>
                            <DatePicker value={form.target_date} onChange={(val) => setForm({...form, target_date: val})} />
                        </div>
                        <button disabled={loading} className="w-full bg-primary text-primary-content py-4 rounded-xl font-black shadow-lg">Activate Goal</button>
                    </form>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {goals.map(goal => (
                        <div key={goal.id} className="bg-base-200 p-8 rounded-[2.5rem] border border-base-300 shadow-sm group hover:border-primary/30 transition-all">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="bg-primary/10 text-primary p-1.5 rounded-lg"><Icon name="Star" size={16} /></span>
                                        <h4 className="text-2xl font-black text-base-content">{goal.title}</h4>
                                    </div>
                                    {goal.target_date && <p className="text-[10px] font-black text-primary uppercase tracking-widest">Target: {format(new Date(goal.target_date.replace(/-/g, '\/')), 'MMMM yyyy')}</p>}
                                </div>
                                <button onClick={() => deleteGoal(goal.id)} className="text-slate-600 hover:text-danger opacity-0 group-hover:opacity-100 transition-all p-2">
                                    <Icon name="Trash2" size={20} />
                                </button>
                            </div>
                            <p className="text-sm font-bold text-slate-500 dark:text-slate-600 leading-relaxed">{goal.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-8 pb-20">
            <div className="flex gap-2 p-1 bg-base-200 rounded-2xl w-fit border border-base-300">
                {[
                    { id: 'objectives', label: 'Objectives', icon: 'CheckSquare' },
                    { id: 'goals', label: 'Goals', icon: 'Star' }
                ].map(t => (
                    <button
                        key={t.id}
                        onClick={() => setActiveTab(t.id)}
                        className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all ${activeTab === t.id ? 'bg-primary text-primary-content shadow-md' : 'text-slate-600 hover:text-primary hover:bg-base-300/50'}`}
                    >
                        <Icon name={t.icon} size={14} />
                        {t.label}
                    </button>
                ))}
            </div>

            <div className="fade-in transition-all duration-500">
                {activeTab === 'objectives' && <ObjectivesTab />}
                {activeTab === 'goals' && <GoalsTab />}
            </div>

            {editingTodo && (
                <EditTodoModal 
                    todo={editingTodo} 
                    onClose={() => setEditingTodo(null)} 
                    onSave={updateTodo} 
                />
            )}
        </div>
    );
};

export default Actions;