'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Send, X, Loader2, Volume2, Check, AlertTriangle } from 'lucide-react';
import { uiContext } from '@/lib/uiContext';
import { tts } from '@/lib/tts';

interface VoiceAction {
    type?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    confirm?: {
        action: string;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: any;
        message: string;
    };
    [key: string]: unknown;
}

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    type?: 'text' | 'confirm' | 'error' | 'widget';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data?: any;
    isStreaming?: boolean;
}

interface VoiceAgentProps {
    sessionId?: string;
    onAction?: (action: VoiceAction) => void;
}

export function VoiceAgent({ sessionId, onAction }: VoiceAgentProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [state, setState] = useState<'IDLE' | 'LISTENING' | 'PROCESSING' | 'SPEAKING'>('IDLE');
    const [messages, setMessages] = useState<Message[]>([]);
    const [transcript, setTranscript] = useState('');
    const [currentSessionId, setCurrentSessionId] = useState(sessionId || `session-${Date.now()}`);

    // Refs for VAD and Audio
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const vadFrameRef = useRef<number | null>(null);
    const lastSpeechTimeRef = useRef<number>(0);
    const hasSpokenRef = useRef<boolean>(false);
    const isTransitioning = useRef<boolean>(false);

    // Configurable VAD constants
    const VAD_THRESHOLD = 0.015; // RMS Threshold
    const SILENCE_DURATION = 1000; // ms to wait after speech stops

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, transcript]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopEverything();
        };
    }, []);

    const stopEverything = () => {
        if (vadFrameRef.current) cancelAnimationFrame(vadFrameRef.current);
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
        if (audioContextRef.current) {
            try {
                audioContextRef.current.close().catch(() => { });
            } catch (e) { console.error("Error closing context", e); }
            audioContextRef.current = null;
        }
        tts.stop();
        setState('IDLE');
    };

    const startSession = async () => {
        setIsOpen(true);
        startListening();
    };

    const endSession = () => {
        stopEverything();
        setIsOpen(false);
        setState('IDLE');
        setMessages([]);
    };

    const startListening = async () => {
        try {
            // cleanup previous runs
            if (audioContextRef.current) await audioContextRef.current.close();

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // Setup Audio Context for VAD
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const analyser = audioContext.createAnalyser();
            const source = audioContext.createMediaStreamSource(stream);
            source.connect(analyser);
            analyser.fftSize = 256;

            audioContextRef.current = audioContext;
            analyserRef.current = analyser;

            // Setup Recorder
            const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) audioChunksRef.current.push(event.data);
            };

            mediaRecorder.onstop = async () => {
                // Determine why we stopped
                // If we stopped because of VAD, process.
                // If we stopped because user cancelled (IDLE), do nothing.
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                stream.getTracks().forEach(track => track.stop()); // Release mic

                // We handle the "what next" logic elsewhere, 
                // but if we are in PROCESSING state, it means VAD triggered this stop.
            };

            mediaRecorder.start();

            // Ensure context is running (especially for Safari/Chrome autoplay policies)
            if (audioContext.state === 'suspended') {
                await audioContext.resume();
            }

            setState('LISTENING');
            setTranscript("Listening...");

            // Reset VAD state
            lastSpeechTimeRef.current = Date.now();
            hasSpokenRef.current = false;
            startVADLoop();

        } catch (error) {
            console.error('Failed to start recording:', error);
            alert('Microphone access denied. Please enable permission.');
            setState('IDLE');
        }
    };

    const startVADLoop = () => {
        const dataArray = new Uint8Array(analyserRef.current!.frequencyBinCount);

        const checkVolume = () => {
            if (!analyserRef.current) return;

            // Use TimeDomainData for better RMS calculation
            analyserRef.current.getByteTimeDomainData(dataArray);

            // Calculate RMS (Root Mean Square)
            // Values are 0-255, 128 is silence.
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
                const normalized = (dataArray[i] - 128) / 128;
                sum += normalized * normalized;
            }
            const rms = Math.sqrt(sum / dataArray.length);

            const now = Date.now();

            if (rms > VAD_THRESHOLD) {
                lastSpeechTimeRef.current = now;
                hasSpokenRef.current = true;
                setTranscript("I hear you...");
            }

            // Trigger silence detection only if we have spoken at least once
            if (hasSpokenRef.current && (now - lastSpeechTimeRef.current > SILENCE_DURATION)) {
                // Silence detected!
                commitInfo();
                return; // Stop loop
            }

            // Continue loop if not committed
            if (state !== 'PROCESSING' && state !== 'SPEAKING') {
                vadFrameRef.current = requestAnimationFrame(checkVolume);
            }
        };

        vadFrameRef.current = requestAnimationFrame(checkVolume);
    };

    const commitInfo = () => {
        if (vadFrameRef.current) cancelAnimationFrame(vadFrameRef.current);
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
        processAudio();
    };

    const processAudio = async () => {
        setState('PROCESSING');
        setTranscript("Thinking...");

        // Wait a tick for recorder to finalize blob (onstop)
        await new Promise(resolve => setTimeout(resolve, 200));
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

        if (audioBlob.size < 1000) {
            // Too small, probably noise. Resume listening?
            // actually, better to just ask "I didn't catch that"
            console.warn("Audio too short");
        }

        try {
            // 1. STT
            const formData = new FormData();
            formData.append('audio', audioBlob, 'recording.webm');

            const sttRes = await fetch('http://localhost:8000/api/voice/stt', { method: 'POST', body: formData });

            if (!sttRes.ok) {
                const errorData = await sttRes.json().catch(() => ({ detail: 'Unknown error' }));
                console.error('STT failed:', errorData);

                // Provide user-friendly error message
                if (sttRes.status === 500 && errorData.detail?.includes('GROQ_API_KEY')) {
                    addMessage('assistant', "Voice recognition is not configured. Please set up the GROQ_API_KEY in your environment.", 'error');
                } else {
                    addMessage('assistant', `Voice recognition failed: ${errorData.detail || 'Please try again'}`, 'error');
                }
                setState('IDLE');
                return;
            }

            const { text } = await sttRes.json();

            if (!text || text.trim().length === 0) {
                // Nothing recognized. Resume listening.
                startListening();
                return;
            }

            setTranscript(text);
            addMessage('user', text);

            // 2. Chat
            await streamChat(text);

        } catch (error) {
            console.error("Processing error", error);
            addMessage('assistant', "Sorry, I had trouble processing your voice. Please check your internet connection or try typing instead.", 'error');
            setState('IDLE'); // Stop loop on error
        }
    };

    const streamChat = async (message: string) => {
        const assistantMsgId = Date.now().toString();
        // Add placeholder
        setMessages(prev => [...prev, {
            id: assistantMsgId, role: 'assistant', content: '',
            timestamp: new Date(), isStreaming: true
        }]);

        try {
            const context = uiContext.getContext();
            const res = await fetch('http://localhost:8000/api/voice/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message,
                    session_id: currentSessionId,
                    ui_context: context
                })
            });

            if (!res.ok) throw new Error("Chat failed");
            const result = await res.json();

            // Update UI
            setMessages(prev => prev.map(msg =>
                msg.id === assistantMsgId ? {
                    ...msg,
                    content: result.message || (result.type === 'message' ? result.text : "Action executed"),
                    isStreaming: false,
                    type: result.type,
                    data: result
                } : msg
            ));

            // Execute actions
            if (result.type !== 'confirm' && result.type !== 'message' && result.type !== 'error' && result.type !== 'widget') {
                if (onAction) onAction(result as VoiceAction);
            }

            // 3. TTS & Loop
            const textToSpeak = result.tts_text || result.message;
            if (textToSpeak) {
                // GUARD: Stop listening logic to prevent feedback
                if (isTransitioning.current) return;
                isTransitioning.current = true;

                setState('SPEAKING'); // Visual state for speaking

                // Suspend mic to be absolutely sure
                if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                    mediaRecorderRef.current.stop();
                }
                if (audioContextRef.current) {
                    audioContextRef.current.suspend();
                }

                tts.speak(textToSpeak, 'normal', () => {
                    // ON COMPLETE: Resume listening!
                    // Add delay to avoid tail clip
                    setTimeout(() => {
                        isTransitioning.current = false;
                        startListening();
                    }, 300);
                });
            } else {
                // No speech? resume listening anyway
                if (isTransitioning.current) return;
                startListening();
            }

        } catch (err) {
            setMessages(prev => prev.map(msg => msg.id === assistantMsgId ? { ...msg, type: 'error', content: "Connection Error" } : msg));
            setState('IDLE');
        }
    };

    const handleConfirm = async (originalAction: VoiceAction) => {
        // This is a UI button click manual confirm
        // Loop logic: Perform action -> Speak Result -> Resume Listening
        setState('PROCESSING');
        try {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const actionType = originalAction.confirm!.action;
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const actionData = originalAction.confirm!.data;

            const response = await fetch(`http://localhost:8000/api/voice/confirm/${actionType}`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(actionData)
            });
            if (!response.ok) throw new Error("Failed");
            const result = await response.json();

            addMessage('assistant', result.message || "Done.");
            if (onAction) onAction({ type: 'refresh', ...result } as VoiceAction);

            setState('SPEAKING');
            tts.speak(result.message || "Action completed.", 'normal', () => {
                startListening();
            });

        } catch (e) {
            addMessage('assistant', "Failed.", 'error');
            startListening(); // Resume anyway
        }
    };

    const addMessage = (role: 'user' | 'assistant', content: string, type: 'text' | 'confirm' | 'error' | 'widget' = 'text', data?: any) => {
        setMessages(prev => [...prev, {
            id: Date.now().toString(), role, content, timestamp: new Date(), type, data
        }]);
    };

    if (!isOpen) {
        return (
            <button
                onClick={startSession}
                className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-white rounded-full shadow-lg hover:bg-primary/90 transition-all flex items-center justify-center z-50 hover:scale-105"
                title="Start Voice Assistant"
            >
                <Mic className="w-6 h-6" />
            </button>
        );
    }

    return (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-xl shadow-2xl flex flex-col z-50 border border-gray-200 overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-gray-900 text-white transition-colors duration-300">
                <div className="flex items-center gap-2">
                    {/* Dynamic Icon based on State */}
                    {state === 'LISTENING' && <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />}
                    {state === 'PROCESSING' && <Loader2 className="w-4 h-4 animate-spin text-blue-400" />}
                    {state === 'SPEAKING' && <Volume2 className="w-4 h-4 text-green-400 animate-bounce" />}
                    {state === 'IDLE' && <div className="w-3 h-3 bg-gray-500 rounded-full" />}

                    <h3 className="font-semibold tracking-wide">
                        {state === 'IDLE' ? 'AI Assistant' :
                            state === 'LISTENING' ? 'Listening...' :
                                state === 'PROCESSING' ? 'Thinking...' : 'Speaking...'}
                    </h3>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={endSession} className="p-1 hover:bg-white/20 rounded">
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-4">
                        <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-500 ${state === 'LISTENING' ? 'bg-red-50 ring-4 ring-red-100 scale-110' :
                            state === 'SPEAKING' ? 'bg-green-50 ring-4 ring-green-100 scale-105' :
                                'bg-blue-50 ring-4 ring-blue-100'
                            }`}>
                            <Mic className={`w-10 h-10 transition-colors ${state === 'LISTENING' ? 'text-red-500' :
                                state === 'SPEAKING' ? 'text-green-500' :
                                    'text-blue-500'
                                }`} />
                        </div>
                        <div className="text-center">
                            <p className="font-medium text-gray-900">
                                {state === 'IDLE' ? "Tap mic to start" :
                                    state === 'LISTENING' ? "Go ahead, I'm listening..." : "One moment..."}
                            </p>
                            {state === 'LISTENING' && (
                                <p className="text-xs text-blue-500 mt-2 animate-pulse">
                                    Listening for silence to auto-send...
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {messages.map((msg) => (
                    <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${msg.role === 'user'
                            ? 'bg-blue-600 text-white rounded-br-none'
                            : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'
                            }`}>
                            <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>

                            {/* Widget Cards */}
                            {msg.type === 'widget' && msg.data && (
                                <div className="mt-3 w-full bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                                    {/* Widget Header */}
                                    {msg.data.title && (
                                        <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 font-medium text-xs text-gray-700">
                                            {msg.data.title}
                                        </div>
                                    )}

                                    {/* KPI Widget */}
                                    {msg.data.widget_type === 'kpi' && (
                                        <div className="p-4 text-center">
                                            <div className="text-2xl font-bold text-primary">{msg.data.data.value}</div>
                                            <div className="text-xs text-gray-500 mt-1">{msg.data.data.label}</div>
                                        </div>
                                    )}

                                    {/* Table Widget */}
                                    {msg.data.widget_type === 'table' && Array.isArray(msg.data.data) && (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-xs text-left">
                                                <thead className="bg-gray-50 font-medium text-gray-600">
                                                    <tr>
                                                        {Object.keys(msg.data.data[0] || {}).map(key => (
                                                            <th key={key} className="px-3 py-2 capitalize">{key.replace(/_/g, ' ')}</th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {msg.data.data.map((row: any, i: number) => (
                                                        <tr key={i} className="hover:bg-gray-50/50">
                                                            {Object.values(row).map((val: any, j) => (
                                                                <td key={j} className="px-3 py-2 text-gray-700">{String(val)}</td>
                                                            ))}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Confirmation Card */}
                            {msg.type === 'confirm' && msg.data?.confirm && (
                                <div className="mt-3 pt-3 border-t border-gray-100">
                                    <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100 mb-3">
                                        <div className="flex items-start gap-2">
                                            <AlertTriangle className="w-4 h-4 text-yellow-600 shrink-0 mt-0.5" />
                                            <div className="text-xs text-yellow-800">
                                                <p className="font-medium mb-1">Verify Action:</p>
                                                <li>{msg.data.confirm.message}</li>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 justify-end">
                                        <button
                                            onClick={() => handleConfirm(msg.data)}
                                            className="px-3 py-1.5 text-xs font-medium bg-green-600 text-white hover:bg-green-700 rounded-md flex items-center gap-1.5 transition-colors shadow-sm"
                                        >
                                            <Check className="w-3 h-3" />
                                            Confirm
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Footer / Controls */}
            <div className="p-4 bg-white border-t border-gray-100">
                {/* Text Input Area */}
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        if (state !== 'IDLE' && state !== 'LISTENING') return;
                        const form = e.target as HTMLFormElement;
                        const input = form.elements.namedItem('textInput') as HTMLInputElement;
                        const text = input.value.trim();
                        if (!text) return;

                        // Stop listening if active
                        if (state === 'LISTENING') stopEverything();

                        addMessage('user', text);
                        input.value = '';
                        streamChat(text);
                    }}
                    className="flex items-center gap-2 mb-2"
                >
                    <input
                        name="textInput"
                        type="text"
                        placeholder="Type a message..."
                        disabled={state === 'PROCESSING' || state === 'SPEAKING'}
                        className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
                    />
                    <button
                        type="submit"
                        disabled={state === 'PROCESSING' || state === 'SPEAKING'}
                        className="p-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </form>

                <div className="flex items-center justify-center pt-2 border-t border-gray-50">
                    <button
                        onClick={() => {
                            if (state === 'IDLE') startSession();
                            else endSession();
                        }}
                        className={`p-3 rounded-full shadow-lg transition-all transform duration-200 hover:scale-105 active:scale-95 ${state === 'IDLE' ? 'bg-blue-600 text-white hover:bg-blue-700' :
                            state === 'LISTENING' ? 'bg-red-500 text-white hover:bg-red-600 ring-4 ring-red-100 animate-pulse' :
                                'bg-gray-200 text-gray-600 hover:bg-gray-300'
                            }`}
                    >
                        {state === 'IDLE' ? <Mic className="w-5 h-5" /> :
                            state === 'LISTENING' ? <div className="w-5 h-5 flex items-center justify-center"><div className="w-2.5 h-2.5 bg-white rounded-sm" /></div> :
                                <X className="w-5 h-5" />
                        }
                    </button>
                </div>
            </div>
        </div>
    );
}

