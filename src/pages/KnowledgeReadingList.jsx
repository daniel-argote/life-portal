import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import Icon from '../components/Icon';

const KnowledgeReadingList = ({ user, notify }) => {
    const [readingList, setReadingList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showAdd, setShowAdd] = useState(false);
    const [form, setForm] = useState({ title: '', author: '', type: 'book', status: 'queued' });

    const fetchReadingList = useCallback(async () => {
        if (!user) return;
        const { data } = await supabase.from('reading_list').select('*').order('created_at', { ascending: false });
        setReadingList(data || []);
    }, [user]);

    useEffect(() => { fetchReadingList(); }, [fetchReadingList]);

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!form.title) return;
        setLoading(true);
        const { error } = await supabase.from('reading_list').insert([{ ...form, user_id: user.id }]);
        if (!error) {
            setForm({ title: '', author: '', type: 'book', status: 'queued' });
            setShowAdd(false);
            fetchReadingList();
            if (notify) notify('Added to reading list');
        }
        setLoading(false);
    };

    const updateStatus = async (id, status) => {
        const { error } = await supabase.from('reading_list').update({ status }).eq('id', id);
        if (!error) fetchReadingList();
    };

    const deleteItem = async (id) => {
        const { error } = await supabase.from('reading_list').delete().eq('id', id);
        if (!error) { fetchReadingList(); if (notify) notify('Removed from list'); }
    };

    return (
        <div className="space-y-8 pb-20">
            <div className="flex justify-between items-center">
                <h3 className="text-2xl font-black text-base-content">Resource Queue</h3>
                <button onClick={() => setShowAdd(!showAdd)} className="bg-primary/10 text-primary px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-primary hover:text-primary-content transition-all">
                    <Icon name={showAdd ? "X" : "Plus"} size={18} />
                    {showAdd ? "Cancel" : "Add Resource"}
                </button>
            </div>

            {showAdd && (
                <form onSubmit={handleAdd} className="bg-base-200 p-8 rounded-[2.5rem] border border-base-300 shadow-xl space-y-4 animate-in slide-in-from-top-4 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input placeholder="Title" className="w-full bg-base-100 p-4 rounded-xl font-bold outline-none border-2 border-transparent focus:border-primary" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                        <input placeholder="Author / Source" className="w-full bg-base-100 p-4 rounded-xl font-bold outline-none border-2 border-transparent focus:border-primary" value={form.author} onChange={e => setForm({ ...form, author: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <select className="w-full bg-base-100 p-4 rounded-xl font-bold outline-none" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                            <option value="book">Book</option>
                            <option value="article">Article</option>
                            <option value="paper">Research Paper</option>
                            <option value="video">Video / Course</option>
                            <option value="other">Other</option>
                        </select>
                        <select className="w-full bg-base-100 p-4 rounded-xl font-bold outline-none" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                            <option value="queued">Queued</option>
                            <option value="reading">Currently Reading</option>
                            <option value="finished">Finished</option>
                        </select>
                    </div>
                    <button disabled={loading} className="w-full bg-primary text-primary-content py-4 rounded-xl font-black shadow-lg">Add to Knowledge Base</button>
                </form>
            )}

            <div className="grid grid-cols-1 gap-4">
                {readingList.map(item => (
                    <div key={item.id} className="bg-base-200 p-6 rounded-[2rem] border border-base-300 flex flex-col md:flex-row md:items-center gap-6 group transition-all hover:border-primary/30 shadow-sm">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                            <Icon name={item.type === 'book' ? 'Book' : 'FileText'} size={24} />
                        </div>
                        <div className="flex-1">
                            <h4 className="text-xl font-black text-base-content">{item.title}</h4>
                            <p className="text-xs font-bold text-slate-600 uppercase tracking-widest mt-1">{item.author} • {item.type}</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <select 
                                className={`text-xs font-black uppercase tracking-widest px-4 py-2 rounded-lg border-2 transition-all outline-none
                                    ${item.status === 'finished' ? 'bg-success/10 border-success/20 text-success' : 
                                      item.status === 'reading' ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-500' : 
                                      'bg-base-300/50 border-transparent text-slate-600'}`}
                                value={item.status}
                                onChange={(e) => updateStatus(item.id, e.target.value)}
                            >
                                <option value="queued">Queued</option>
                                <option value="reading">Reading</option>
                                <option value="finished">Finished</option>
                            </select>
                            <button onClick={() => deleteItem(item.id)} className="text-slate-600 hover:text-danger opacity-0 group-hover:opacity-100 transition-all p-2">
                                <Icon name="Trash2" size={20} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default KnowledgeReadingList;
