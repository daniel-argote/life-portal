import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import Icon from '../components/Icon';

const Auth = ({ onAuthSuccess, onAuthError }) => {
    const [authMode, setAuthMode] = useState('login');
    const [loading, setLoading] = useState(false);

    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        const email = e.target.email.value;
        const password = e.target.password.value;

        const { error } = authMode === 'login'
            ? await supabase.auth.signInWithPassword({ email, password })
            : await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: window.location.origin + window.location.pathname
                }
            });

        if (error) onAuthError(error.message);
        else if (authMode === 'signup') onAuthSuccess("Account created! Check email if required.");
        
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white fade-in">
            <div className="w-full max-w-sm">
                <div className="text-center mb-12">
                    <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] mx-auto flex items-center justify-center text-white shadow-2xl shadow-indigo-100 mb-6">
                        <Icon name="LayoutDashboard" size={36} />
                    </div>
                    <h1 className="text-4xl font-black tracking-tighter">Life Portal</h1>
                    <p className="text-slate-400 mt-2 font-bold uppercase tracking-widest text-[10px]">Neural Interface v0.0.1</p>
                </div>

                <form onSubmit={handleAuth} className="space-y-4">
                    <input name="email" type="email" placeholder="Identity Email" className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-[1.5rem] outline-none focus:ring-2 focus:ring-indigo-600 font-bold" required />
                    <input name="password" type="password" placeholder="Access Key" className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-[1.5rem] outline-none focus:ring-2 focus:ring-indigo-600 font-bold" required />
                    <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white font-bold py-5 rounded-[1.5rem] shadow-xl hover:bg-black transition-all active:scale-95 disabled:opacity-50">
                        {loading ? 'Processing...' : (authMode === 'login' ? 'Authenticate' : 'Register Identity')}
                    </button>
                </form>

                <div className="mt-10 text-center">
                    <button onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')} className="text-indigo-600 font-black text-sm uppercase tracking-widest hover:text-indigo-800">
                        {authMode === 'login' ? "Request New Access" : "Existing Identity? Login"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Auth;