import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Brain, 
  Scale, 
  Map, 
  TrendingUp, 
  TerminalSquare, 
  BookOpen,
  Menu,
  X,
  ChevronRight,
  ArrowRight,
  History,
  Trash2,
  Clock,
  Copy,
  Check,
  Zap,
  Cpu,
  Loader2
} from 'lucide-react';
import ThinkingPartner from './components/ThinkingPartner';
import StrategicPlan from './components/StrategicPlan';
import Regulatory from './components/Regulatory';
import { AppView, PromptHistoryItem } from './types';
import { optimizePrompt } from './services/geminiService';

// --- Small Inline Components for Simpler Views ---

const FundraisingView = () => (
    <div className="p-8 max-w-4xl mx-auto glass-panel rounded-2xl shadow-glow border border-white/5 transition-all">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2 font-mono tracking-tight">
            <TrendingUp className="text-aurelia-500" /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-aurelia-400 to-aurelia-600">FUNDRAISING_PROTOCOL</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/5 p-6 rounded-xl border border-white/5 hover:border-aurelia-500/30 transition-colors">
                <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><Cpu size={16} className="text-cyan-400"/> Investor Signal</h3>
                <ul className="space-y-4 text-sm text-slate-400">
                    <li className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-slate-200">
                            <div className="w-1.5 h-1.5 bg-aurelia-500 rounded-full"></div> 
                            <strong>Problem: Hair on Fire Urgency</strong>
                        </div>
                        <p className="pl-3.5 text-xs leading-relaxed text-slate-500">
                            Don't just describe a nuisance. Quantify the bleeding. "Customers are losing $X/hour manually doing this." If it's not urgent, it's a feature, not a company.
                        </p>
                    </li>
                    <li className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-slate-200">
                            <div className="w-1.5 h-1.5 bg-aurelia-500 rounded-full"></div> 
                            <strong>Solution: Why Now?</strong>
                        </div>
                        <p className="pl-3.5 text-xs leading-relaxed text-slate-500">
                             Link your solution to a recent macro shift (e.g., "AI makes this 100x cheaper"). Investors fear missing a platform shift. Prove you are the specific team to execute this.
                        </p>
                    </li>
                    <li className="flex flex-col gap-1">
                         <div className="flex items-center gap-2 text-slate-200">
                            <div className="w-1.5 h-1.5 bg-aurelia-500 rounded-full"></div> 
                            <strong>Traction: Velocity &gt; Totals</strong>
                        </div>
                         <p className="pl-3.5 text-xs leading-relaxed text-slate-500">
                            Investors value speed. 10% Month-over-Month growth is better than a stagnant 10k users. Show retention cohorts—are users staying?
                        </p>
                    </li>
                    <li className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-slate-200">
                            <div className="w-1.5 h-1.5 bg-aurelia-500 rounded-full"></div> 
                            <strong>Unit Economics: The Machine</strong>
                        </div>
                        <p className="pl-3.5 text-xs leading-relaxed text-slate-500">
                            Demonstrate LTV/CAC ratio &gt; 3:1. Prove that putting $1 in yields $3 out. If you're pre-revenue, show the theoretical math based on competitor benchmarks.
                        </p>
                    </li>
                </ul>
            </div>
            <div className="bg-white/5 p-6 rounded-xl border border-white/5 hover:border-aurelia-500/30 transition-colors">
                <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><Scale size={16} className="text-cyan-400"/> Path Selection</h3>
                <div className="space-y-4 text-sm text-slate-400">
                    <div className="p-3 rounded-lg bg-black/20 border border-white/5">
                        <strong className="text-aurelia-400 block mb-1">Bootstrapping</strong>
                        Control retained. Slower velocity. Immediate cash flow focus.
                    </div>
                    <div className="p-3 rounded-lg bg-black/20 border border-white/5">
                        <strong className="text-cyan-400 block mb-1">Venture Capital</strong>
                        Hyper-growth expectation. Equity dilution. Unicorn potential required.
                    </div>
                </div>
            </div>
        </div>
    </div>
);

const PromptBuilderView = () => {
    const [goal, setGoal] = useState('');
    const [context, setContext] = useState('');
    const [result, setResult] = useState('');
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState<PromptHistoryItem[]>([]);
    const [copied, setCopied] = useState(false);
    const [copiedHistoryId, setCopiedHistoryId] = useState<string | null>(null);

    useEffect(() => {
        const saved = localStorage.getItem('aurelia_prompt_history');
        if (saved) {
            try {
                setHistory(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse history", e);
            }
        }
    }, []);

    const saveHistory = (newItem: PromptHistoryItem) => {
        setHistory(prevHistory => {
            const updated = [newItem, ...prevHistory].slice(0, 50); // Keep last 50 items
            localStorage.setItem('aurelia_prompt_history', JSON.stringify(updated));
            return updated;
        });
    };

    const handleGenerate = async () => {
        if (!goal.trim()) return;
        setLoading(true);
        const res = await optimizePrompt(goal, context);
        setResult(res);
        setLoading(false);

        if (res && !res.startsWith("Error") && !res.startsWith("Could not")) {
            saveHistory({
                id: Date.now().toString(),
                goal,
                context,
                result: res,
                timestamp: Date.now()
            });
        }
    }

    const loadHistoryItem = (item: PromptHistoryItem) => {
        setGoal(item.goal);
        setContext(item.context);
        setResult(item.result);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setHistory(prevHistory => {
            const updated = prevHistory.filter(h => h.id !== id);
            localStorage.setItem('aurelia_prompt_history', JSON.stringify(updated));
            return updated;
        });
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(result);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleCopyHistory = (e: React.MouseEvent, text: string, id: string) => {
        e.stopPropagation();
        navigator.clipboard.writeText(text);
        setCopiedHistoryId(id);
        setTimeout(() => setCopiedHistoryId(null), 2000);
    };

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            <div className="glass-panel p-6 rounded-2xl shadow-glow border border-white/10">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3 font-mono">
                    <TerminalSquare className="text-aurelia-500" /> 
                    <span>PROMPT_ENGINEERING_MODULE</span>
                </h2>
                <div className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-aurelia-500 mb-2 tracking-widest uppercase">Target Objective</label>
                        <input 
                            className="w-full p-4 bg-black/40 border border-white/10 rounded-lg text-sm text-white focus:border-aurelia-500 focus:ring-1 focus:ring-aurelia-500 focus:outline-none transition-all placeholder-slate-600" 
                            placeholder="e.g., Write a cold email to potential beta testers"
                            value={goal}
                            onChange={e => setGoal(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-cyan-500 mb-2 tracking-widest uppercase">Context Parameters</label>
                        <textarea 
                            className="w-full p-4 bg-black/40 border border-white/10 rounded-lg text-sm text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none transition-all placeholder-slate-600" 
                            placeholder="Target audience, tone constraints, specific details..."
                            rows={3}
                            value={context}
                            onChange={e => setContext(e.target.value)}
                        />
                    </div>
                    <button 
                        onClick={handleGenerate}
                        disabled={loading || !goal}
                        className="w-full py-4 bg-gradient-to-r from-aurelia-600 to-aurelia-500 hover:from-aurelia-500 hover:to-aurelia-400 text-black font-bold rounded-lg text-sm tracking-wide disabled:opacity-50 transition-all shadow-[0_0_20px_rgba(245,166,35,0.3)] hover:shadow-[0_0_30px_rgba(245,166,35,0.5)] flex items-center justify-center"
                    >
                        {loading ? (
                            <div className="flex items-center gap-2">
                                <Loader2 className="animate-spin" size={16} />
                                <span>COMPUTING_OPTIMAL_STRUCTURE...</span>
                            </div>
                        ) : 'INITIALIZE GENERATION'}
                    </button>
                </div>
            </div>
            
            {result && (
                <div className="glass-card p-6 rounded-xl border border-white/10 relative animate-fade-in">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-aurelia-500 to-cyan-500 rounded-t-xl"></div>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                            <Zap size={12} className="text-aurelia-500"/> Output Stream
                        </h3>
                        <button 
                            onClick={copyToClipboard}
                            className={`text-xs px-3 py-1.5 rounded flex items-center gap-2 transition-all border ${
                                copied 
                                ? 'bg-green-500/20 border-green-500/50 text-green-400' 
                                : 'bg-white/10 hover:bg-white/20 border-white/5 text-white hover:border-aurelia-500/30'
                            }`}
                        >
                            {copied ? <Check size={14} /> : <Copy size={14}/>}
                            {copied ? 'COPIED' : 'COPY'}
                        </button>
                    </div>
                    <p className="whitespace-pre-wrap leading-relaxed font-mono text-sm text-cyan-50">{result}</p>
                </div>
            )}

            {history.length > 0 && (
                <div className="border-t border-white/10 pt-8">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-sm font-bold text-slate-500 uppercase flex items-center gap-2 font-mono">
                            <History size={16} /> Data Logs
                        </h3>
                        <button 
                            onClick={() => {
                                if(window.confirm('Purge all logs?')) {
                                    setHistory([]);
                                    localStorage.removeItem('aurelia_prompt_history');
                                }
                            }}
                            className="text-xs text-red-500/70 hover:text-red-500 uppercase tracking-wider"
                        >
                            Purge All
                        </button>
                    </div>
                    <div className="space-y-3">
                        {history.map(item => (
                            <div 
                                key={item.id} 
                                onClick={() => loadHistoryItem(item)}
                                className="group bg-white/5 hover:bg-white/10 border border-white/5 hover:border-aurelia-500/50 p-4 rounded-lg cursor-pointer transition-all relative overflow-hidden"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <p className="font-semibold text-slate-200 text-sm truncate pr-20 font-mono">{item.goal}</p>
                                    <span className="text-[10px] text-slate-500 flex items-center gap-1 flex-shrink-0 font-mono">
                                        <Clock size={10} />
                                        {new Date(item.timestamp).toLocaleDateString()}
                                    </span>
                                </div>
                                <div className="bg-black/30 p-2 rounded border border-white/5 text-[10px] text-slate-400 font-mono truncate">
                                    {item.result}
                                </div>
                                
                                <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                    <button 
                                        onClick={(e) => handleCopyHistory(e, item.result, item.id)}
                                        className="p-1.5 text-slate-400 hover:text-cyan-400 bg-black/40 rounded-full transition-colors"
                                        title="Copy"
                                    >
                                        {copiedHistoryId === item.id ? <Check size={14} className="text-green-500"/> : <Copy size={14} />}
                                    </button>
                                    <button 
                                        onClick={(e) => deleteHistoryItem(item.id, e)}
                                        className="p-1.5 text-slate-400 hover:text-red-500 bg-black/40 rounded-full transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
};

const FoundationsView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
            { title: "Legal Structures", content: "LLC vs C-Corp. For most solo founders, an LLC offers liability protection with pass-through taxation." },
            { title: "IP Protection", content: "Trademarks protect brand names. Copyrights protect content. Patents protect inventions. Secure these early." },
            { title: "Cash Flow 101", content: "Cash is oxygen. Track 'Burn Rate' (monthly spend) and 'Runway' (months left of cash). Never run out of cash." },
            { title: "Contract Basics", content: "Always have a contract. Define scope, payment terms (Net-30), and termination clauses clearly." },
            { title: "Taxes", content: "Set aside 30% of revenue for taxes if you are profitable. Pay quarterly estimated taxes to avoid penalties." },
            { title: "Compliance", content: "Check local business licenses and permits. Digital businesses may still need physical registration." }
        ].map((card, i) => (
            <div key={i} className="glass-card p-6 rounded-xl relative group overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-aurelia-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <BookOpen className="text-aurelia-500 mb-4 group-hover:scale-110 transition-transform duration-500" size={24} />
                <h3 className="font-bold text-white mb-2 font-mono tracking-tight group-hover:text-aurelia-400 transition-colors">{card.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{card.content}</p>
            </div>
        ))}
    </div>
);

// --- Main App Component ---

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<AppView>(AppView.DASHBOARD);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Default to dark mode for futuristic theme
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  const navItems = [
    { id: AppView.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
    { id: AppView.THINKING_PARTNER, label: 'Thinking Partner', icon: Brain },
    { id: AppView.STRATEGIC_PLANNER, label: 'Strategic Plan', icon: Map },
    { id: AppView.REGULATORY, label: 'Regulatory', icon: Scale },
    { id: AppView.PROMPT_BUILDER, label: 'Prompt Engineer', icon: TerminalSquare },
    { id: AppView.FUNDRAISING, label: 'Fundraising', icon: TrendingUp },
    { id: AppView.FOUNDATIONS, label: 'Foundations', icon: BookOpen },
  ];

  const renderContent = () => {
    switch (activeView) {
      case AppView.THINKING_PARTNER: return <ThinkingPartner />;
      case AppView.STRATEGIC_PLANNER: return <StrategicPlan />;
      case AppView.REGULATORY: return <Regulatory />;
      case AppView.FUNDRAISING: return <FundraisingView />;
      case AppView.PROMPT_BUILDER: return <PromptBuilderView />;
      case AppView.FOUNDATIONS: return <FoundationsView />;
      default:
        return (
          <div className="space-y-8 animate-fade-in-up">
             <header className="mb-10 relative">
                <div className="absolute -left-10 -top-10 w-64 h-64 bg-aurelia-500/10 rounded-full blur-[100px] pointer-events-none"></div>
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 font-mono tracking-tight">
                    Greetings, <span className="text-transparent bg-clip-text bg-gradient-to-r from-aurelia-400 to-aurelia-600">Operator</span>.
                </h1>
                <p className="text-slate-400 max-w-xl text-lg">System nominal. Mental clarity check initiated. Ready to build the future?</p>
             </header>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <button onClick={() => setActiveView(AppView.THINKING_PARTNER)} className="group relative overflow-hidden glass-panel p-8 rounded-2xl hover:border-aurelia-500/50 transition-all text-left h-64 flex flex-col justify-between">
                    <div className="absolute inset-0 bg-gradient-to-br from-aurelia-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                    <div className="relative z-10">
                        <div className="w-12 h-12 rounded-lg bg-aurelia-500/20 flex items-center justify-center mb-6 text-aurelia-400 group-hover:scale-110 transition-transform duration-500 group-hover:shadow-[0_0_20px_rgba(245,166,35,0.4)]">
                            <Brain size={24} />
                        </div>
                        <h3 className="text-2xl font-bold mb-2 text-white font-mono">Neural Link</h3>
                        <p className="text-slate-400 text-sm">Brainstorm with Gemini 3 Pro. Reduce cognitive load.</p>
                    </div>
                    <div className="flex items-center gap-2 text-aurelia-400 text-sm font-bold opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                        INITIATE <ArrowRight size={14} />
                    </div>
                </button>

                 <button onClick={() => setActiveView(AppView.STRATEGIC_PLANNER)} className="group relative overflow-hidden glass-panel p-8 rounded-2xl hover:border-cyan-500/50 transition-all text-left h-64 flex flex-col justify-between">
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                    <div className="relative z-10">
                        <div className="w-12 h-12 rounded-lg bg-cyan-500/20 flex items-center justify-center mb-6 text-cyan-400 group-hover:scale-110 transition-transform duration-500 group-hover:shadow-[0_0_20px_rgba(6,182,212,0.4)]">
                            <Map size={24} />
                        </div>
                        <h3 className="text-2xl font-bold mb-2 text-white font-mono">Mission Map</h3>
                        <p className="text-slate-400 text-sm">30/60/90 Day Execution Protocols.</p>
                    </div>
                    <div className="flex items-center gap-2 text-cyan-400 text-sm font-bold opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                        DEPLOY <ArrowRight size={14} />
                    </div>
                </button>

                <button onClick={() => setActiveView(AppView.REGULATORY)} className="group relative overflow-hidden glass-panel p-8 rounded-2xl hover:border-white/30 transition-all text-left h-64 flex flex-col justify-between">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                    <div className="relative z-10">
                        <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center mb-6 text-white group-hover:scale-110 transition-transform duration-500">
                            <Scale size={24} />
                        </div>
                        <h3 className="text-2xl font-bold mb-2 text-white font-mono">Compliance AI</h3>
                        <p className="text-slate-400 text-sm">Decipher regulatory code and legal syntax.</p>
                    </div>
                    <div className="flex items-center gap-2 text-white text-sm font-bold opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                        ANALYZE <ArrowRight size={14} />
                    </div>
                </button>
             </div>

             <div className="glass-card border-l-4 border-l-aurelia-500 rounded-r-xl p-6 flex items-start gap-4 mt-8 bg-gradient-to-r from-aurelia-900/10 to-transparent">
                <div className="p-2 rounded-lg text-aurelia-400 animate-pulse-slow">
                    <Zap size={24} />
                </div>
                <div>
                    <h4 className="font-bold text-white mb-1 font-mono tracking-wide uppercase text-xs">System Insight</h4>
                    <p className="text-lg text-slate-200">"Demand validation is more important than product perfection. Sell the problem, not the solution."</p>
                </div>
             </div>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-void-900 text-slate-300 overflow-hidden font-sans bg-grid">
      {/* Sidebar Navigation */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 glass-panel backdrop-blur-xl transform transition-transform duration-500 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} border-r border-white/5`}>
        <div className="h-full flex flex-col relative overflow-hidden">
          {/* Decorative Glow */}
          <div className="absolute top-0 left-0 w-full h-32 bg-aurelia-500/10 blur-[60px] pointer-events-none"></div>

          <div className="p-8 flex items-center gap-4 relative z-10">
            <div className="w-10 h-10 bg-gradient-to-br from-aurelia-500 to-aurelia-700 rounded-xl flex items-center justify-center font-bold text-black shadow-glow">
                <span className="font-mono text-xl">A</span>
            </div>
            <span className="text-2xl font-bold tracking-tighter text-white font-mono">AURELIA</span>
            <button className="lg:hidden ml-auto text-white" onClick={() => setMobileMenuOpen(false)}><X size={20}/></button>
          </div>
          
          <nav className="flex-1 px-4 space-y-2 overflow-y-auto relative z-10 py-6">
            <p className="px-4 text-xs font-bold text-slate-600 uppercase tracking-widest mb-4 font-mono">Modules</p>
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveView(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-lg transition-all duration-300 group relative overflow-hidden ${
                  activeView === item.id 
                    ? 'bg-white/5 text-aurelia-400 border border-aurelia-500/30 shadow-[0_0_15px_rgba(245,166,35,0.1)]' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <div className={`absolute left-0 top-0 bottom-0 w-1 bg-aurelia-500 transition-all duration-300 ${activeView === item.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`}></div>
                <item.icon size={18} className={`transition-transform duration-300 ${activeView === item.id ? 'scale-110' : 'group-hover:scale-110'}`} />
                <span className="text-sm font-medium tracking-wide">{item.label}</span>
                {activeView === item.id && <ChevronRight size={14} className="ml-auto text-aurelia-500" />}
              </button>
            ))}
          </nav>

          <div className="p-6 border-t border-white/5 relative z-10">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
               <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center text-[10px] font-bold text-white shadow-glow-cyan">OP</div>
               <div className="flex-1 overflow-hidden">
                 <p className="text-xs font-bold text-white font-mono uppercase tracking-wider">Rohaan Shirke</p>
                 <p className="text-[10px] text-cyan-400 truncate flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> ONLINE</p>
               </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Background Grid Animation */}
        <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none z-0"></div>

        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between p-4 glass-panel border-b border-white/5 relative z-20">
            <div className="flex items-center gap-2 font-bold text-white font-mono">
                <span className="text-aurelia-500">AURELIA</span>
            </div>
            <button onClick={() => setMobileMenuOpen(true)} className="p-2 text-white">
                <Menu size={24} />
            </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 relative z-10 scrollbar-hide">
            <div className="max-w-7xl mx-auto h-full">
                <div key={activeView} className="h-full">
                    {renderContent()}
                </div>
            </div>
        </div>
      </main>
    </div>
  );
};

export default App;