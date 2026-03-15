import { useState, useRef, useEffect, useMemo } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import Icon from '../components/Icon';
import EditableHeader from '../components/EditableHeader';

const Assistant = ({ user, notify, pageName, setPageName, showHeaders, profile, logs, vault, todos, events }) => {
    const [messages, setMessages] = useState([
        { role: 'assistant', text: "Hello! I'm your Portal Assistant. How can I help you manage your day?" }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef(null);

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const debugModels = async () => {
        const rawKey = profile?.gemini_api_key || import.meta.env.VITE_GEMINI_API_KEY;
        const sanitizedKey = rawKey?.replace(/[^a-zA-Z0-9_\-]/g, '');
        if (!sanitizedKey) return notify("No key to test", "error");
        
        try {
            console.log("Assistant: Fetching models...");
            const response = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${sanitizedKey}`);
            const data = await response.json();
            console.log("Assistant: Available Models:", data);
            notify("Check console for model list");
        } catch (e) {
            console.error("Assistant: ListModels failed", e);
            notify("ListModels failed. Check console.", "error");
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        
        const rawKey = profile?.gemini_api_key || import.meta.env.VITE_GEMINI_API_KEY;
        if (!rawKey || !input.trim()) {
            if (!rawKey) notify("Gemini API Key missing. Check Settings.", "error");
            return;
        }

        const sanitizedKey = rawKey.replace(/[^a-zA-Z0-9_\-]/g, '');
        
        const userMessage = { role: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            const genAI = new GoogleGenerativeAI(sanitizedKey);
            const now = new Date();
            const dateString = now.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            // --- COMBINED INSTRUCTIONS & CONTEXT ---
            const fullContext = `
                SYSTEM INSTRUCTIONS:
                You are the "Life Portal Assistant." 
                1. Use the PORTAL DATA below as your primary source of truth.
                2. Be concise. 
                3. Do not offer medical, legal, or financial advice.
                4. Stay focused on Portal-related tasks.
                5. Do not hallucinate data. If it's not here, say "I don't see that in your portal yet."

                CURRENT TIME: ${dateString}

                PORTAL DATA SNAPSHOT:
                - Active Todos: ${todos.map(t => t.task).join(', ') || 'None'}
                - Recent Journal Entries: ${logs.slice(0, 5).map(l => l.content).join(' | ') || 'None'}
                - Upcoming Events: ${events.map(e => `${e.title} (${new Date(e.start_time).toLocaleString()})`).join(', ') || 'None'}
                - Knowledge Vault Items: ${vault.map(v => v.title).join(', ') || 'None'}
            `;

            const model = genAI.getGenerativeModel(
                { model: "gemini-2.5-flash" },
                { apiVersion: 'v1' }
            );

            // 3. Prepare History
            const history = messages
                .filter((m, i) => i > 0 || m.role !== 'assistant')
                .map(m => ({
                    role: m.role === 'assistant' ? 'model' : 'user',
                    parts: [{ text: m.text }],
                }));

            // Grounding: Prepend the full context to the current user input
            const groundedInput = `${fullContext}\n\nUSER MESSAGE: ${input}`;

            const chat = model.startChat({ history });
            const result = await chat.sendMessage(groundedInput);
            const response = await result.response;
            
            const assistantMessage = { role: 'assistant', text: response.text() };
            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            console.error("Gemini Error:", error);
            if (error.message?.includes('429')) {
                notify("Free tier quota reached. Wait 60 seconds.", "error");
            } else if (error.message?.includes('Headers')) {
                notify("API Key format error. Re-save it in Settings.", "error");
            } else {
                notify("Assistant encountered an error", "error");
            }
        } finally {
            setLoading(false);
        }
    };

    // For the UI check
    const hasKey = !!(profile?.gemini_api_key || import.meta.env.VITE_GEMINI_API_KEY);

    return (
        <div className="flex flex-col h-[calc(100vh-12rem)] max-w-4xl mx-auto space-y-6">
            {showHeaders && (
                <div className="flex justify-between items-start">
                    <EditableHeader 
                        value={pageName} 
                        onSave={setPageName} 
                        subtext="AI-Powered Intelligence" 
                    />
                    <button 
                        onClick={debugModels}
                        className="p-2 text-slate-600 hover:text-primary transition-colors opacity-20 hover:opacity-100"
                        title="Debug API"
                    >
                        <Icon name="Bug" size={16} />
                    </button>
                </div>
            )}

            {!hasKey ? (
                <div className="flex-1 flex items-center justify-center p-6">
                    <div className="bg-white dark:bg-slate-800 p-10 rounded-[3rem] border border-slate-100 dark:border-slate-700 shadow-xl max-w-md w-full text-center space-y-8 animate-in fade-in zoom-in duration-500">
                        <div className="w-20 h-20 bg-primary/10 text-primary rounded-3xl flex items-center justify-center mx-auto">
                            <Icon name="Bot" size={40} />
                        </div>
                        
                        <div className="space-y-2">
                            <h3 className="text-2xl font-black dark:text-white">Activate Assistant</h3>
                            <p className="text-slate-600 font-bold text-sm">To use the AI features, you'll need to link a Gemini API key.</p>
                        </div>

                        <div className="space-y-4 text-left">
                            <p className="text-[10px] font-black uppercase tracking-widest text-primary text-center">Setup Guide</p>
                            <div className="space-y-3">
                                {[
                                    { step: 1, text: "Visit Google AI Studio", link: "https://aistudio.google.com/app/apikey" },
                                    { step: 2, text: "Click 'Create API Key'", link: null },
                                    { step: 3, text: "Copy the key to Settings > Assistant", link: null }
                                ].map((s, i) => (
                                    <div key={i} className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-transparent hover:border-primary/20 transition-all group">
                                        <span className="w-6 h-6 bg-white dark:bg-slate-800 rounded-lg flex items-center justify-center text-xs font-black shadow-sm group-hover:bg-primary group-hover:text-primary-content transition-all">{s.step}</span>
                                        {s.link ? (
                                            <a href={s.link} target="_blank" rel="noreferrer" className="text-sm font-bold text-base-content hover:text-primary transition-colors flex items-center gap-2">
                                                {s.text} <Icon name="ExternalLink" size={14} />
                                            </a>
                                        ) : (
                                            <p className="text-sm font-bold text-base-content">{s.text}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="pt-4 text-[10px] font-black text-slate-600 uppercase tracking-tighter">
                            Free tier allows 15 requests per minute
                        </div>
                    </div>
                </div>
            ) : (
                /* Chat Area */
                <div className="flex-1 bg-base-200 rounded-[2.5rem] border border-base-300 shadow-inner overflow-hidden flex flex-col">
                    <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
                        {messages.map((m, i) => (
                            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] p-5 rounded-3xl font-bold leading-relaxed
                                    ${m.role === 'user' 
                                        ? 'bg-primary text-primary-content rounded-tr-none' 
                                        : 'bg-base-100 text-base-content rounded-tl-none border border-base-300 shadow-sm'}`}
                                >
                                    {m.text}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex justify-start animate-pulse">
                                <div className="bg-base-100 p-5 rounded-3xl rounded-tl-none border border-base-300 flex items-center gap-2">
                                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.2s]" />
                                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.4s]" />
                                </div>
                            </div>
                        )}
                        <div ref={scrollRef} />
                    </div>

                    {/* Input Area */}
                    <form onSubmit={handleSendMessage} className="p-4 bg-base-300/30 border-t border-base-300">
                        <div className="flex gap-2 bg-base-100 p-2 rounded-2xl border-2 border-transparent focus-within:border-primary transition-all">
                            <input
                                className="flex-1 bg-transparent px-4 py-2 font-bold outline-none text-base-content"
                                placeholder="Ask me anything..."
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                disabled={loading}
                            />
                            <button 
                                disabled={!input.trim() || loading}
                                className="bg-primary text-primary-content p-3 rounded-xl shadow-lg disabled:opacity-50 hover:scale-105 active:scale-95 transition-all"
                            >
                                <Icon name="Send" size={20} />
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default Assistant;