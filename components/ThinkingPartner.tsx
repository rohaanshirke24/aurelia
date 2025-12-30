import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send, User, Bot, Loader2, Mic, MicOff, Volume2, X, Play, Square, Settings2, ChevronDown, Check, Activity, Copy, Gauge, Sliders, AlertCircle, WifiOff, Mic as MicIcon, Terminal, ShieldAlert, Paperclip, Image as ImageIcon } from 'lucide-react';
import { Message } from '../types';
import { sendChatMessage, generateSpeech } from '../services/geminiService';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';

// --- Visualizer Component ---
const AudioVisualizer = ({ isActive, color }: { isActive: boolean; color: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    if (!isActive || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    // Simulate frequency data for aesthetic purposes when active
    // Real implementation requires connecting to the AnalyserNode in the parent,
    // but for the "Live" effect, a generative visualizer is often smoother than raw PCM data without complex smoothing.
    const draw = () => {
        const width = canvas.width;
        const height = canvas.height;
        ctx.clearRect(0, 0, width, height);
        
        const bars = 20;
        const barWidth = width / bars;
        
        for (let i = 0; i < bars; i++) {
            // Generate random height based on time for "talking" effect
            const time = Date.now() / 150; 
            const heightMultiplier = Math.sin(time + i) * 0.5 + 0.5;
            const barHeight = heightMultiplier * height * 0.8;
            
            const x = i * barWidth;
            const y = (height - barHeight) / 2;
            
            ctx.fillStyle = color;
            ctx.globalAlpha = 0.6;
            ctx.fillRect(x + 1, y, barWidth - 2, barHeight);
        }
        animationId = requestAnimationFrame(draw);
    };
    
    draw();
    return () => cancelAnimationFrame(animationId);
  }, [isActive, color]);

  if (!isActive) return <div className="h-16 w-32 flex items-center justify-center text-xs text-slate-600 font-mono tracking-widest">SIGNAL_IDLE</div>;
  
  return <canvas ref={canvasRef} width={128} height={64} className="opacity-80" />;
};


// --- Aurelia Avatar Component ---
const AureliaAvatar = ({ state, size = 'md' }: { state: 'idle' | 'thinking' | 'speaking' | 'listening', size?: 'sm' | 'md' | 'lg' }) => {
    const sizeClasses = {
        sm: 'w-8 h-8',
        md: 'w-10 h-10',
        lg: 'w-64 h-64'
    };
    
    return (
        <div className={`relative flex items-center justify-center ${sizeClasses[size]} animate-fade-in-up`}>
             {/* Glow */}
            <div className={`absolute inset-0 rounded-full blur-2xl transition-all duration-500 ${
                state === 'thinking' ? 'bg-cyan-500/20 scale-110' :
                state === 'speaking' ? 'bg-aurelia-500/30 scale-125' :
                state === 'listening' ? 'bg-red-500/10 scale-100' :
                'bg-aurelia-500/5 scale-90'
            }`}></div>

            {/* Tech Rings */}
            <div className={`absolute inset-0 border border-white/10 rounded-full ${
                state === 'thinking' ? 'animate-[spin_2s_linear_infinite] border-cyan-500/30 border-t-transparent' :
                state === 'speaking' ? 'animate-[spin_4s_linear_infinite] border-aurelia-500/30 border-b-transparent' :
                'animate-pulse border-white/5'
            }`}></div>
            
            <div className={`absolute inset-2 border border-white/5 rounded-full ${
                 state === 'thinking' ? 'animate-[spin_3s_linear_infinite_reverse]' : ''
            }`}></div>

            {/* Core */}
            <div className={`relative rounded-full transition-all duration-300 ${size === 'lg' ? 'w-20 h-20' : 'w-2 h-2'} ${
                state === 'thinking' ? 'bg-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.8)] animate-pulse' :
                state === 'speaking' ? 'bg-aurelia-400 shadow-[0_0_30px_rgba(250,204,21,0.8)] animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]' :
                state === 'listening' ? 'bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)] animate-pulse' :
                'bg-aurelia-500 shadow-[0_0_10px_rgba(245,166,35,0.5)]'
            }`}></div>
        </div>
    );
};

const ThinkingPartner: React.FC = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      content: "Neural interface initialized. I am Aurelia, your AI co-founder. I specialize in reducing decision fatigue and navigating the psychological hurdles of building alone. How can I lighten your cognitive load today?",
      timestamp: new Date()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [userContext, setUserContext] = useState('');
  
  // Image Upload State
  const [selectedImage, setSelectedImage] = useState<{data: string, mimeType: string} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Voice Mode States
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [isMicMuted, setIsMicMuted] = useState(false);
  
  // TTS States
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState('Kore');
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);
  const [speechRate, setSpeechRate] = useState(1.0);
  const [speechPitch, setSpeechPitch] = useState(0); 
  
  // Copy State
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);
  
  // Voice Mode Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sessionRef = useRef<Promise<any> | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourceNodesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const recognitionRef = useRef<any>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  
  // TTS Refs
  const ttsAudioContextRef = useRef<AudioContext | null>(null);
  const activeTtsSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const voices = [
    { name: 'Kore', label: 'Kore (Balanced)', type: 'Female' },
    { name: 'Puck', label: 'Puck (Energetic)', type: 'Male' },
    { name: 'Charon', label: 'Charon (Deep)', type: 'Male' },
    { name: 'Fenrir', label: 'Fenrir (Strong)', type: 'Male' },
    { name: 'Zephyr', label: 'Zephyr (Calm)', type: 'Female' },
  ];

  // Load Context on Mount
  useEffect(() => {
    const savedIdea = localStorage.getItem('aurelia_business_idea');
    const savedPlan = localStorage.getItem('aurelia_strategic_plan');
    let contextStr = "";
    if (savedIdea) contextStr += `User Business Idea: ${savedIdea}\n`;
    if (savedPlan) {
         try {
             const plan = JSON.parse(savedPlan);
             contextStr += `Current Phase: ${plan.days30?.focus || 'Unknown'}\n`;
         } catch(e) {}
    }
    setUserContext(contextStr);
  }, []);

  // --- Helper Functions ---
  function base64ToArrayBuffer(base64: string) {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  async function decodeAudioData(
    data: ArrayBuffer,
    ctx: AudioContext,
    sampleRate: number = 24000
  ): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data);
    const frameCount = dataInt16.length;
    const buffer = ctx.createBuffer(1, frameCount, sampleRate);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i] / 32768.0;
    }
    return buffer;
  }

  function createBlob(data: Float32Array): { data: string; mimeType: string } {
      const l = data.length;
      const int16 = new Int16Array(l);
      for (let i = 0; i < l; i++) {
          int16[i] = Math.max(-1, Math.min(1, data[i])) * 32767;
      }
      let binary = '';
      const bytes = new Uint8Array(int16.buffer);
      const len = bytes.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return {
        data: btoa(binary),
        mimeType: 'audio/pcm;rate=16000',
      };
  }

  // --- TTS Logic ---
  const stopTtsAudio = () => {
    if (activeTtsSourceRef.current) {
        try { activeTtsSourceRef.current.stop(); } catch (e) { }
        activeTtsSourceRef.current = null;
    }
    setPlayingMessageId(null);
  };

  const handlePlayMessage = async (msg: Message) => {
      if (playingMessageId === msg.id) {
          stopTtsAudio();
          return;
      }
      stopTtsAudio();
      setPlayingMessageId(msg.id);
      setIsGeneratingAudio(true);
      try {
          const base64Audio = await generateSpeech(msg.content, selectedVoice);
          if (!base64Audio) throw new Error("No audio generated");
          if (!ttsAudioContextRef.current) {
              ttsAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
          }
          const ctx = ttsAudioContextRef.current;
          const audioBuf = await decodeAudioData(base64ToArrayBuffer(base64Audio), ctx);
          const source = ctx.createBufferSource();
          source.buffer = audioBuf;
          source.playbackRate.value = speechRate;
          source.detune.value = speechPitch;
          source.connect(ctx.destination);
          activeTtsSourceRef.current = source;
          source.onended = () => {
              setPlayingMessageId(null);
              activeTtsSourceRef.current = null;
          };
          source.start();
          setIsGeneratingAudio(false);
      } catch (error) {
          console.error("Failed to play audio", error);
          setPlayingMessageId(null);
          setIsGeneratingAudio(false);
      }
  };

  // --- Chat Logic ---
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowVoiceSettings(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        if (ttsAudioContextRef.current) {
            ttsAudioContextRef.current.close();
        }
    };
  }, []);

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

  const handleSend = async () => {
    if ((!input.trim() && !selectedImage) || isLoading) return;
    
    // Create new message with potential image data
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input || (selectedImage ? "[Image Uploaded]" : ""),
      timestamp: new Date(),
      image: selectedImage || undefined // Store image in message for history
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    
    const imageToSend = selectedImage;
    setSelectedImage(null); // Clear after sending

    try {
      // Build history with support for images from previous messages
      // CRITICAL: Filter out the 'welcome' message to avoid sending a Model-first history to the API
      // This often fixes the '400 Bad Request' or connection issues with strict models.
      const history = messages
        .filter(m => m.id !== 'welcome')
        .map(m => {
            const parts: any[] = [{ text: m.content }];
            if (m.image) {
              parts.push({
                inlineData: {
                  data: m.image.data,
                  mimeType: m.image.mimeType
                }
              });
            }
            return {
              role: m.role,
              parts: parts
            };
      });
      
      const images = imageToSend ? [imageToSend] : [];
      const responseText = await sendChatMessage(history, userMsg.content, images, userContext);
      
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: responseText,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMsg]);
      if (autoPlay) handlePlayMessage(botMsg);
    } catch (error) {
      console.error(error);
      const errorMsg: Message = {
          id: Date.now().toString(),
          role: 'model',
          content: "CRITICAL_ERROR: The neural link was severed. Please check your internet connection or API Key configuration.",
          timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopyMessage = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  // --- Live API Logic & Error Handling ---
  const cleanupVoiceResources = () => {
    setIsConnected(false);
    if (sessionRef.current) {
        sessionRef.current.then(session => { try { session.close(); } catch(e) {} }).catch(() => {});
        sessionRef.current = null;
    }
    if (recognitionRef.current) { try { recognitionRef.current.stop(); } catch(e) {} recognitionRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach(track => track.stop()); streamRef.current = null; }
    if (scriptProcessorRef.current) { try { scriptProcessorRef.current.disconnect(); } catch(e) {} scriptProcessorRef.current = null; }
    if (audioContextRef.current) { try { audioContextRef.current.close(); } catch(e) {} audioContextRef.current = null; }
    if (outputAudioContextRef.current) { try { outputAudioContextRef.current.close(); } catch(e) {} outputAudioContextRef.current = null; }
    sourceNodesRef.current.forEach(node => { try { node.stop(); } catch (e) {} });
    sourceNodesRef.current.clear();
  };

  const handleError = (errorMsg: string) => {
      console.error("Voice Error:", errorMsg);
      cleanupVoiceResources();
      setVoiceError(errorMsg);
      setIsVoiceMode(true);
  };

  const startVoiceMode = async () => {
    try {
      stopTtsAudio();
      setIsVoiceMode(true);
      setIsConnected(false);
      setLiveTranscript('');
      setVoiceError(null);
      setIsMicMuted(false);
      const apiKey = process.env.API_KEY;
      if (!apiKey) { handleError("API Key missing from environment."); return; }
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = 'en-US';
          recognition.onresult = (event: any) => {
              let interimTranscript = '';
              for (let i = event.resultIndex; i < event.results.length; ++i) {
                  const transcriptPart = event.results[i][0].transcript;
                  if (!event.results[i].isFinal) interimTranscript += transcriptPart;
              }
              if (interimTranscript) setLiveTranscript(interimTranscript);
          };
          recognition.start();
          recognitionRef.current = recognition;
      }
      const ai = new GoogleGenAI({ apiKey });
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      await inputCtx.resume();
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      await outputCtx.resume();
      audioContextRef.current = inputCtx;
      outputAudioContextRef.current = outputCtx;
      nextStartTimeRef.current = 0;
      let stream;
      try {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (e: any) {
          if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
              handleError("Microphone access denied. Please allow microphone permissions.");
          } else if (e.name === 'NotFoundError') {
              handleError("No microphone found. Please connect a microphone.");
          } else {
              handleError("Could not access microphone: " + e.message);
          }
          return;
      }
      streamRef.current = stream;
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: { parts: [{ text: "You are Aurelia. Professional, futuristic, efficient." }] },
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: selectedVoice } } }
        },
        callbacks: {
            onopen: () => {
                setIsConnected(true);
                const source = inputCtx.createMediaStreamSource(stream);
                const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
                scriptProcessorRef.current = scriptProcessor;
                scriptProcessor.onaudioprocess = (e) => {
                    const inputData = e.inputBuffer.getChannelData(0);
                    const pcmData = createBlob(inputData);
                    if (sessionRef.current) {
                        sessionRef.current.then(session => {
                            try { session.sendRealtimeInput({ media: pcmData }); } catch (err) {}
                        }).catch(err => {});
                    }
                };
                source.connect(scriptProcessor);
                scriptProcessor.connect(inputCtx.destination);
            },
            onmessage: async (msg: LiveServerMessage) => {
                const base64Audio = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                if (base64Audio && outputAudioContextRef.current) {
                    const ctx = outputAudioContextRef.current;
                    try {
                        const audioBuf = await decodeAudioData(base64ToArrayBuffer(base64Audio), ctx);
                        const source = ctx.createBufferSource();
                        source.buffer = audioBuf;
                        source.detune.value = speechPitch;
                        source.connect(ctx.destination);
                        const now = ctx.currentTime;
                        const startTime = Math.max(now, nextStartTimeRef.current);
                        source.start(startTime);
                        nextStartTimeRef.current = startTime + audioBuf.duration;
                        sourceNodesRef.current.add(source);
                        source.onended = () => sourceNodesRef.current.delete(source);
                    } catch (decodeErr) { console.error("Audio decode error", decodeErr); }
                }
                if (msg.serverContent?.interrupted) {
                    sourceNodesRef.current.forEach(node => { try { node.stop(); } catch (e) {} });
                    sourceNodesRef.current.clear();
                    nextStartTimeRef.current = 0;
                }
            },
            onclose: (e) => { cleanupVoiceResources(); setIsVoiceMode(false); },
            onerror: (e: any) => { 
                console.error("Session error", e);
                let errorMessage = "Connection interrupted by server.";
                if (e instanceof ErrorEvent && e.message) {
                    errorMessage = e.message;
                } else if (e.type === 'error') {
                     errorMessage = "Connection refused or interrupted.";
                }
                handleError(errorMessage);
            }
        }
      });
      sessionRef.current = sessionPromise;
      sessionPromise.catch(err => {
         let msg = "Failed to establish connection.";
         if (err.message) {
             if (err.message.includes("403")) msg = "Access Denied: Check API Key/Quota.";
             if (err.message.includes("503")) msg = "Service Overloaded. Try later.";
             if (err.message.includes("Failed to fetch")) msg = "Network Error. Check internet.";
         }
         handleError(msg);
      });
    } catch (e: any) { handleError("System Initialization Failed: " + e.message); }
  };

  const stopVoiceMode = () => {
    cleanupVoiceResources();
    setIsVoiceMode(false);
    setLiveTranscript('');
    setVoiceError(null);
  };

  const toggleMicMute = () => {
    if (streamRef.current) {
        const newMutedState = !isMicMuted;
        streamRef.current.getAudioTracks().forEach(track => {
            track.enabled = !newMutedState;
        });
        setIsMicMuted(newMutedState);
    }
  };

  const getAvatarState = () => {
      if (isLoading || isGeneratingAudio) return 'thinking';
      if (playingMessageId) return 'speaking';
      if (isVoiceMode) {
          if (!isConnected && !voiceError) return 'thinking';
          if (voiceError) return 'idle';
          if (liveTranscript) return 'thinking'; 
          if (isMicMuted) return 'idle';
          return 'listening'; 
      }
      return 'idle';
  };
  const avatarState = getAvatarState();

  return (
    <div className="flex flex-col h-full bg-void-950 border border-white/10 tech-corner-both relative overflow-hidden">
      
      {/* Messages */}
      <div ref={scrollRef} className="relative z-10 flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} gap-6`}>
              {/* Icon */}
              <div className="flex flex-col items-center gap-1">
                 <div className={`w-10 h-10 border flex items-center justify-center flex-shrink-0 relative ${
                    msg.role === 'user' ? 'border-white/20 bg-white/5 text-white' : 'border-aurelia-500/50 bg-aurelia-900/20 text-aurelia-500'
                 }`}>
                    {/* Tech Markers on Icon */}
                    <div className="absolute -top-1 -left-1 w-1.5 h-1.5 border-t border-l border-current"></div>
                    <div className="absolute -bottom-1 -right-1 w-1.5 h-1.5 border-b border-r border-current"></div>
                    {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                 </div>
                 <span className="text-[9px] font-mono text-slate-600 uppercase tracking-wider">{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
              </div>

              {/* Message Bubble */}
              <div className={`relative p-6 text-sm leading-relaxed font-sans group ${
                msg.role === 'user' 
                  ? 'bg-white/5 border-l border-white/10 text-slate-200 tech-corner-bl' 
                  : 'bg-black/40 border-l-2 border-aurelia-500 text-slate-300 tech-corner-tr'
              }`}>
                {/* Tech Deco lines */}
                {msg.role === 'model' && <div className="absolute top-0 right-0 w-20 h-[1px] bg-gradient-to-l from-aurelia-500 to-transparent"></div>}
                
                {/* Image Display */}
                {msg.image && (
                    <div className="mb-4 rounded-lg overflow-hidden border border-white/10 bg-black/20">
                        <img 
                            src={`data:${msg.image.mimeType};base64,${msg.image.data}`} 
                            alt="Uploaded content" 
                            className="max-w-full h-auto max-h-[300px] object-contain"
                        />
                    </div>
                )}

                {/* Content with Markdown Rendering */}
                <div className="prose prose-invert prose-sm max-w-none">
                     <ReactMarkdown
                        components={{
                            h1: ({node, ...props}) => <h1 className="text-xl font-bold font-mono text-white mb-2 border-b border-white/10 pb-2" {...props} />,
                            h2: ({node, ...props}) => <h2 className="text-lg font-bold font-mono text-aurelia-400 mb-2 mt-4" {...props} />,
                            h3: ({node, ...props}) => <h3 className="text-md font-semibold text-cyan-400 mb-2 mt-3" {...props} />,
                            ul: ({node, ...props}) => <ul className="list-disc pl-4 space-y-1 mb-2" {...props} />,
                            ol: ({node, ...props}) => <ol className="list-decimal pl-4 space-y-1 mb-2" {...props} />,
                            li: ({node, ...props}) => <li className="text-slate-300" {...props} />,
                            p: ({node, ...props}) => <p className="mb-2 last:mb-0 leading-relaxed" {...props} />,
                            strong: ({node, ...props}) => <strong className="text-white font-semibold" {...props} />,
                            code: ({node, ...props}) => <code className="bg-white/10 px-1 py-0.5 rounded text-aurelia-300 font-mono text-xs" {...props} />,
                        }}
                     >
                        {msg.content}
                     </ReactMarkdown>
                </div>
                
                {/* Action Buttons */}
                <div className={`absolute -bottom-8 ${msg.role === 'user' ? 'left-0' : 'right-0'} flex gap-2 transition-opacity duration-300 ${
                    playingMessageId === msg.id || copiedMessageId === msg.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}>
                    <button
                        onClick={() => handleCopyMessage(msg.id, msg.content)}
                        className={`p-1.5 bg-black border border-white/10 text-slate-500 hover:text-aurelia-400 hover:border-aurelia-400 transition-all flex items-center justify-center h-8 w-8`}
                        title="Copy"
                    >
                        {copiedMessageId === msg.id ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                    </button>

                    {msg.role === 'model' && (
                        <button
                            onClick={() => handlePlayMessage(msg)}
                            disabled={isGeneratingAudio && playingMessageId !== msg.id}
                            className={`flex items-center gap-2 px-2 py-1.5 bg-black border transition-all h-8 ${
                                playingMessageId === msg.id 
                                    ? (isGeneratingAudio ? 'border-aurelia-500 text-aurelia-500' : 'border-red-500 text-red-500')
                                    : 'border-white/10 text-slate-500 hover:text-aurelia-400 hover:border-aurelia-400'
                            }`}
                            title={playingMessageId === msg.id ? "Stop" : "Read Aloud"}
                        >
                            {playingMessageId === msg.id ? (
                                isGeneratingAudio ? (
                                    <>
                                        <Loader2 size={12} className="animate-spin" />
                                        <span className="text-[9px] font-mono uppercase tracking-widest whitespace-nowrap">INITIALIZING_AUDIO...</span>
                                    </>
                                ) : (
                                    <>
                                        <Square size={10} fill="currentColor" />
                                        <span className="text-[9px] font-mono uppercase tracking-widest whitespace-nowrap">STOP_TRANSMISSION</span>
                                    </>
                                )
                            ) : (
                                <Volume2 size={12} />
                            )}
                        </button>
                    )}
                </div>

              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start w-full">
            <div className="flex max-w-[80%] gap-6">
                 <div className="w-10 h-10 border border-aurelia-500/50 bg-aurelia-900/20 text-aurelia-500 flex items-center justify-center flex-shrink-0">
                     <Bot size={16} />
                 </div>
                 <div className="bg-black/40 border-l-2 border-aurelia-500 p-6 tech-corner-tr flex items-center gap-3">
                    <span className="text-xs text-aurelia-500 font-mono tracking-widest uppercase animate-pulse">Processing_Data_Stream...</span>
                 </div>
            </div>
          </div>
        )}
      </div>

      {/* Input / Control Bar */}
      <div className="relative z-10 p-4 bg-void-950 border-t border-white/10 backdrop-blur-md">
        {selectedImage && (
            <div className="absolute bottom-full left-4 mb-2 bg-black/80 border border-aurelia-500/50 p-2 rounded-lg flex items-center gap-2 animate-fade-in-up">
                 <div className="w-8 h-8 rounded bg-white/10 overflow-hidden">
                     <img src={`data:${selectedImage.mimeType};base64,${selectedImage.data}`} alt="Preview" className="w-full h-full object-cover" />
                 </div>
                 <span className="text-xs text-aurelia-400 font-mono">IMAGE_ATTACHED</span>
                 <button onClick={() => setSelectedImage(null)} className="ml-2 text-slate-500 hover:text-red-500"><X size={14}/></button>
            </div>
        )}

        <div className="relative flex gap-4 items-end">
            <div className="relative group flex-1">
                <div className="absolute -top-3 left-0 text-[9px] font-mono text-aurelia-500 opacity-0 group-focus-within:opacity-100 transition-opacity uppercase tracking-widest">
                    Command Input
                </div>
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="ENTER COMMAND OR QUERY..."
                    className="w-full p-4 pr-12 pl-12 bg-black/50 border border-white/10 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-aurelia-500 focus:bg-aurelia-900/5 transition-all font-mono resize-none h-[60px]"
                />
                
                {/* Image Upload Button */}
                 <div className="absolute left-3 bottom-3">
                    <input 
                        type="file" 
                        ref={fileInputRef}
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileSelect}
                    />
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="p-1.5 text-slate-500 hover:text-cyan-400 transition-colors"
                        title="Upload Image"
                    >
                        <Paperclip size={18} />
                    </button>
                </div>

                <button
                    onClick={handleSend}
                    disabled={isLoading || (!input.trim() && !selectedImage)}
                    className="absolute right-2 bottom-2 p-2 text-slate-500 hover:text-aurelia-500 transition-colors disabled:opacity-30"
                >
                    <Send size={18} />
                </button>
            </div>
          
            {/* Voice Toggle */}
            <button 
                onClick={isVoiceMode ? stopVoiceMode : startVoiceMode}
                className={`h-[60px] w-[60px] flex items-center justify-center border transition-all relative overflow-hidden group ${
                    isVoiceMode 
                    ? 'border-red-500 text-red-500 bg-red-900/10' 
                    : 'border-white/10 text-slate-400 hover:border-aurelia-500 hover:text-aurelia-500 bg-black/50'
                }`}
            >   
                <div className="absolute inset-0 bg-current opacity-0 group-hover:opacity-10 transition-opacity"></div>
                {isVoiceMode ? <MicOff size={20} className="animate-pulse" /> : <Mic size={20} />}
            </button>
            
             {/* Settings Toggle */}
            <div className="relative" ref={settingsRef}>
                <button 
                    onClick={() => setShowVoiceSettings(!showVoiceSettings)}
                    className="h-[60px] w-[60px] flex items-center justify-center border border-white/10 text-slate-400 hover:border-aurelia-500 hover:text-aurelia-500 bg-black/50 transition-all"
                >
                    <Settings2 size={20} className={showVoiceSettings ? "animate-spin-slow text-aurelia-500" : ""} />
                </button>
                
                {showVoiceSettings && (
                    <div className="absolute bottom-full right-0 mb-4 w-72 bg-void-900 border border-aurelia-500/30 p-5 tech-corner-tr shadow-[0_0_30px_rgba(0,0,0,0.5)] z-30 animate-fade-in">
                        <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
                             <h3 className="text-[10px] font-bold text-aurelia-500 font-mono uppercase tracking-widest">Sys_Config</h3>
                        </div>
                        {/* Compact Settings (Voice, Rate, Pitch) - Same Logic, simpler UI */}
                        <div className="space-y-4">
                            <div>
                                <label className="text-[9px] text-slate-500 uppercase font-mono mb-1 block">Voice Module</label>
                                <select 
                                    value={selectedVoice} 
                                    onChange={(e) => setSelectedVoice(e.target.value)}
                                    className="w-full bg-black border border-white/10 text-xs text-white p-2 font-mono outline-none focus:border-aurelia-500"
                                >
                                    {voices.map(v => <option key={v.name} value={v.name}>{v.name} ({v.type})</option>)}
                                </select>
                            </div>
                            <div>
                                <div className="flex justify-between text-[9px] text-slate-500 uppercase font-mono mb-1">
                                    <span>Rate</span>
                                    <span>{speechRate}x</span>
                                </div>
                                <input type="range" min="0.5" max="2.0" step="0.1" value={speechRate} onChange={(e) => setSpeechRate(parseFloat(e.target.value))} className="w-full h-1 bg-white/10 accent-aurelia-500 appearance-none"/>
                            </div>
                            <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                                <span className="text-[9px] text-slate-400 uppercase font-mono">Auto-Read</span>
                                <button onClick={() => setAutoPlay(!autoPlay)} className={`w-8 h-4 rounded-full relative transition-colors ${autoPlay ? 'bg-aurelia-500' : 'bg-white/10'}`}>
                                    <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${autoPlay ? 'translate-x-4' : 'translate-x-0'}`}></div>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

        </div>
      </div>

      {/* Voice Overlay HUD */}
      {isVoiceMode && (
          <div className="fixed inset-0 bg-void-950/95 z-50 flex flex-col items-center justify-center animate-fade-in font-mono">
              {/* HUD Frame */}
              <div className="absolute inset-8 border border-white/5 pointer-events-none tech-corner-both"></div>
              <div className="absolute top-12 left-12 text-[10px] text-aurelia-500 tracking-[0.3em]">SECURE_CONNECTION // LIVE</div>
              <div className="absolute top-12 right-12 text-[10px] text-slate-500 tracking-[0.3em]">
                  {isConnected ? <span className="text-green-500">LINK: STABLE</span> : <span className="animate-pulse text-red-500">LINK: ESTABLISHING</span>}
              </div>

              {/* Status Indicators & Visualizer */}
              <div className="absolute top-24 left-1/2 -translate-x-1/2 flex items-center justify-center gap-6 md:gap-12 w-full px-4">
                  {/* Mic Indicator & Input Visualizer */}
                  <div className={`flex flex-col items-center gap-2`}>
                      <div className={`flex items-center gap-3 px-4 py-2 rounded-full border transition-all ${
                          voiceError?.includes('Permission') ? 'border-red-500/50 bg-red-900/20 text-red-500' :
                          isMicMuted ? 'border-orange-500/50 bg-orange-900/20 text-orange-500' :
                          'border-green-500/50 bg-green-900/20 text-green-500'
                      }`}>
                          {voiceError?.includes('Permission') ? <ShieldAlert size={16} /> :
                           isMicMuted ? <MicOff size={16} /> : <Mic size={16} className={isConnected ? "animate-pulse" : ""} />}
                          <span className="text-[10px] font-mono tracking-widest font-bold hidden md:inline">
                              {voiceError?.includes('Permission') ? 'ACCESS_DENIED' :
                               isMicMuted ? 'MIC_MUTED' : 'MIC_ACTIVE'}
                          </span>
                      </div>
                      {/* Input Visualizer (Simulated activity when mic active and not muted) */}
                      {!voiceError && !isMicMuted && <AudioVisualizer isActive={isConnected && !isMicMuted} color="#22c55e" />}
                  </div>

                  {/* Audio Indicator & Output Visualizer */}
                  <div className={`flex flex-col items-center gap-2`}>
                      <div className={`flex items-center gap-3 px-4 py-2 rounded-full border transition-all ${
                          avatarState === 'thinking' ? 'border-cyan-500/50 bg-cyan-900/20 text-cyan-500' :
                          avatarState === 'speaking' ? 'border-aurelia-500/50 bg-aurelia-900/20 text-aurelia-500' :
                          'border-slate-500/50 bg-slate-900/20 text-slate-500'
                      }`}>
                          {avatarState === 'thinking' ? <Loader2 size={16} className="animate-spin" /> :
                           avatarState === 'speaking' ? <Volume2 size={16} className="animate-pulse" /> :
                           <Activity size={16} />}
                           <span className="text-[10px] font-mono tracking-widest font-bold hidden md:inline">
                              {avatarState === 'thinking' ? 'PROCESSING' :
                               avatarState === 'speaking' ? 'TRANSMITTING' : 'STANDBY'}
                           </span>
                      </div>
                      {/* Output Visualizer */}
                      <AudioVisualizer isActive={avatarState === 'speaking'} color="#f5a623" />
                  </div>
              </div>

              <div className="relative mb-12 mt-24">
                  {voiceError ? (
                     <div className="w-48 h-48 rounded-full border border-red-500/50 flex items-center justify-center bg-red-900/10 animate-pulse relative">
                        <div className="absolute inset-0 border-t border-red-500 animate-[spin_2s_linear_infinite]"></div>
                        <WifiOff size={48} className="text-red-500" />
                     </div>
                  ) : (
                     <AureliaAvatar state={avatarState === 'idle' ? 'listening' : avatarState} size="lg" />
                  )}
              </div>
              
              <div className="max-w-2xl text-center px-4 min-h-[100px] flex items-center justify-center">
                   {voiceError ? (
                        <div className="border border-red-500/30 bg-red-900/20 p-4 text-red-400 text-xs tracking-widest uppercase">
                            ERROR: {voiceError}
                        </div>
                   ) : (
                        <p className="text-xl md:text-2xl text-cyan-500 font-light tracking-wide leading-relaxed">
                             {liveTranscript ? `"${liveTranscript}"` : <span className="opacity-30 animate-pulse">...AWAITING_VOCAL_INPUT...</span>}
                        </p>
                   )}
              </div>
              
              <div className="mt-16 flex items-center gap-6">
                  {/* Mute Toggle */}
                  <button 
                    onClick={toggleMicMute}
                    disabled={!!voiceError}
                    className={`h-12 w-12 rounded-full flex items-center justify-center border transition-all ${
                        isMicMuted 
                        ? 'bg-orange-500 text-white border-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.4)]' 
                        : 'bg-black/50 text-slate-400 border-white/20 hover:text-white hover:border-white'
                    }`}
                  >
                      {isMicMuted ? <MicOff size={20} /> : <Mic size={20} />}
                  </button>

                  <button onClick={stopVoiceMode} className="group relative px-8 py-3 overflow-hidden">
                      <div className="absolute inset-0 border border-red-500/30 group-hover:border-red-500/80 transition-colors tech-corner-bl"></div>
                      <div className="absolute inset-0 bg-red-500/0 group-hover:bg-red-500/10 transition-colors"></div>
                      <span className="relative text-red-500 text-xs tracking-[0.3em] font-bold flex items-center gap-2">
                          TERMINATE_LINK <X size={14}/>
                      </span>
                  </button>
              </div>
          </div>
      )}
    </div>
  );
};

export default ThinkingPartner;