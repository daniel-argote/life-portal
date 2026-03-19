import { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { supabase } from '../lib/supabaseClient';
import Icon from '../components/Icon';
import DatePicker from '../components/DatePicker';
import { format } from 'date-fns';
import PageContainer from '../components/PageContainer';

const ActionObjectives = ({ user, notify, todos, todoLabels, fetchData }) => {
    const [editingTodo, setEditingTodo] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [viewMode, setViewMode] = useState('kanban'); // 'kanban', 'list', 'timeline'
    const [loading, setLoading] = useState(false);
    const [showLabelManager, setShowLabelManager] = useState(false);
    const [search, setSearch] = useState('');
    const [selectedLabels, setSelectedLabels] = useState([]);

    const filteredTodos = todos.filter(t => {
        const matchesSearch = t.task.toLowerCase().includes(search.toLowerCase());
        const matchesLabels = selectedLabels.length === 0 || selectedLabels.every(id => t.label_ids?.includes(id));
        return matchesSearch && matchesLabels;
    });

    const updateTodo = async (id, updates) => {
        setLoading(true);
        if (updates.due_date === '') updates.due_date = null;
        const { error } = await supabase.from('todos').update(updates).eq('id', id);
        if (error) {
            notify(error, 'error');
        } else {
            fetchData();
            notify('Objective updated');
            setEditingTodo(null);
        }
        setLoading(false);
    };

    const deleteTodo = async (id) => {
        const { error } = await supabase.from('todos').delete().eq('id', id);
        if (error) {
            notify(error, 'error');
        } else {
            fetchData(); 
            notify('Objective removed'); 
        }
    };

    const addTask = async (task, dueDate, description = '', label_ids = []) => {
        if (!task.trim()) return;
        setLoading(true);
        const { error } = await supabase.from('todos').insert([{ 
            task, 
            due_date: dueDate || null, 
            description,
            label_ids,
            status: 'todo', 
            user_id: user.id,
            position: todos.filter(t => t.status === 'todo').length
        }]);
        if (error) {
            notify(error, 'error');
        } else {
            fetchData(); 
            notify('Objective added'); 
            setShowAddModal(false);
        }
        setLoading(false);
    };

    const handleAddLabel = async (name, color) => {
        const { error } = await supabase.from('todo_labels').insert([{ name, color, user_id: user.id }]).select();
        if (!error) fetchData();
        else notify(error, 'error');
    };

    const handleDeleteLabel = async (id) => {
        const { error } = await supabase.from('todo_labels').delete().eq('id', id);
        if (!error) fetchData();
        else notify(error, 'error');
    };

    const onDragEnd = async (result) => {
        if (!result.destination) return;
        const { source, destination, draggableId } = result;
        if (source.droppableId === destination.droppableId && source.index === destination.index) return;

        const updates = { status: destination.droppableId };
        if (destination.droppableId === 'done') updates.completed_at = new Date().toISOString();
        else if (source.droppableId === 'done') updates.completed_at = null;

        const { error } = await supabase.from('todos').update(updates).eq('id', draggableId);
        if (!error) fetchData();
    };

    const columns = {
        todo: { title: 'To Do', icon: 'Circle' },
        progress: { title: 'In Progress', icon: 'Clock' },
        done: { title: 'Complete', icon: 'CheckCircle2' }
    };

    const LabelManagerModal = ({ onClose }) => {
        const [name, setName] = useState('');
        const [color, setColor] = useState('#6366f1');
        const colors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#64748b'];

        return (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4 animate-in fade-in duration-300">
                <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-[3rem] shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden flex flex-col">
                    <header className="p-8 pb-4 flex justify-between items-start">
                        <div>
                            <h3 className="text-2xl font-black dark:text-white leading-none">Manage Labels</h3>
                            <p className="text-[10px] font-black uppercase tracking-widest text-primary mt-1">Categorization Library</p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl transition-all">
                            <Icon name="X" size={24} />
                        </button>
                    </header>
                    <div className="p-8 pt-4 space-y-6">
                        <div className="flex gap-2">
                            <input 
                                value={name} 
                                onChange={e => setName(e.target.value)} 
                                placeholder="Label Name" 
                                className="flex-1 bg-slate-50 dark:bg-slate-900 p-3 rounded-xl font-bold outline-none border-2 border-transparent focus:border-primary"
                            />
                            <button 
                                onClick={() => { handleAddLabel(name, color); setName(''); }}
                                className="bg-primary text-white p-3 rounded-xl hover:scale-105 transition-transform"
                            >
                                <Icon name="Plus" size={20} />
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {colors.map(c => (
                                <button 
                                    key={c} 
                                    onClick={() => setColor(c)} 
                                    className={`w-8 h-8 rounded-full border-2 transition-all ${color === c ? 'border-primary scale-110 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'}`}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                        </div>
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                            {todoLabels.map(l => (
                                <div key={l.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-xl group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: l.color }} />
                                        <span className="font-bold dark:text-white text-sm">{l.name}</span>
                                    </div>
                                    <button onClick={() => handleDeleteLabel(l.id)} className="text-slate-400 hover:text-danger opacity-0 group-hover:opacity-100 transition-all">
                                        <Icon name="Trash2" size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const AddTodoModal = ({ onClose, onSave }) => {
        const [form, setForm] = useState({ 
            task: '', 
            description: '', 
            due_date: '',
            label_ids: []
        });

        const toggleLabel = (labelId) => {
            const current = form.label_ids || [];
            const next = current.includes(labelId)
                ? current.filter(id => id !== labelId)
                : [...current, labelId];
            setForm({ ...form, label_ids: next });
        };

        return (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
                <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-[3rem] shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden flex flex-col max-h-[90vh]">
                    <header className="p-8 pb-4 flex justify-between items-start">
                        <div className="space-y-1">
                            <h3 className="text-3xl font-black dark:text-white leading-none">New Objective</h3>
                            <p className="text-[10px] font-black uppercase tracking-widest text-primary">Mission Scope</p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl transition-all">
                            <Icon name="X" size={24} />
                        </button>
                    </header>
                    <div className="flex-1 overflow-y-auto p-8 pt-4 space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Task Name</label>
                            <input autoFocus value={form.task} onChange={e => setForm({...form, task: e.target.value})} placeholder="What needs to be done?" className="w-full bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl font-bold border-2 border-transparent focus:border-primary outline-none transition-all text-xl" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Timeline</label>
                            <DatePicker value={form.due_date} onChange={val => setForm({...form, due_date: val})} />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Labels</label>
                            <div className="flex flex-wrap gap-2 p-2">
                                {todoLabels.map(l => (
                                    <button 
                                        key={l.id} 
                                        onClick={() => toggleLabel(l.id)}
                                        className={`px-3 py-1.5 rounded-lg font-bold text-[10px] uppercase transition-all flex items-center gap-2 ${form.label_ids?.includes(l.id) ? 'shadow-md scale-105' : 'opacity-40 grayscale hover:grayscale-0 hover:opacity-100'}`}
                                        style={{ backgroundColor: l.color, color: 'white' }}
                                    >
                                        {l.name}
                                        {form.label_ids?.includes(l.id) && <Icon name="Check" size={10} />}
                                    </button>
                                ))}
                                <button 
                                    onClick={() => setShowLabelManager(true)}
                                    className="px-3 py-1.5 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 text-slate-400 font-black text-[10px] uppercase hover:border-primary hover:text-primary transition-all"
                                >
                                    Manage
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Strategic Details</label>
                            <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Add context, sub-tasks, or notes..." className="w-full h-48 bg-slate-50 dark:bg-slate-900 p-5 rounded-[2rem] font-bold border-2 border-transparent focus:border-primary outline-none transition-all resize-none" />
                        </div>
                    </div>
                    <footer className="p-8 bg-slate-50 dark:bg-slate-900/50 flex gap-3">
                        <button onClick={onClose} className="flex-1 px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-800 transition-all">Cancel</button>
                        <button onClick={() => onSave(form.task, form.due_date, form.description, form.label_ids)} className="flex-[2] bg-primary text-primary-content px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all">Create Objective</button>
                    </footer>
                </div>
            </div>
        );
    };

    const EditTodoModal = ({ todo, onClose, onSave }) => {
        const [form, setForm] = useState({ 
            task: todo.task || '', 
            description: todo.description || '', 
            due_date: todo.due_date || '',
            status: todo.status || 'todo',
            label_ids: todo.label_ids || []
        });

        const toggleLabel = (labelId) => {
            const current = form.label_ids || [];
            const next = current.includes(labelId)
                ? current.filter(id => id !== labelId)
                : [...current, labelId];
            setForm({ ...form, label_ids: next });
        };

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
                            <input value={form.task} onChange={e => setForm({...form, task: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl font-bold border-2 border-transparent focus:border-primary outline-none transition-all text-xl" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Timeline</label>
                                <DatePicker value={form.due_date} onChange={val => setForm({...form, due_date: val})} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Status</label>
                                <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl font-bold border-2 border-transparent focus:border-primary outline-none appearance-none cursor-pointer">
                                    <option value="todo">To Do</option>
                                    <option value="progress">In Progress</option>
                                    <option value="done">Complete</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Labels</label>
                            <div className="flex flex-wrap gap-2 p-2">
                                {todoLabels.map(l => (
                                    <button 
                                        key={l.id} 
                                        onClick={() => toggleLabel(l.id)}
                                        className={`px-3 py-1.5 rounded-lg font-bold text-[10px] uppercase transition-all flex items-center gap-2 ${form.label_ids?.includes(l.id) ? 'shadow-md scale-105' : 'opacity-40 grayscale hover:grayscale-0 hover:opacity-100'}`}
                                        style={{ backgroundColor: l.color, color: 'white' }}
                                    >
                                        {l.name}
                                        {form.label_ids?.includes(l.id) && <Icon name="Check" size={10} />}
                                    </button>
                                ))}
                                <button 
                                    onClick={() => setShowLabelManager(true)}
                                    className="px-3 py-1.5 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 text-slate-400 font-black text-[10px] uppercase hover:border-primary hover:text-primary transition-all"
                                >
                                    Manage
                                </button>
                            </div>
                        </div>

                        {todo.completed_at && (
                            <div className="bg-success/10 p-4 rounded-2xl border border-success/20 flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase tracking-widest text-success">Mission Completed</span>
                                <span className="font-bold text-success text-sm">{format(new Date(todo.completed_at), 'MMMM do, yyyy')}</span>
                            </div>
                        )}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Strategic Details</label>
                            <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Add context, sub-tasks, or notes..." className="w-full h-48 bg-slate-50 dark:bg-slate-900 p-5 rounded-[2rem] font-bold border-2 border-transparent focus:border-primary outline-none transition-all resize-none" />
                        </div>
                    </div>
                    <footer className="p-8 bg-slate-50 dark:bg-slate-900/50 flex gap-3">
                        <button onClick={onClose} className="flex-1 px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-800 transition-all">Cancel</button>
                        <button onClick={() => onSave(todo.id, form)} className="flex-[2] bg-primary text-primary-content px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all">Save Changes</button>
                    </footer>
                </div>
            </div>
        );
    };

    const AddTaskForm = () => {
        const [task, setTask] = useState('');
        const [dueDate, setDueDate] = useState('');
        return (
            <form onSubmit={(e) => { e.preventDefault(); addTask(task, dueDate); setTask(''); setDueDate(''); }} className="bg-base-200 p-6 rounded-[2rem] border border-base-300 shadow-sm flex flex-col md:flex-row gap-4">
                <input value={task} onChange={(e) => setTask(e.target.value)} placeholder="New Objective..." className="flex-1 bg-base-100 p-4 rounded-xl font-bold outline-none text-base-content border-2 border-transparent focus:border-primary transition-all" />
                <div className="w-full md:w-64"><DatePicker value={dueDate} onChange={setDueDate} /></div>
                <div className="flex gap-2">
                    <button aria-label="Add Objective" type="submit" disabled={loading} className="bg-primary text-primary-content p-4 rounded-xl font-bold shadow-lg hover:scale-105 transition-transform"><Icon name="Plus" size={24} /></button>
                    <button type="button" onClick={() => setShowAddModal(true)} className="bg-base-300 text-slate-600 p-4 rounded-xl font-bold hover:bg-base-400 transition-all shadow-lg" title="Open Full Form"><Icon name="Maximize2" size={20} /></button>
                </div>
            </form>
        );
    };

    const toggleSelectedLabel = (id) => {
        setSelectedLabels(prev => prev.includes(id) ? prev.filter(l => l !== id) : [...prev, id]);
    };

    return (
        <PageContainer>
            <AddTaskForm />
            
            {/* Unified Filters & Search */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-base-200 p-4 rounded-2xl border border-base-300">
                <div className="flex-1 flex items-center gap-4 w-full">
                    <div className="relative flex-1 max-w-md">
                        <Icon name="Search" size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                            value={search} 
                            onChange={e => setSearch(e.target.value)} 
                            placeholder="Search objectives..." 
                            className="w-full pl-10 pr-4 py-2 bg-base-100 rounded-xl font-bold outline-none border-2 border-transparent focus:border-primary text-sm"
                        />
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {todoLabels.map(l => (
                            <button 
                                key={l.id} 
                                onClick={() => toggleSelectedLabel(l.id)}
                                className={`px-3 py-1 rounded-lg font-black text-[8px] uppercase transition-all ${selectedLabels.includes(l.id) ? 'shadow-md scale-105 opacity-100' : 'opacity-40 grayscale hover:grayscale-0 hover:opacity-100'}`}
                                style={{ backgroundColor: l.color, color: 'white' }}
                            >
                                {l.name}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setViewMode('kanban')} className={`p-2 rounded-lg transition-all ${viewMode === 'kanban' ? 'bg-primary text-primary-content shadow-md' : 'bg-base-300 text-slate-600'}`} title="Kanban Board"><Icon name="Layout" size={20} /></button>
                    <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-primary text-primary-content shadow-md' : 'bg-base-300 text-slate-600'}`} title="List View"><Icon name="List" size={20} /></button>
                    <button onClick={() => setViewMode('timeline')} className={`p-2 rounded-lg transition-all ${viewMode === 'timeline' ? 'bg-primary text-primary-content shadow-md' : 'bg-base-300 text-slate-600'}`} title="Timeline / History"><Icon name="History" size={20} /></button>
                </div>
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
                                        {filteredTodos.filter(t => t.status === id).length}
                                    </span>
                                </header>
                                <Droppable droppableId={id}>
                                    {(provided) => (
                                        <div {...provided.droppableProps} ref={provided.innerRef} className="flex-1 space-y-3">
                                            {filteredTodos.filter(t => t.status === id).map((todo, index) => (
                                                <Draggable key={todo.id} draggableId={todo.id} index={index}>
                                                    {(provided, snapshot) => (
                                                        <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} onClick={() => setEditingTodo(todo)} className={`bg-base-100 p-5 rounded-2xl border-2 transition-all group cursor-pointer ${snapshot.isDragging ? 'border-primary shadow-2xl scale-[1.02] z-50' : 'border-transparent shadow-sm hover:border-primary/20'}`}>
                                                            <div className="flex justify-between items-start mb-2">
                                                                <div className="space-y-2">
                                                                    <div className="flex flex-wrap gap-1">
                                                                        {todo.label_ids?.map(labelId => {
                                                                            const label = todoLabels.find(l => l.id === labelId);
                                                                            if (!label) return null;
                                                                            return <div key={labelId} className="w-6 h-1 rounded-full" style={{ backgroundColor: label.color }} title={label.name} />;
                                                                        })}
                                                                    </div>
                                                                    <p className="font-bold text-base-content leading-snug">{todo.task}</p>
                                                                </div>
                                                                <button onClick={(e) => { e.stopPropagation(); deleteTodo(todo.id); }} className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-danger transition-all"><Icon name="X" size={14} /></button>
                                                            </div>
                                                            <div className="flex flex-wrap gap-2 mt-2">
                                                                {todo.due_date && (
                                                                    <div className="flex items-center gap-1.5 text-[10px] font-black text-primary uppercase tracking-tighter">
                                                                        <Icon name="Calendar" size={10} />
                                                                        {format(new Date(todo.due_date.replace(/-/g, '/')), 'MMM d')}
                                                                    </div>
                                                                )}
                                                                {todo.completed_at && (
                                                                    <div className="flex items-center gap-1.5 text-[10px] font-black text-success uppercase tracking-tighter">
                                                                        <Icon name="CheckCircle2" size={10} />
                                                                        {format(new Date(todo.completed_at), 'MMM d')}
                                                                    </div>
                                                                )}
                                                            </div>
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
            ) : viewMode === 'list' ? (
                <div className="space-y-3">
                    {filteredTodos.map(todo => (
                        <div key={todo.id} onClick={() => setEditingTodo(todo)} className="bg-base-200 p-4 rounded-2xl border border-base-300 flex items-center gap-4 group cursor-pointer hover:border-primary/20 transition-all">
                            <div className={`w-2 h-2 rounded-full ${todo.status === 'done' ? 'bg-success' : todo.status === 'progress' ? 'bg-indigo-500' : 'bg-slate-300'}`} />
                            <div className="flex-1">
                                <div className="flex items-center gap-3">
                                    <p className={`font-bold ${todo.status === 'done' ? 'line-through text-slate-600' : 'text-base-content'}`}>{todo.task}</p>
                                    <div className="flex gap-1">
                                        {todo.label_ids?.map(labelId => {
                                            const label = todoLabels.find(l => l.id === labelId);
                                            if (!label) return null;
                                            return <div key={labelId} className="px-2 py-0.5 rounded text-[8px] font-black text-white uppercase" style={{ backgroundColor: label.color }}>{label.name}</div>;
                                        })}
                                    </div>
                                </div>
                                <div className="flex gap-4 mt-1">
                                    {todo.due_date && <p className="text-[10px] font-black text-primary uppercase">Due {format(new Date(todo.due_date.replace(/-/g, '/')), 'MMMM do')}</p>}
                                    {todo.completed_at && <p className="text-[10px] font-black text-success uppercase">Completed {format(new Date(todo.completed_at), 'MMMM do')}</p>}
                                </div>
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); deleteTodo(todo.id); }} className="text-slate-600 hover:text-danger opacity-0 group-hover:opacity-100 p-2 transition-all"><Icon name="Trash2" size={18} /></button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="space-y-8 max-w-3xl mx-auto py-10">
                    {/* Timeline View */}
                    {filteredTodos
                        .filter(t => t.status === 'done')
                        .sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at))
                        .map((todo) => (
                            <div key={todo.id} className="relative pl-8 border-l-4 border-slate-200 dark:border-slate-700 pb-8 last:pb-0">
                                <div className="absolute -left-3 top-0 w-5 h-5 rounded-full bg-success ring-4 ring-white dark:ring-slate-900 shadow-sm" />
                                <div className="bg-base-200 p-6 rounded-3xl border border-base-300 shadow-sm">
                                    <div className="flex justify-between items-start mb-2">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{format(new Date(todo.completed_at), 'MMMM do, yyyy')}</p>
                                        <div className="flex gap-1">
                                            {todo.label_ids?.map(labelId => {
                                                const label = todoLabels.find(l => l.id === labelId);
                                                if (!label) return null;
                                                return <div key={labelId} className="w-2 h-2 rounded-full" style={{ backgroundColor: label.color }} />;
                                            })}
                                        </div>
                                    </div>
                                    <h4 className="text-xl font-black text-base-content leading-tight mb-2">{todo.task}</h4>
                                    <p className="text-sm text-slate-500 font-bold">{todo.description || "Mission accomplished."}</p>
                                </div>
                            </div>
                        ))}
                    {filteredTodos.filter(t => t.status === 'done').length === 0 && (
                        <div className="text-center py-20 bg-base-200 rounded-[3rem] border-2 border-dashed border-base-300">
                            <Icon name="History" size={48} className="mx-auto text-slate-300 mb-4" />
                            <p className="font-black text-slate-400 uppercase tracking-widest text-xs">No historical missions recorded in the current timeframe.</p>
                        </div>
                    )}
                </div>
            )}
            {editingTodo && <EditTodoModal todo={editingTodo} onClose={() => setEditingTodo(null)} onSave={updateTodo} />}
            {showAddModal && <AddTodoModal onClose={() => setShowAddModal(false)} onSave={addTask} />}
            {showLabelManager && <LabelManagerModal onClose={() => setShowLabelManager(false)} />}
        </PageContainer>
    );
};

export default ActionObjectives;
