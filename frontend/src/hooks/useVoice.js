import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Maps display language names to standard BCP-47 language tags.
 */
const LANGUAGE_CODES = {
  English: 'en-US',
  Spanish: 'es-ES',
  French: 'fr-FR',
  German: 'de-DE',
  Hindi: 'hi-IN',
};

/**
 * Custom React hook providing Speech-to-Text (STT), Text-to-Speech (TTS),
 * Channel Switching, and Live Audio Waveform activity data.
 */
export function useVoice() {
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingTextId, setSpeakingTextId] = useState(null);
  const [voiceError, setVoiceError] = useState(null);
  const [availableVoices, setAvailableVoices] = useState([]);
  
  // Audio Channels: 'customer_to_agent' | 'agent_to_copilot' | 'agent_to_customer'
  const [activeChannel, setActiveChannel] = useState('customer_to_agent');

  // Real-time audio activity state (talking detection)
  const [isTalking, setIsTalking] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0); // 0.0 to 1.0

  const recognitionRef = useRef(null);
  const activeLangRef = useRef('en-US');
  const talkTimerRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);
  const mediaStreamRef = useRef(null);

  // Check browser support
  const isSTTSupported = typeof window !== 'undefined' && 
    !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  const isTTSSupported = typeof window !== 'undefined' && 
    !!window.speechSynthesis;

  // Load available system voices for TTS
  useEffect(() => {
    if (!isTTSSupported) return;

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices);
    };

    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isTTSSupported]);

  // Audio wave animation when TTS is speaking
  useEffect(() => {
    let ttsInterval;
    if (isSpeaking) {
      setIsTalking(true);
      ttsInterval = setInterval(() => {
        setAudioLevel(0.4 + Math.random() * 0.6);
      }, 100);
    } else if (!isListening) {
      setIsTalking(false);
      setAudioLevel(0);
    }
    return () => {
      if (ttsInterval) clearInterval(ttsInterval);
    };
  }, [isSpeaking, isListening]);

  /**
   * Start microphone audio analysis via Web Audio API for responsive waveform
   */
  const startAudioAnalysis = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const audioCtx = new AudioContext();
        audioContextRef.current = audioCtx;
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        analyserRef.current = analyser;

        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const updateWave = () => {
          if (!analyserRef.current) return;
          analyserRef.current.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          const normalized = Math.min(1, avg / 128); // 0 to 1

          if (normalized > 0.08) {
            setIsTalking(true);
            setAudioLevel(normalized);
          } else {
            setAudioLevel(0);
            // Delay dropping isTalking to make speech animation natural
            if (!isSpeaking) {
              if (talkTimerRef.current) clearTimeout(talkTimerRef.current);
              talkTimerRef.current = setTimeout(() => setIsTalking(false), 400);
            }
          }

          animFrameRef.current = requestAnimationFrame(updateWave);
        };
        updateWave();
      }
    } catch (e) {
      console.warn("Microphone stream analysis unavailable:", e);
      // Fallback: wave based on interim transcript
    }
  };

  const stopAudioAnalysis = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    setAudioLevel(0);
    setIsTalking(false);
  };

  /**
   * Start Speech-to-Text listening.
   */
  const startListening = useCallback(({
    language = 'English',
    onFinalResult,
    onInterimResult,
    continuous = false,
  } = {}) => {
    if (!isSTTSupported) {
      setVoiceError('Speech recognition is not supported in this browser. Please use Google Chrome, Edge, or Safari.');
      return;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {}
    }

    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      const langCode = LANGUAGE_CODES[language] || 'en-US';
      activeLangRef.current = langCode;

      recognition.lang = langCode;
      recognition.continuous = continuous;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceError(null);
        setInterimTranscript('');
        startAudioAnalysis();
      };

      recognition.onresult = (event) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcriptPiece = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            final += transcriptPiece;
          } else {
            interim += transcriptPiece;
          }
        }

        if (interim) {
          setIsTalking(true);
          setAudioLevel(0.6 + Math.random() * 0.4);
        }

        setInterimTranscript(interim);
        if (onInterimResult) onInterimResult(interim);

        if (final) {
          setInterimTranscript('');
          if (onFinalResult) onFinalResult(final.trim());
        }
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setVoiceError('Microphone access was denied. Please allow microphone permissions in your browser.');
        } else if (event.error !== 'no-speech' && event.error !== 'aborted') {
          setVoiceError(`Voice recognition error: ${event.error}`);
        }
        setIsListening(false);
        stopAudioAnalysis();
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimTranscript('');
        stopAudioAnalysis();
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setVoiceError('Could not start microphone recording. ' + err.message);
      setIsListening(false);
      stopAudioAnalysis();
    }
  }, [isSTTSupported]);

  /**
   * Stop Speech-to-Text listening.
   */
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      setIsListening(false);
      setInterimTranscript('');
    }
    stopAudioAnalysis();
  }, []);

  /**
   * Text-to-Speech: Read text aloud.
   */
  const speak = useCallback((text, {
    id = null,
    language = 'English',
    rate = 1.0,
    pitch = 1.0,
  } = {}) => {
    if (!isTTSSupported || !text) return;

    if (isSpeaking && speakingTextId === id && id !== null) {
      stopSpeaking();
      return;
    }

    window.speechSynthesis.cancel();

    const cleanText = text.replace(/[*#_`]/g, '').trim();
    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const langCode = LANGUAGE_CODES[language] || 'en-US';
    utterance.lang = langCode;
    utterance.rate = rate;
    utterance.pitch = pitch;

    const matchingVoice = availableVoices.find(v => v.lang.startsWith(langCode.slice(0, 2))) ||
      availableVoices.find(v => v.lang.includes('en')) ||
      availableVoices[0];

    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
      setSpeakingTextId(id);
      setIsTalking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setSpeakingTextId(null);
      setIsTalking(false);
      setAudioLevel(0);
    };

    utterance.onerror = (e) => {
      console.warn('Speech synthesis error:', e);
      setIsSpeaking(false);
      setSpeakingTextId(null);
      setIsTalking(false);
      setAudioLevel(0);
    };

    window.speechSynthesis.speak(utterance);
  }, [isTTSSupported, isSpeaking, speakingTextId, availableVoices]);

  /**
   * Stop any active Text-to-Speech playback.
   */
  const stopSpeaking = useCallback(() => {
    if (isTTSSupported) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setSpeakingTextId(null);
    setIsTalking(false);
    setAudioLevel(0);
  }, [isTTSSupported]);

  return {
    isSTTSupported,
    isTTSSupported,
    isListening,
    interimTranscript,
    startListening,
    stopListening,
    isSpeaking,
    speakingTextId,
    speak,
    stopSpeaking,
    voiceError,
    setVoiceError,
    activeChannel,
    setActiveChannel,
    isTalking,
    audioLevel,
  };
}
