import { useState, useEffect } from 'react';
import { supabase, isConfigured } from './lib/supabaseClient';
import Auth from './pages/Auth';
import Layout from './components/Layout';

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    // Initial session fetch
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const notify = (text, type = 'success') => {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 3000);
  };

  if (!isConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <div className="max-w-md bg-white p-10 rounded-[2.5rem] shadow-2xl border border-red-50">
          <h2 className="text-red-600 font-black text-2xl mb-4">Portal Offline</h2>
          <p className="text-slate-500 font-medium mb-6">Configuration error detected. Check your .env file.</p>
        </div>
      </div>
    );
  }

  if (loading) return null; // Or a full-page loader

  return (
    <>
      {msg && <div className={`fixed top-6 right-6 z-[100] px-8 py-4 rounded-2xl text-white font-black shadow-2xl animate-in slide-in-from-top-4 duration-300 ${msg.type === 'error' ? 'bg-red-500' : 'bg-slate-900'}`}>{msg.text}</div>}
      {!session ? <Auth onAuthError={notify} onAuthSuccess={notify} /> : <Layout key={session.user.id} user={session.user} />}
    </>
  )
}

export default App