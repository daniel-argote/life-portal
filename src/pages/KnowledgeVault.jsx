import Icon from '../components/Icon';

const KnowledgeVault = ({ vault, noteForm, setNoteForm, addNote, deleteItem }) => (
    <div className="space-y-8 pb-20">
        <div className="bg-white dark:bg-slate-800 p-10 rounded-[3rem] border border-slate-100 dark:border-slate-700 shadow-sm space-y-4">
            <input
                className="w-full text-2xl font-black outline-none placeholder:text-slate-200 dark:placeholder:text-slate-600 bg-transparent dark:text-white"
                placeholder="Focus Title"
                value={noteForm.title}
                onChange={e => setNoteForm({ ...noteForm, title: e.target.value })}
            />
            <textarea
                className="w-full h-40 outline-none text-slate-500 dark:text-slate-600 font-medium resize-none text-lg placeholder:text-slate-200 dark:placeholder:text-slate-600 bg-transparent"
                placeholder="Capture details..."
                value={noteForm.content}
                onChange={e => setNoteForm({ ...noteForm, content: e.target.value })}
            />
            <div className="flex justify-end pt-4">
                <button onClick={addNote} className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all">
                    Vault Data
                </button>
            </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {vault.map(v => (
                <div key={v.id} className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-50 dark:border-slate-700 shadow-sm group hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-4">
                        <h4 className="font-black text-xl text-slate-800 dark:text-slate-200">{v.title}</h4>
                        <button onClick={() => deleteItem('vault', v.id)} className="opacity-0 group-hover:opacity-100 text-slate-200 hover:text-red-500 transition-all">
                            <Icon name="Trash2" size={18} />
                        </button>
                    </div>
                    <p className="text-slate-500 dark:text-slate-600 font-medium whitespace-pre-wrap text-sm leading-relaxed">{v.content}</p>
                </div>
            ))}
        </div>
    </div>
);

export default KnowledgeVault;
