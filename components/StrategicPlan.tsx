import React, { useState, useEffect } from 'react';
import { PlanResponse, StrategicPlan as IStrategicPlan, TaskItem } from '../types';
import { generateStrategicPlan } from '../services/geminiService';
import { Loader2, CheckCircle2, Target, Calendar, Circle, Save, Trash2, Trophy, BarChart3, ChevronRight, AlertCircle, Download } from 'lucide-react';

const StrategicPlan: React.FC = () => {
  const [idea, setIdea] = useState('');
  const [stage, setStage] = useState('Idea Phase');
  const [plan, setPlan] = useState<PlanResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const savedPlan = localStorage.getItem('aurelia_strategic_plan');
    const savedIdea = localStorage.getItem('aurelia_business_idea');
    if (savedPlan) {
        try { 
            const parsed = JSON.parse(savedPlan);
            if (parsed.days30 && parsed.days30.objectives && typeof parsed.days30.objectives[0] === 'string') {
                localStorage.removeItem('aurelia_strategic_plan');
                setPlan(null);
            } else {
                setPlan(parsed); 
            }
        } catch (e) {
             setPlan(null);
        }
    }
    if (savedIdea) setIdea(savedIdea);
  }, []);

  useEffect(() => {
    if (plan) localStorage.setItem('aurelia_strategic_plan', JSON.stringify(plan));
  }, [plan]);

  const transformPeriod = (p: any): IStrategicPlan => ({
    ...p,
    tasks: p.tasks.map((t: any) => ({
        text: t.text,
        completed: false,
        subtasks: t.subtasks?.map((st: string) => ({ text: st, completed: false })) || []
    }))
  });

  const handleGenerate = async () => {
    if (!idea) return;
    setLoading(true);
    setError(null);
    localStorage.setItem('aurelia_business_idea', idea);
    try {
      const result: any = await generateStrategicPlan(idea, stage);
      if (result) {
          const transformedPlan: PlanResponse = {
              days30: transformPeriod(result.days30),
              days60: transformPeriod(result.days60),
              days90: transformPeriod(result.days90),
          };
          setPlan(transformedPlan);
      }
    } catch (e) { 
        console.error(e);
        setError("Protocol generation failed. Please check your connection and try again.");
    } 
    finally { setLoading(false); }
  };

  const toggleTask = (periodKey: 'days30' | 'days60' | 'days90', taskIndex: number) => {
      if (!plan) return;
      const newPlan = { ...plan };
      const tasks = [...newPlan[periodKey].tasks];
      tasks[taskIndex] = { ...tasks[taskIndex], completed: !tasks[taskIndex].completed };
      newPlan[periodKey].tasks = tasks;
      setPlan(newPlan);
  };

  const toggleSubTask = (periodKey: 'days30' | 'days60' | 'days90', taskIndex: number, subTaskIndex: number) => {
      if (!plan) return;
      const newPlan = { ...plan };
      const tasks = [...newPlan[periodKey].tasks];
      const task = { ...tasks[taskIndex] };
      const subtasks = [...(task.subtasks || [])];
      
      subtasks[subTaskIndex] = { ...subtasks[subTaskIndex], completed: !subtasks[subTaskIndex].completed };
      task.subtasks = subtasks;
      tasks[taskIndex] = task;
      newPlan[periodKey].tasks = tasks;
      setPlan(newPlan);
  };

  const deleteObjective = (periodKey: 'days30' | 'days60' | 'days90', objIndex: number, e: React.MouseEvent) => {
      e.stopPropagation();
      if (!plan) return;
      if (window.confirm("Remove this objective?")) {
        const newPlan = { ...plan };
        const objectives = [...newPlan[periodKey].objectives];
        objectives.splice(objIndex, 1);
        newPlan[periodKey].objectives = objectives;
        setPlan(newPlan);
      }
  };

  const deleteTask = (periodKey: 'days30' | 'days60' | 'days90', taskIndex: number, e: React.MouseEvent) => {
      e.stopPropagation();
      if (!plan) return;
      if (window.confirm("Purge task tree?")) {
        const newPlan = { ...plan };
        const tasks = [...newPlan[periodKey].tasks];
        tasks.splice(taskIndex, 1);
        newPlan[periodKey].tasks = tasks;
        setPlan(newPlan);
      }
  };

  const deleteSubTask = (periodKey: 'days30' | 'days60' | 'days90', taskIndex: number, subTaskIndex: number, e: React.MouseEvent) => {
      e.stopPropagation();
      if (!plan) return;
      const newPlan = { ...plan };
      const tasks = [...newPlan[periodKey].tasks];
      const task = { ...tasks[taskIndex] };
      const subtasks = [...(task.subtasks || [])];
      subtasks.splice(subTaskIndex, 1);
      task.subtasks = subtasks;
      tasks[taskIndex] = task;
      newPlan[periodKey].tasks = tasks;
      setPlan(newPlan);
  };

  const deletePlan = () => {
      if (window.confirm("Wipe strategic data?")) {
          setPlan(null);
          setIdea('');
          localStorage.removeItem('aurelia_strategic_plan');
          localStorage.removeItem('aurelia_business_idea');
      }
  };

  const handleExport = () => {
      if (!plan) return;
      
      let markdown = `# Strategic Execution Protocol\n\n**Mission:** ${idea}\n**Stage:** ${stage}\n\n`;
      
      const periods: Array<{key: 'days30' | 'days60' | 'days90', title: string}> = [
          { key: 'days30', title: '30 Day Protocol' },
          { key: 'days60', title: '60 Day Protocol' },
          { key: 'days90', title: '90 Day Protocol' }
      ];

      periods.forEach(({key, title}) => {
          const p = plan[key];
          markdown += `## ${title}: ${p.focus}\n\n`;
          markdown += `### Objectives\n`;
          p.objectives.forEach(obj => {
              markdown += `- **${obj.main}**\n`;
              obj.keyResults.forEach(kr => markdown += `  - [ ] ${kr}\n`);
          });
          markdown += `\n### Tasks\n`;
          p.tasks.forEach(task => {
              markdown += `- [${task.completed ? 'x' : ' '}] **${task.text}**\n`;
              task.subtasks?.forEach(st => {
                  markdown += `  - [${st.completed ? 'x' : ' '}] ${st.text}\n`;
              });
          });
          markdown += `\n---\n\n`;
      });

      const blob = new Blob([markdown], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Aurelia_Strategy_Plan_${new Date().toISOString().slice(0,10)}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
  };

  const calculateProgress = (tasks: TaskItem[]) => {
      let total = 0;
      let completed = 0;
      tasks.forEach(t => {
          total++;
          if(t.completed) completed++;
          if(t.subtasks) {
              t.subtasks.forEach(st => {
                  total++;
                  if(st.completed) completed++;
              })
          }
      });
      if (total === 0) return 0;
      return Math.round((completed / total) * 100);
  };

  const PlanColumn: React.FC<{ data: IStrategicPlan; color: string; periodKey: 'days30' | 'days60' | 'days90' }> = ({ data, color, periodKey }) => {
      const progress = calculateProgress(data.tasks);
      
      const glowColor = color === 'text-cyan-400' ? '#22d3ee' : color === 'text-aurelia-400' ? '#f5a623' : '#a855f7';
      const borderColor = color === 'text-cyan-400' ? 'border-cyan-500/50' : color === 'text-aurelia-400' ? 'border-aurelia-500/50' : 'border-purple-500/50';

      return (
        <div className={`flex-1 min-w-[350px] bg-black/40 backdrop-blur-md rounded-2xl border ${borderColor} shadow-lg flex flex-col h-full overflow-hidden group`}>
          <div className="p-6 border-b border-white/5 relative overflow-hidden">
            <div className={`absolute top-0 right-0 p-4 opacity-10 ${color}`}>
                <BarChart3 size={64} />
            </div>
            
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-[10px] font-bold bg-white/5 border border-white/10 ${color} font-mono uppercase`}>
                      {data.period}
                  </span>
              </div>
              <div className={`text-xl font-bold font-mono ${color}`}>{progress}%</div>
            </div>
            
            {/* Cyber Progress Bar */}
            <div className="w-full bg-white/5 h-1.5 rounded-full mb-4 overflow-hidden">
                <div 
                    className={`h-full ${color.replace('text-', 'bg-')} shadow-[0_0_10px_${glowColor}]`} 
                    style={{ width: `${progress}%`, transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)' }}
                ></div>
            </div>

            <div className="text-sm font-medium text-slate-300 font-mono tracking-tight">{data.focus}</div>
          </div>
          
          <div className="p-4 flex-1 space-y-6 overflow-y-auto custom-scrollbar">
            <div>
              <h4 className="text-[10px] font-bold text-slate-500 uppercase mb-3 flex items-center gap-2 font-mono tracking-widest">
                <Target size={12} /> Objectives & Key Results
              </h4>
              <ul className="space-y-3">
                {data.objectives.map((obj, i) => (
                  <li key={i} className="text-xs text-slate-300 bg-white/5 p-3 rounded border-l-2 border-white/10 hover:border-white/30 transition-colors group/obj relative">
                    <div className="font-bold mb-2 flex items-start gap-2 pr-4">
                        <span className={`${color}`}>•</span> {obj.main}
                        <button 
                            onClick={(e) => deleteObjective(periodKey, i, e)}
                            className="absolute top-2 right-2 opacity-0 group-hover/obj:opacity-100 p-1 text-slate-500 hover:text-red-500 transition-opacity"
                        >
                            <Trash2 size={12} />
                        </button>
                    </div>
                    {obj.keyResults && obj.keyResults.length > 0 && (
                        <div className="pl-2 space-y-1 border-l border-white/5 ml-1">
                            {obj.keyResults.map((kr, k) => (
                                <div key={k} className="text-[10px] text-slate-400 pl-2 font-mono flex items-center gap-2">
                                    <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                                    {kr}
                                </div>
                            ))}
                        </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
            <div>
               <h4 className="text-[10px] font-bold text-slate-500 uppercase mb-3 flex items-center gap-2 font-mono tracking-widest">
                <CheckCircle2 size={12} /> Execution Log
              </h4>
              <ul className="space-y-2">
                {data.tasks.map((task, i) => (
                  <li key={i} className="bg-black/20 rounded-lg p-2 hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
                      {/* Main Task */}
                      <div 
                        onClick={() => toggleTask(periodKey, i)}
                        className={`group/item flex items-start gap-3 text-sm p-2 cursor-pointer transition-all ${
                            task.completed ? 'opacity-50' : 'opacity-100'
                        }`}
                      >
                        <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-all ${
                            task.completed 
                            ? 'bg-green-500 border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' 
                            : 'border-slate-600 bg-transparent group-hover/item:border-aurelia-400'
                        }`}>
                            {task.completed && <CheckCircle2 size={12} className="text-black" />}
                        </div>
                        <span className={`flex-1 text-xs leading-relaxed font-bold ${task.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                            {task.text}
                        </span>
                        <button 
                            onClick={(e) => deleteTask(periodKey, i, e)}
                            className="opacity-0 group-hover/item:opacity-100 p-1 text-slate-500 hover:text-red-500 transition-opacity"
                        >
                            <Trash2 size={12} />
                        </button>
                      </div>
                      
                      {/* Subtasks */}
                      {task.subtasks && task.subtasks.length > 0 && (
                          <div className="ml-4 pl-3 border-l border-white/10 mt-1 space-y-1 pb-1">
                              {task.subtasks.map((st, j) => (
                                  <div 
                                    key={j}
                                    onClick={() => toggleSubTask(periodKey, i, j)}
                                    className="group/subitem flex items-center gap-2 p-1.5 rounded hover:bg-white/5 cursor-pointer"
                                  >
                                     <div className={`w-3 h-3 rounded border flex items-center justify-center flex-shrink-0 transition-all ${
                                        st.completed 
                                        ? 'bg-green-500/50 border-green-500/50' 
                                        : 'border-slate-700 bg-transparent group-hover/subitem:border-cyan-400/50'
                                     }`}>
                                        {st.completed && <CheckCircle2 size={10} className="text-white" />}
                                     </div>
                                     <span className={`flex-1 text-[10px] font-mono ${st.completed ? 'line-through text-slate-600' : 'text-slate-400'}`}>
                                         {st.text}
                                     </span>
                                     <button 
                                        onClick={(e) => deleteSubTask(periodKey, i, j, e)}
                                        className="opacity-0 group-hover/subitem:opacity-100 p-0.5 text-slate-600 hover:text-red-500 transition-opacity"
                                    >
                                        <Trash2 size={10} />
                                    </button>
                                  </div>
                              ))}
                          </div>
                      )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      );
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      {!plan && (
        <div className="glass-panel p-8 rounded-2xl shadow-glow border border-white/10 max-w-2xl mx-auto w-full mt-10 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-aurelia-500 via-cyan-500 to-purple-500"></div>
          
          <h2 className="text-2xl font-bold text-white mb-2 font-mono tracking-tight">INITIALIZE STRATEGY</h2>
          <p className="text-slate-400 mb-8 text-sm">Input mission parameters. System will generate a 90-day execution protocol with granular sub-tasks.</p>
          
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-aurelia-500 mb-2 font-mono uppercase tracking-widest">Target Objective (Business Idea)</label>
              <textarea 
                className="w-full p-4 bg-black/40 border border-white/10 rounded-xl focus:border-aurelia-500 focus:ring-1 focus:ring-aurelia-500 focus:outline-none text-white placeholder-slate-600 transition-all"
                rows={3}
                placeholder="e.g., Autonomous drone delivery network for rural medicine..."
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-cyan-500 mb-2 font-mono uppercase tracking-widest">Current Status</label>
              <select 
                className="w-full p-4 bg-black/40 border border-white/10 rounded-xl focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none text-white transition-all appearance-none"
                value={stage}
                onChange={(e) => setStage(e.target.value)}
              >
                <option>Concept Phase</option>
                <option>Prototyping (MVP)</option>
                <option>Market Entry</option>
                <option>Growth Scaling</option>
              </select>
            </div>

            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-mono flex items-center gap-2 animate-fade-in">
                    <AlertCircle size={14} />
                    {error}
                </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={loading || !idea}
              className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-aurelia-400 transition-all shadow-glow flex items-center justify-center gap-3 disabled:opacity-50 uppercase tracking-widest text-sm"
            >
              {loading ? <Loader2 className="animate-spin" /> : 'GENERATE PROTOCOL'}
            </button>
          </div>
        </div>
      )}

      {plan && (
        <div className="flex flex-col h-full animate-fade-in-up">
            <div className="flex justify-between items-center mb-6 flex-shrink-0">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-bold text-white font-mono tracking-wider">STRATEGIC_MAP</h2>
                    <span className="text-[10px] bg-white/5 text-aurelia-400 px-3 py-1 rounded-full border border-aurelia-500/20 font-mono animate-pulse-slow">
                        STATUS: ACTIVE
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={handleExport}
                        className="flex items-center gap-2 text-xs text-aurelia-400 hover:bg-aurelia-500/10 px-4 py-2 rounded-lg transition-colors border border-aurelia-500/20 uppercase tracking-wider font-bold"
                    >
                        <Download size={14} /> EXPORT
                    </button>
                    <button 
                        onClick={deletePlan} 
                        className="flex items-center gap-2 text-xs text-red-500 hover:bg-red-500/10 px-4 py-2 rounded-lg transition-colors border border-transparent hover:border-red-500/30 uppercase tracking-wider font-bold"
                    >
                        <Trash2 size={14} /> ABORT
                    </button>
                </div>
            </div>
            <div className="flex gap-6 overflow-x-auto pb-4 h-full snap-x scrollbar-hide">
                <PlanColumn data={plan.days30} color="text-cyan-400" periodKey="days30" />
                <PlanColumn data={plan.days60} color="text-aurelia-400" periodKey="days60" />
                <PlanColumn data={plan.days90} color="text-purple-400" periodKey="days90" />
            </div>
        </div>
      )}
    </div>
  );
};

export default StrategicPlan;