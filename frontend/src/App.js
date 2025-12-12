import React, { useState, useEffect, useRef } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Square, Pause, Plus, Settings, Clock, MousePointer, Keyboard, MoreVertical, Trash2, Edit2, Save, Search } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";

// Default Data moved outside component to be used as fallback
const DEFAULT_MACROS = [
  { id: 1, name: 'Daily Login Sequence', duration: '12s', events: 24, lastRun: '2h ago', loopCount: 1, isInfinite: false },
  { id: 2, name: 'Form Filler - Job App', duration: '45s', events: 108, lastRun: '1d ago', loopCount: 1, isInfinite: false },
  { id: 3, name: 'Instagram Liker', duration: '∞', events: 50, lastRun: '5m ago', loopCount: 0, isInfinite: true },
];

export default function ExtensionPrototype() {
  // --- State Initialization with Persistence ---
  
  // 1. Macros List
  const [macros, setMacros] = useState(() => {
    try {
      const saved = localStorage.getItem('macroMate_macros');
      return saved ? JSON.parse(saved) : DEFAULT_MACROS;
    } catch (e) {
      return DEFAULT_MACROS;
    }
  });

  // 2. View State
  const [view, setView] = useState(() => {
     // Check if we were recording
     try {
         const recState = localStorage.getItem('macroMate_recording');
         if (recState) {
             const parsed = JSON.parse(recState);
             if (parsed.isRecording) return 'recorder';
         }
         return localStorage.getItem('macroMate_view') || 'dashboard';
     } catch(e) { return 'dashboard'; }
  });

  const [activeMacro, setActiveMacro] = useState(null);
  
  // 3. Playback State
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState({ currentLoop: 1, totalLoops: 1, currentStep: 0, totalSteps: 0 });

  // --- Global Persistence Effects ---

  // Save Macros whenever they change
  useEffect(() => {
    localStorage.setItem('macroMate_macros', JSON.stringify(macros));
  }, [macros]);

  // Save View whenever it changes (except if it's recorder, handled separately)
  useEffect(() => {
    if (view !== 'recorder') {
        localStorage.setItem('macroMate_view', view);
    }
  }, [view]);

  // Handle Macro Deletion
  const handleDeleteMacro = () => {
    if (!activeMacro) return;
    const newMacros = macros.filter(m => m.id !== activeMacro.id);
    setMacros(newMacros);
    setActiveMacro(null);
    setView('dashboard');
  };

  // Handle Playback Simulation
  useEffect(() => {
    let interval;
    if (isPlaying && activeMacro) {
      interval = setInterval(() => {
        setPlaybackProgress(prev => {
          const nextStep = prev.currentStep + 1;
          const totalSteps = activeMacro.events || 10;
          
          if (nextStep > totalSteps) {
            // End of loop
            if (activeMacro.isInfinite || prev.currentLoop < activeMacro.loopCount) {
              return { ...prev, currentLoop: prev.currentLoop + 1, currentStep: 0 };
            } else {
              setIsPlaying(false);
              return prev;
            }
          }
          return { ...prev, currentStep: nextStep };
        });
      }, 200); // Fast playback simulation
    }
    return () => clearInterval(interval);
  }, [isPlaying, activeMacro]);

  const startPlayback = (macro) => {
    if (!macro) return;
    setActiveMacro(macro);
    setPlaybackProgress({
        currentLoop: 1,
        totalLoops: macro.isInfinite ? '∞' : (macro.loopCount || 1),
        currentStep: 0,
        totalSteps: macro.events || 10
    });
    setIsPlaying(true);
  };

  const stopPlayback = () => {
    setIsPlaying(false);
  };

  // --- Views ---

  // 0. Playback Overlay
  const PlaybackOverlay = () => {
    if (!isPlaying || !activeMacro) return null;
    
    const progress = (playbackProgress.currentStep / playbackProgress.totalSteps) * 100;
    
    return (
        <div className="absolute inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col items-center justify-center p-8 animate-in fade-in duration-300">
            <div className="w-full max-w-xs space-y-8 text-center">
                <div className="space-y-2">
                    <div className="h-16 w-16 mx-auto rounded-full bg-primary/20 flex items-center justify-center animate-pulse-glow">
                        <Play className="h-8 w-8 text-primary fill-current" />
                    </div>
                    <h2 className="text-xl font-bold tracking-tight">Running Macro...</h2>
                    <p className="text-muted-foreground">{activeMacro.name}</p>
                </div>

                <div className="space-y-4">
                    <div className="flex justify-between text-xs text-muted-foreground font-mono">
                        <span>Loop: {playbackProgress.currentLoop} / {playbackProgress.totalLoops}</span>
                        <span>Step: {playbackProgress.currentStep} / {playbackProgress.totalSteps}</span>
                    </div>
                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-primary transition-all duration-200 ease-linear"
                            style={{ width: `${progress}%` }} 
                        />
                    </div>
                </div>

                <Button 
                    size="lg" 
                    variant="destructive" 
                    className="w-full h-12 rounded-full shadow-lg shadow-destructive/20"
                    onClick={stopPlayback}
                >
                    <Square className="h-4 w-4 fill-current mr-2" /> Stop Execution
                </Button>
            </div>
        </div>
    );
  };

  // 1. Dashboard View
  const Dashboard = () => {
    return (
      <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-300">
        <header className="flex items-center justify-between p-4 border-b border-white/5 bg-background/50 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center shadow-lg shadow-primary/20">
              <MousePointer className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-lg font-bold tracking-tight">MacroMate</h1>
          </div>
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-white">
            <Settings className="h-5 w-5" />
          </Button>
        </header>

        <div className="p-4 space-y-4 flex-1 overflow-hidden flex flex-col">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search macros..." className="pl-9 bg-secondary/50 border-white/5 focus-visible:ring-primary/50" />
          </div>

          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-muted-foreground">Your Library</h2>
            <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
              {macros.length} Macros
            </Badge>
          </div>

          <ScrollArea className="flex-1 -mx-4 px-4">
            <div className="space-y-3 pb-20">
              {macros.length === 0 ? (
                <div className="text-center text-muted-foreground text-sm py-10 opacity-50">
                    No macros found. Create one!
                </div>
              ) : (
                macros.map((macro) => (
                    <Card 
                    key={macro.id} 
                    className="p-3 bg-card/50 hover:bg-card border-white/5 transition-all cursor-pointer group hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 group relative overflow-hidden"
                    onClick={() => { setActiveMacro(macro); setView('editor'); }}
                    >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    
                    <div className="flex justify-between items-start mb-2">
                        <div>
                        <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">{macro.name}</h3>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <Clock className="h-3 w-3" /> {macro.duration}
                            <span>•</span>
                            <span>{macro.events} events</span>
                        </div>
                        </div>
                        <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8 text-muted-foreground hover:text-green-400 hover:bg-green-400/10 -mr-2 -mt-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => { 
                            e.stopPropagation(); 
                            startPlayback(macro);
                        }}
                        >
                        <Play className="h-4 w-4 fill-current" />
                        </Button>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-3">
                        {macro.loop && (
                        <Badge variant="secondary" className="h-5 text-[10px] px-1.5 bg-indigo-500/10 text-indigo-400 border-indigo-500/20">
                            Looping
                        </Badge>
                        )}
                        <span className="text-[10px] text-muted-foreground ml-auto">Last run: {macro.lastRun}</span>
                    </div>
                    </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        <div className="absolute bottom-6 right-6">
          <Button 
            size="lg" 
            className="h-14 w-14 rounded-full shadow-xl shadow-primary/30 hover:shadow-primary/50 bg-primary hover:bg-primary/90 transition-all hover:scale-105"
            onClick={() => setView('recorder')}
          >
            <Plus className="h-6 w-6" />
          </Button>
        </div>
      </div>
    );
  };

  // 2. Recorder View
  const Recorder = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [events, setEvents] = useState([]);
    const [timer, setTimer] = useState(0); // 100ms ticks
    const startTimeRef = useRef(null);

    // Initialize Recorder State
    useEffect(() => {
        const savedRec = localStorage.getItem('macroMate_recording');
        if (savedRec) {
            try {
                const parsed = JSON.parse(savedRec);
                if (parsed.isRecording) {
                    setIsRecording(true);
                    setEvents(parsed.events || []);
                    startTimeRef.current = parsed.startTime;
                    // Calculate elapsed time immediately
                    const now = Date.now();
                    const elapsedTicks = Math.floor((now - parsed.startTime) / 100);
                    setTimer(elapsedTicks);
                }
            } catch(e) { console.error(e); }
        }
    }, []);

    // Timer Logic
    useEffect(() => {
        let interval;
        if (isRecording) {
            // If we just started (no start time), set it
            if (!startTimeRef.current) {
                startTimeRef.current = Date.now();
            }

            interval = setInterval(() => {
                // Update timer based on real time diff to handle backgrounding
                const now = Date.now();
                const elapsedTicks = Math.floor((now - startTimeRef.current) / 100);
                setTimer(elapsedTicks);

                // Persist State continuously
                localStorage.setItem('macroMate_recording', JSON.stringify({
                    isRecording: true,
                    startTime: startTimeRef.current,
                    events: events // In a real app we might debounce this
                }));

                // Mock Event Generation
                if (Math.random() > 0.8) {
                    const newEvent = generateMockEvent();
                    setEvents(prev => {
                        const newAcc = [...prev, newEvent].slice(-8);
                        // Update storage with new event
                        localStorage.setItem('macroMate_recording', JSON.stringify({
                            isRecording: true,
                            startTime: startTimeRef.current,
                            events: newAcc
                        }));
                        return newAcc;
                    }); 
                }
            }, 100);
        }
        return () => clearInterval(interval);
    }, [isRecording, events]);

    const generateMockEvent = () => {
      const types = ['click', 'move', 'keypress', 'scroll'];
      const type = types[Math.floor(Math.random() * types.length)];
      return {
        id: Date.now(),
        type,
        detail: type === 'click' ? `x: ${Math.floor(Math.random()*1920)}, y: ${Math.floor(Math.random()*1080)}` 
              : type === 'keypress' ? `Key: ${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`
              : type === 'move' ? `Path: [${Math.floor(Math.random()*100)}, ${Math.floor(Math.random()*100)}]`
              : 'DeltaY: 120',
        timestamp: new Date().toLocaleTimeString().split(' ')[0]
      };
    };

    const formatTime = (ticks) => {
      const totalSeconds = Math.floor(ticks / 10);
      const m = Math.floor(totalSeconds / 60);
      const s = (totalSeconds % 60).toString().padStart(2, '0');
      return `${m}:${s}`;
    };

    const handleStartRecording = () => {
        setIsRecording(true);
        setEvents([]);
        setTimer(0);
        startTimeRef.current = Date.now();
        localStorage.setItem('macroMate_recording', JSON.stringify({
            isRecording: true,
            startTime: Date.now(),
            events: []
        }));
    };

    const handleStopRecording = () => {
        setIsRecording(false);
        // Clear recording state
        localStorage.removeItem('macroMate_recording');
        
        // Create new macro
        const newMacro = {
            id: Date.now(),
            name: `New Recording ${new Date().toLocaleTimeString()}`,
            duration: formatTime(timer),
            events: Math.max(events.length, 12), // Mock count if low
            lastRun: 'Just now',
            loop: false
        };
        
        // Update Global Macros
        const updatedMacros = [newMacro, ...macros];
        setMacros(updatedMacros);
        // Persistence handled by global useEffect on 'macros'
        
        setActiveMacro(newMacro);
        setView('editor');
    };

    return (
      <div className="flex flex-col h-full bg-background animate-in zoom-in-95 duration-200">
        <div className="flex-1 flex flex-col items-center justify-center p-8 relative overflow-hidden">
          {isRecording && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="h-64 w-64 rounded-full bg-primary/5 animate-ping duration-[3s]" />
              <div className="h-48 w-48 rounded-full bg-primary/10 animate-ping delay-75 duration-[2s]" />
            </div>
          )}

          <div className="z-10 text-center space-y-6">
            <div className={`transition-all duration-500 ${isRecording ? 'scale-110' : 'scale-100'}`}>
              <div className="text-6xl font-mono font-bold tracking-tighter tabular-nums text-foreground">
                {formatTime(timer)}
              </div>
              <p className="text-muted-foreground text-sm uppercase tracking-widest mt-2 font-medium">
                {isRecording ? 'Recording System Events...' : 'Ready to Record'}
              </p>
            </div>

            <div className="h-48 w-full max-w-xs mx-auto mt-8 relative">
               <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-background to-transparent z-10" />
               <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background to-transparent z-10" />
               
               <div className="space-y-2 opacity-80">
                 {events.map((e) => (
                   <div key={e.id} className="flex items-center gap-3 text-xs text-left p-2 rounded border border-white/5 bg-white/5 animate-in slide-in-from-bottom-2 fade-in">
                      {e.type === 'click' && <MousePointer className="h-3 w-3 text-primary" />}
                      {e.type === 'keypress' && <Keyboard className="h-3 w-3 text-accent" />}
                      {e.type === 'move' && <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />}
                      {e.type === 'scroll' && <MoreVertical className="h-3 w-3 text-muted-foreground" />}
                      <span className="font-mono text-muted-foreground">{e.timestamp}</span>
                      <span className="font-medium text-foreground">{e.type.toUpperCase()}</span>
                      <span className="text-muted-foreground truncate flex-1">{e.detail}</span>
                   </div>
                 ))}
                 {events.length === 0 && !isRecording && (
                   <div className="text-center text-muted-foreground text-sm py-12">
                     Press record to start capturing inputs
                   </div>
                 )}
               </div>
            </div>
          </div>
        </div>

        <div className="p-6 bg-card border-t border-white/5 pb-8">
          <div className="flex items-center justify-center gap-6">
            {!isRecording ? (
              <>
                 <Button variant="ghost" onClick={() => setView('dashboard')}>Cancel</Button>
                 <Button 
                  size="lg" 
                  className="h-16 w-16 rounded-full bg-primary hover:bg-primary/90 shadow-[0_0_30px_-5px_hsl(var(--primary))] hover:shadow-[0_0_50px_-10px_hsl(var(--primary))] transition-all hover:scale-105 flex items-center justify-center gap-2 group"
                  onClick={handleStartRecording}
                >
                  <div className="flex flex-col items-center justify-center">
                    <div className="h-4 w-4 rounded-full bg-red-500 animate-pulse group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-bold mt-0.5 text-white/80">REC</span>
                  </div>
                </Button>
              </>
            ) : (
              <>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-12 w-12 rounded-full border-white/10 hover:bg-white/5"
                  onClick={() => setIsRecording(false)}
                >
                  <Pause className="h-5 w-5 fill-current" />
                </Button>
                <Button 
                  size="lg" 
                  className="h-16 w-16 rounded-full bg-destructive hover:bg-destructive/90 shadow-[0_0_30px_-5px_hsl(var(--destructive))] transition-all hover:scale-105 flex items-center justify-center"
                  onClick={handleStopRecording}
                >
                  <Square className="h-6 w-6 fill-current" />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  // 3. Editor View
  const Editor = () => {
    
    // Local state for editing before save
    const [editConfig, setEditConfig] = useState({
        loopCount: activeMacro?.loopCount || 1,
        isInfinite: activeMacro?.isInfinite || false
    });

    const handleSave = () => {
        const updated = { ...activeMacro, ...editConfig };
        const newMacros = macros.map(m => m.id === updated.id ? updated : m);
        setMacros(newMacros);
        setActiveMacro(updated);
        // Show saved feedback ideally
    };

    return (
      <div className="flex flex-col h-full bg-background animate-in slide-in-from-right-4 duration-300">
        <header className="flex items-center justify-between p-4 border-b border-white/5 bg-card/30">
          <Button variant="ghost" size="sm" onClick={() => setView('dashboard')} className="-ml-2">
             ← Back
          </Button>
          <div className="text-center">
            <h2 className="text-sm font-semibold">{activeMacro?.name || 'New Macro Recording'}</h2>
            <p className="text-[10px] text-muted-foreground">unsaved changes</p>
          </div>
          <Button size="sm" variant="default" className="bg-primary text-white h-8" onClick={handleSave}>
            <Save className="h-3.5 w-3.5 mr-2" /> Save
          </Button>
        </header>

        <div className="flex-1 overflow-hidden flex flex-col">
            <div className="p-2 bg-secondary/30 flex items-center justify-between text-xs px-4 border-b border-white/5">
                <span className="text-muted-foreground">34 Events</span>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-6 w-6"><Edit2 className="h-3 w-3" /></Button>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 text-destructive hover:bg-destructive/10"
                        onClick={handleDeleteMacro}
                    >
                        <Trash2 className="h-3 w-3" />
                    </Button>
                </div>
            </div>
            
            <ScrollArea className="flex-1">
                <div className="divide-y divide-white/5">
                    {[...Array(10)].map((_, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 hover:bg-white/5 group transition-colors cursor-pointer text-sm">
                            <span className="font-mono text-muted-foreground text-xs w-6 text-right opacity-50">{i+1}</span>
                            <div className="h-8 w-8 rounded bg-secondary flex items-center justify-center border border-white/5">
                                {i % 3 === 0 ? <MousePointer className="h-4 w-4 text-blue-400" /> : 
                                 i % 3 === 1 ? <Keyboard className="h-4 w-4 text-amber-400" /> : 
                                 <Clock className="h-4 w-4 text-gray-400" />}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium text-foreground">
                                        {i % 3 === 0 ? 'Left Click' : i % 3 === 1 ? 'Type Text' : 'Delay'}
                                    </span>
                                    {i % 3 === 0 && <Badge variant="secondary" className="text-[10px] h-5">x: 450, y: 120</Badge>}
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                                    {i % 3 === 0 ? 'Target: Button.Submit' : i % 3 === 1 ? '"Hello World"' : 'Wait 500ms'}
                                </p>
                            </div>
                            <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 h-6 w-6">
                                <MoreVertical className="h-3 w-3" />
                            </Button>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>

        <div className="p-4 border-t border-white/5 bg-card/50 backdrop-blur space-y-4">
             <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <Label className="text-xs">Playback Speed</Label>
                    <span className="text-xs font-mono text-primary">1.0x</span>
                </div>
                <Slider defaultValue={[1]} max={5} step={0.5} className="w-full" />
             </div>
             
             <div className="flex items-center justify-between pt-2 gap-4">
                <div className="flex items-center gap-3 flex-1">
                    <div className="flex flex-col gap-1.5 flex-1">
                        <Label className="text-xs text-muted-foreground">Repetitions</Label>
                        <Input 
                            type="number" 
                            min="1" 
                            max="999"
                            value={editConfig.loopCount}
                            onChange={(e) => setEditConfig(prev => ({ ...prev, loopCount: parseInt(e.target.value) || 1 }))}
                            disabled={editConfig.isInfinite}
                            className="h-8 text-xs bg-secondary/50 border-white/10"
                        />
                    </div>
                    
                    <div className="flex flex-col gap-1.5 items-center pt-5">
                        <div className="flex items-center gap-2">
                             <Switch 
                                id="loop-mode" 
                                checked={editConfig.isInfinite}
                                onCheckedChange={(c) => setEditConfig(prev => ({ ...prev, isInfinite: c }))}
                             />
                             <Label htmlFor="loop-mode" className="text-xs whitespace-nowrap">Infinite</Label>
                        </div>
                    </div>
                </div>

                <Button 
                    size="icon" 
                    className="h-10 w-10 shrink-0 rounded-full bg-green-500 hover:bg-green-600 shadow-lg shadow-green-500/20"
                    onClick={() => startPlayback(activeMacro)}
                >
                    <Play className="h-4 w-4 fill-white text-white" />
                </Button>
             </div>
        </div>
      </div>
    );
  };

  // Render the views
  return (
    <div className="h-full w-full bg-background text-foreground font-sans relative">
        <PlaybackOverlay />
        {view === 'dashboard' && <Dashboard />}
        {view === 'recorder' && <Recorder />}
        {view === 'editor' && <Editor />}
    </div>
  );
}
