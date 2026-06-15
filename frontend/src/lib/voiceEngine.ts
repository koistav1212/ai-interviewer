"use client";

// Dynamic imports guard for SSR environments
let createModel: any = null;
let MicVAD: any = null;
let KokoroTTS: any = null;

if (typeof window !== 'undefined') {
  // Load dependencies dynamically to avoid SSR node-side bundle issues
  Promise.all([
    import('vosk-browser').then(m => createModel = m.createModel).catch(e => console.warn("Vosk failed to load dynamically", e)),
    import('@ricky0123/vad-web').then(m => MicVAD = m.MicVAD).catch(e => console.warn("VAD failed to load dynamically", e))
  ]);
}

export interface VoiceSettings {
  ttsEngine: "native" | "kokoro" | "piper";
  voiceId: string;
  speed: number;
}

export class VoiceEngine {
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private voskModel: any = null;
  private recognizer: any = null;
  private processorNode: ScriptProcessorNode | null = null;
  private vadInstance: any = null;
  private silenceTimeout: NodeJS.Timeout | null = null;
  private isListening = false;
  private kokoroModel: any = null;

  // Track progress of model downloading
  public onVoskProgress: ((percent: number) => void) | null = null;
  public onKokoroProgress: ((percent: number) => void) | null = null;

  constructor() {}

  /**
   * Request microphone permission and return true if granted
   */
  async requestMicPermission(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop stream immediately since we just wanted to check permission
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (err) {
      console.error("Microphone permission denied:", err);
      return false;
    }
  }

  /**
   * Load the Vosk model in the browser
   */
  async loadVoskModel(): Promise<void> {
    if (this.voskModel) return;
    if (!createModel) {
      const m = await import('vosk-browser');
      createModel = m.createModel;
    }

    if (this.onVoskProgress) this.onVoskProgress(10); // Start progress
    
    // We fetch the zip hosted locally in Next.js public/
    this.voskModel = await createModel('/vosk-model-small-en-us-0.15.zip');
    
    if (this.onVoskProgress) this.onVoskProgress(100);
  }

  /**
   * Load the Kokoro TTS model (if selected)
   */
  async loadKokoroModel(): Promise<void> {
    if (this.kokoroModel) return;
    try {
      if (this.onKokoroProgress) this.onKokoroProgress(10);
      
      const { KokoroTTS: K } = await import('kokoro-js');
      this.kokoroModel = await K.from_pretrained("onnx-community/Kokoro-82M-v1.0-ONNX", {
        dtype: "q8",
        device: "wasm"
      });
      
      if (this.onKokoroProgress) this.onKokoroProgress(100);
    } catch (err) {
      console.error("Failed to load Kokoro TTS model:", err);
      if (this.onKokoroProgress) this.onKokoroProgress(-1); // error code
      throw err;
    }
  }

  /**
   * TTS engine: Speak the text
   */
  async speak(
    text: string, 
    settings: VoiceSettings, 
    onStart: () => void, 
    onEnd: () => void
  ): Promise<void> {
    // Make sure we stop any active synthesis
    if (typeof window !== 'undefined') {
      window.speechSynthesis.cancel();
    }

    if (settings.ttsEngine === "kokoro") {
      try {
        onStart();
        if (!this.kokoroModel) {
          await this.loadKokoroModel();
        }
        
        const audio = await this.kokoroModel.generate(text, {
          voice: settings.voiceId || "af_sky",
          speed: settings.speed || 1.0
        });

        // Play generated audio buffer
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const buffer = await audioContext.decodeAudioData(audio.buffer);
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContext.destination);
        source.onended = () => {
          audioContext.close();
          onEnd();
        };
        source.start(0);
      } catch (err) {
        console.warn("Kokoro TTS generation failed, falling back to Web Speech API:", err);
        this.speakNative(text, settings, onStart, onEnd);
      }
    } else {
      // Piper fallback or Native Web Speech
      this.speakNative(text, settings, onStart, onEnd);
    }
  }

  private speakNative(
    text: string, 
    settings: VoiceSettings, 
    onStart: () => void, 
    onEnd: () => void
  ): void {
    if (typeof window === 'undefined') return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = settings.speed || 1.0;

    // Try to find the requested voice ID
    const voices = window.speechSynthesis.getVoices();
    let selectedVoice = voices.find(v => v.name === settings.voiceId);

    if (!selectedVoice) {
      // Default fallback: Look for Indian English (en-IN)
      selectedVoice = voices.find(v => v.lang === 'en-IN' || v.lang.includes('en_IN') || v.name.toLowerCase().includes('india') || v.name.toLowerCase().includes('indian'));
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.onstart = () => onStart();
    utterance.onend = () => onEnd();
    utterance.onerror = (e) => {
      console.error("SpeechSynthesis error:", e);
      onEnd(); // Ensure we transition states even if speech fails
    };

    window.speechSynthesis.speak(utterance);
  }

  /**
   * STT engine: Start listening and transcribe microphone input
   */
  async startListening(
    onTranscript: (text: string, confidence: number, isFinal: boolean) => void,
    onSilenceTimeout: () => void
  ): Promise<void> {
    if (this.isListening) return;
    this.isListening = true;

    try {
      // Ensure Vosk is loaded
      await this.loadVoskModel();

      // Access Mic
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          channelCount: 1,
          sampleRate: 16000
        }
      });

      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = this.audioContext.createMediaStreamSource(this.mediaStream);

      // Initialize Vosk Recognizer
      this.recognizer = new this.voskModel.KaldiRecognizer(16000);
      
      let accumulatedTranscript = "";

      this.recognizer.on("result", (message: any) => {
        const res = message.result;
        if (res && res.text) {
          accumulatedTranscript = res.text;
          onTranscript(accumulatedTranscript, res.confidence || 0.95, true);
          this.resetSilenceTimer(onSilenceTimeout);
        }
      });

      this.recognizer.on("partialresult", (message: any) => {
        const res = message.result;
        if (res && res.text) {
          // Live partial transcript update
          const text = res.text;
          onTranscript(text, 0.7, false);
          this.resetSilenceTimer(onSilenceTimeout);
        }
      });

      // Script Processor to feed audio to Vosk
      this.processorNode = this.audioContext.createScriptProcessor(4096, 1, 1);
      this.processorNode.onaudioprocess = (event) => {
        if (!this.isListening) return;
        this.recognizer.acceptWaveform(event.inputBuffer);
      };

      source.connect(this.processorNode);
      this.processorNode.connect(this.audioContext.destination);

      // Setup Silero VAD for voice activity detection
      try {
        if (!MicVAD) {
          const m = await import('@ricky0123/vad-web');
          MicVAD = m.MicVAD;
        }

        this.vadInstance = await MicVAD.new({
          onSpeechStart: () => {
            this.resetSilenceTimer(onSilenceTimeout);
          },
          onSpeechEnd: () => {
            this.resetSilenceTimer(onSilenceTimeout);
          },
          onVADNegative: () => {
            // Handled via resetSilenceTimer callback to catch all silence triggers
          },
          onnxWASMBasePath: "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.19.2/dist/",
          baseAssetPath: "https://cdn.jsdelivr.net/npm/@ricky0123/vad-web@0.0.30/dist/",
        });

        this.vadInstance.start();
      } catch (vadError) {
        console.warn("Silero VAD initialization failed. Continuing with Vosk only. Auto-submit is disabled, please use the manual submit button.", vadError);
        this.vadInstance = null;
      }

      // Start initial silence timer if VAD was loaded successfully
      if (this.vadInstance) {
        this.resetSilenceTimer(onSilenceTimeout);
      }

    } catch (err) {
      console.error("Failed to start speech recognition:", err);
      this.stopListening();
    }
  }

  /**
   * Reset the 10-second silence timeout
   */
  private resetSilenceTimer(onSilenceTimeout: () => void): void {
    if (this.silenceTimeout) {
      clearTimeout(this.silenceTimeout);
    }
    this.silenceTimeout = setTimeout(() => {
      console.log("10 seconds of silence detected. Auto-submitting...");
      onSilenceTimeout();
    }, 10000);
  }

  /**
   * Stop listening and cleanup audio contexts
   */
  stopListening(): void {
    this.isListening = false;

    if (this.silenceTimeout) {
      clearTimeout(this.silenceTimeout);
      this.silenceTimeout = null;
    }

    if (this.vadInstance) {
      try {
        this.vadInstance.pause();
        this.vadInstance = null;
      } catch (e) {
        console.warn("VAD cleanup failed", e);
      }
    }

    if (this.processorNode) {
      this.processorNode.disconnect();
      this.processorNode = null;
    }

    if (this.recognizer) {
      try {
        this.recognizer.destroy();
      } catch (e) {
        console.warn("Recognizer destroy failed", e);
      }
      this.recognizer = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    if (this.audioContext) {
      if (this.audioContext.state !== "closed") {
        this.audioContext.close();
      }
      this.audioContext = null;
    }
  }
}
