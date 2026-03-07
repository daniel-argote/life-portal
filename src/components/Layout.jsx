import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import Command from '../pages/Command';
import Brain from '../pages/Brain';
import Log from '../pages/Log';
import Money from '../pages/Money';
import Health from '../pages/Health';

const Layout = ({ user }) => {
    const [tab, setTab] = useState('command');
    const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
    const [logs, setLogs] = useState([]);
    const [vault, setVault] = useState([]);
    const [input, setInput] = useState("");
    const [noteForm, setNoteForm] = useState({ title: '', content: '' });
    const [msg, setMsg] = useState(null);

    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [darkMode]);

    const notify = (text, type = 'success') => {
        setMsg({ text, type });
        setTimeout(() => setMsg(null), 3000);
    };

    const fetchData = useCallback(async () => {
        if (!user) return;
        const { data: l, error: logError } = await supabase.from('logs').select('*').order('created_at', { ascending: false });
        if (logError) notify('Could not fetch logs.', 'error');
        else setLogs(l || []);

        const { data: v, error: vaultError } = await supabase.from('vault').select('*').order('updated_at', { ascending: false });
        if (vaultError) notify('Could not fetch vault.', 'error');
        else setVault(v || []);
    }, [user]);

    useEffect(() => {
        if (user) fetchData();
    }, [user, fetchData]);

    const addLog = async () => {
        if (!input.trim()) return;
        const { error } = await supabase.from('logs').insert([{ content: input, user_id: user.id }]);
        if (!error) { setInput(""); fetchData(); notify("Logged"); }
        else notify("Save failed: Check database tables", "error");
    };

    const addNote = async () => {
        if (!noteForm.title.trim()) return;
        const { error } = await supabase.from('vault').insert([{ ...noteForm, user_id: user.id }]);
        if (!error) { setNoteForm({ title: '', content: '' }); fetchData(); notify("Vaulted"); }
        else notify("Save failed", "error");
    };

    const deleteItem = async (table, id) => {
        const { error } = await supabase.from(table).delete().eq('id', id);
        if (error) notify("Delete failed", "error");
        else fetchData();
    };

    return (
        <div className="min-h-screen md:pl-64 pb-20 md:pb-0 fade-in">
            {msg && <div className={`fixed top-6 right-6 z-[100] px-8 py-4 rounded-2xl text-white font-black shadow-2xl animate-in slide-in-from-top-4 duration-300 ${msg.type === 'error' ? 'bg-red-500' : 'bg-slate-900'}`}>{msg.text}</div>}

            <Sidebar tab={tab} setTab={setTab} darkMode={darkMode} setDarkMode={setDarkMode} />

            <main className="p-6 md:p-16 max-w-5xl mx-auto">
                {tab === 'command' && (
                    <Command logs={logs} vault={vault} />
                )}

                {tab === 'brain' && (
                    <Brain
                        vault={vault}
                        noteForm={noteForm}
                        setNoteForm={setNoteForm}
                        addNote={addNote}
                        deleteItem={deleteItem}
                    />
                )}

                {tab === 'log' && (
                    <Log
                        logs={logs}
                        input={input}
                        setInput={setInput}
                        addLog={addLog}
                        deleteItem={deleteItem}
                    />
                )}

                {tab === 'money' && <Money />}
                {tab === 'health' && <Health />}
            </main>

            <MobileNav tab={tab} setTab={setTab} />
        </div>
    );
};

export default Layout;