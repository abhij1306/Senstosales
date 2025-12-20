/**
 * Text-to-Speech Utility using Web Speech API
 * Optimized for natural voice delivery and queue management
 */

class TTSManager {
    private synthesis: SpeechSynthesis;
    private voice: SpeechSynthesisVoice | null = null;
    private queue: { text: string; onEnd?: () => void }[] = [];
    private isSpeaking = false;
    private enabled = true;

    constructor() {
        if (typeof window !== 'undefined') {
            this.synthesis = window.speechSynthesis;
            // Load voices
            this.loadVoice();
            if (this.synthesis.onvoiceschanged !== undefined) {
                this.synthesis.onvoiceschanged = () => this.loadVoice();
            }
        } else {
            // Server-side fallback (noop)
            this.synthesis = { speak: () => { }, cancel: () => { }, getVoices: () => [] } as any;
        }
    }

    private loadVoice() {
        const voices = this.synthesis.getVoices();
        // Prefer Google US English or Microsoft Zira/David
        this.voice = voices.find(v => v.name.includes('Google US English')) ||
            voices.find(v => v.name.includes('Zira')) ||
            voices.find(v => v.lang === 'en-US') ||
            voices[0] || null;
    }

    public speak(text: string, priority: 'normal' | 'high' = 'normal', onEnd?: () => void) {
        if (!this.enabled || !text) {
            if (onEnd) onEnd();
            return;
        }

        if (priority === 'high') {
            this.stop();
            this.queue = [{ text, onEnd }];
            this.processQueue();
        } else {
            this.queue.push({ text, onEnd });
            if (!this.isSpeaking) {
                this.processQueue();
            }
        }
    }

    private processQueue() {
        if (this.queue.length === 0) {
            this.isSpeaking = false;
            return;
        }

        this.isSpeaking = true;
        const item = this.queue.shift()!;
        const utterance = new SpeechSynthesisUtterance(item.text);

        if (this.voice) utterance.voice = this.voice;

        // Optimize rate/pitch
        utterance.rate = 1.1; // Slightly faster
        utterance.pitch = 1.0;

        utterance.onend = () => {
            if (item.onEnd) item.onEnd();
            this.processQueue();
        };

        utterance.onerror = (e) => {
            console.error('TTS Error:', e);
            this.isSpeaking = false;
            if (item.onEnd) item.onEnd();
        };

        this.synthesis.speak(utterance);
    }

    public stop() {
        this.synthesis.cancel();
        this.queue = [];
        this.isSpeaking = false;
    }

    public setEnabled(enabled: boolean) {
        this.enabled = enabled;
        if (!enabled) this.stop();
    }
}

export const tts = new TTSManager();
