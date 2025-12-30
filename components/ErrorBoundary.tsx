import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-full bg-void-900 flex items-center justify-center p-6 text-center font-sans">
            <div className="max-w-md w-full glass-panel p-8 rounded-2xl border border-red-500/30 shadow-[0_0_30px_rgba(239,68,68,0.2)] relative overflow-hidden">
                <div className="absolute inset-0 bg-red-500/5 animate-pulse pointer-events-none"></div>
                <div className="relative z-10 flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-6 border border-red-500/20">
                        <AlertTriangle size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-white font-mono tracking-widest mb-2">SYSTEM_CRITICAL_FAILURE</h1>
                    <p className="text-slate-400 text-sm font-mono mb-8">
                        An unrecoverable error has occurred in the neural interface.
                        <br/>
                        <span className="text-red-400 text-xs mt-2 block opacity-75">{this.state.error?.message || "Unknown Error"}</span>
                    </p>
                    <button 
                        onClick={this.handleReload}
                        className="flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-bold font-mono tracking-wider transition-all shadow-[0_0_15px_rgba(239,68,68,0.4)] hover:shadow-[0_0_25px_rgba(239,68,68,0.6)]"
                    >
                        <RefreshCw size={18} /> REBOOT_SYSTEM
                    </button>
                </div>
            </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;