import React, { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { simplifyRegulation } from '../services/geminiService';
import { ComplianceResult } from '../types';
import { ShieldAlert, CheckSquare, FileText, Loader2, AlertTriangle, Scan, ShieldCheck, Download, Paperclip, X } from 'lucide-react';

const Regulatory: React.FC = () => {
  const [text, setText] = useState('');
  const [result, setResult] = useState<ComplianceResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<{data: string, mimeType: string} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // Remove data URL prefix for API
        const base64Data = base64String.split(',')[1];
        setSelectedImage({
          data: base64Data,
          mimeType: file.type
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSimplify = async () => {
    if (!text && !selectedImage) return;
    setLoading(true);
    setError(null);
    try {
      const data = await simplifyRegulation(text || "Please analyze the attached image.", selectedImage || undefined);
      setResult(data);
    } catch (e) {
      console.error(e);
      setError("Compliance analysis interrupted. Unable to process regulatory text or image.");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
      if (!result) return;
      const markdown = `# Regulatory Analysis\n\n**Risk Level:** ${result.riskLevel}\n\n### Simplified Explanation\n${result.simplified}\n\n### Action Items\n${result.actionItems.map(item => `- [ ] ${item}`).join('\n')}\n`;
      
      const blob = new Blob([markdown], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Aurelia_Compliance_Report_${new Date().toISOString().slice(0,10)}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full">
      {/* Input Section */}
      <div className="glass-panel p-6 rounded-2xl border border-white/10 flex flex-col h-full shadow-glow relative overflow-hidden">
        <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-3 font-mono tracking-wider">
          <Scan className="text-aurelia-500" size={20} />
          INPUT_DATA_STREAM
        </h2>
        
        {selectedImage && (
            <div className="mb-4 bg-black/40 border border-aurelia-500/50 p-3 rounded-lg flex items-center justify-between animate-fade-in">
                 <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded bg-white/10 overflow-hidden">
                         <img src={`data:${selectedImage.mimeType};base64,${selectedImage.data}`} alt="Preview" className="w-full h-full object-cover" />
                     </div>
                     <span className="text-xs text-aurelia-400 font-mono">DOCUMENT_SCANNED</span>
                 </div>
                 <button onClick={() => { setSelectedImage(null); if(fileInputRef.current) fileInputRef.current.value = ''; }} className="text-slate-500 hover:text-red-500"><X size={16}/></button>
            </div>
        )}

        <textarea
          className="flex-1 w-full p-4 bg-black/40 border border-white/10 rounded-xl focus:border-aurelia-500 focus:ring-1 focus:ring-aurelia-500 focus:outline-none resize-none text-sm font-mono text-slate-300 placeholder-slate-700 transition-all custom-scrollbar"
          placeholder="// Paste regulatory text sequence here or upload document image..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        
        <div className="flex items-center gap-4 mt-4">
             <input 
                type="file" 
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
            />
            <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-3 bg-white/5 border border-white/10 rounded-lg text-slate-400 hover:text-cyan-400 hover:border-cyan-400/50 transition-all"
                title="Upload Document Image"
            >
                <Paperclip size={20} />
            </button>

            <button
            onClick={handleSimplify}
            disabled={loading || (!text && !selectedImage)}
            className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-aurelia-500/50 text-white rounded-xl font-bold font-mono tracking-widest uppercase transition-all flex items-center justify-center gap-3 disabled:opacity-50 group"
            >
            {loading ? <Loader2 className="animate-spin text-aurelia-500" size={18} /> : (
                <>
                    <ShieldCheck size={18} className="text-aurelia-500 group-hover:scale-110 transition-transform"/> 
                    Execute Analysis
                </>
            )}
            </button>
        </div>

        {error && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400 text-xs font-mono animate-fade-in">
                <AlertTriangle size={14} className="flex-shrink-0"/>
                {error}
            </div>
        )}
      </div>

      {/* Output Section */}
      <div className="glass-card p-6 rounded-2xl border border-white/10 overflow-y-auto custom-scrollbar relative">
        <div className="absolute top-0 right-0 p-2 opacity-20">
            <FileText size={100} />
        </div>

        {!result ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-600">
            <ShieldAlert size={64} className="mb-6 opacity-20 animate-pulse" />
            <p className="text-center font-mono text-sm tracking-widest uppercase">Awaiting Input Data...</p>
          </div>
        ) : (
          <div className="space-y-6 animate-fade-in relative z-10">
             <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h3 className="font-bold text-white font-mono tracking-wider">ANALYSIS_REPORT</h3>
                <div className="flex items-center gap-3">
                    <button onClick={handleExport} className="p-1.5 rounded text-slate-400 hover:text-cyan-400 transition-colors" title="Export Report">
                        <Download size={16} />
                    </button>
                    <span className={`px-4 py-1.5 rounded text-xs font-bold font-mono uppercase tracking-widest border ${
                        result.riskLevel === 'High' ? 'bg-red-900/20 text-red-500 border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.2)]' :
                        result.riskLevel === 'Medium' ? 'bg-yellow-900/20 text-yellow-500 border-yellow-500/30' :
                        'bg-green-900/20 text-green-500 border-green-500/30 shadow-[0_0_10px_rgba(34,197,94,0.2)]'
                    }`}>
                        RISK_LEVEL: {result.riskLevel}
                    </span>
                </div>
             </div>

             <div className="bg-black/30 p-5 rounded-xl border border-white/5">
                 <h4 className="text-[10px] font-bold text-aurelia-500 uppercase mb-3 font-mono tracking-widest">Decoded Syntax</h4>
                 <div className="prose prose-invert prose-sm max-w-none text-slate-300 leading-relaxed font-sans">
                     <ReactMarkdown>{result.simplified}</ReactMarkdown>
                 </div>
             </div>

             <div>
                 <h4 className="text-[10px] font-bold text-cyan-500 uppercase mb-4 flex items-center gap-2 font-mono tracking-widest">
                    <CheckSquare size={12} /> Execution Protocols
                 </h4>
                 <div className="space-y-3">
                     {result.actionItems.map((item, idx) => (
                         <div key={idx} className="flex items-start gap-4 p-3 hover:bg-white/5 rounded-lg transition-colors border-l-2 border-transparent hover:border-cyan-500">
                             <span className="font-mono text-xs text-slate-500 mt-0.5">0{idx + 1}</span>
                             <span className="text-sm text-slate-300">{item}</span>
                         </div>
                     ))}
                 </div>
             </div>

             <div className="mt-8 pt-4 border-t border-white/5 flex gap-3 opacity-60 hover:opacity-100 transition-opacity">
                 <AlertTriangle className="text-aurelia-500 flex-shrink-0" size={16} />
                 <p className="text-[10px] text-slate-500 font-mono">
                     SYSTEM_NOTICE: AI output generated for informational purposes. Verify with legal entities before execution.
                 </p>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Regulatory;