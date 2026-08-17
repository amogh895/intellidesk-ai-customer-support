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
 * Custom React hook providing Speech-to-Text (STT) and Text-to-Speech (TTS).
 */
export function useVoice() {
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingTextId, setSpeakingTextId] = useState(null);
  const [voiceError, setVoiceError] = useState(null);
  const [availableVoices, setAvailableVoices] = useState([]);

  const recognitionRef = useRef(null);
  const activeLangRef = useRef('en-US');

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

  /**
   * Start Speech-to-Text listening.
   * @param {Object} options
   * @param {string} options.language - Language name (e.g. "English", "Spanish", "French")
   * @param {Function} options.onFinalResult - Callback with final transcribed string
   * @param {Function} options.onInterimResult - Callback with interim transcript
   * @param {boolean} options.continuous - Whether to keep listening or stop after first sentence
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

    // Stop any existing session
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {
        // ignore abort errors
      }
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
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimTranscript('');
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setVoiceError('Could not start microphone recording. ' + err.message);
      setIsListening(false);
    }
  }, [isSTTSupported]);

  /**
   * Stop Speech-to-Text listening.
   */
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
      setIsListening(false);
      setInterimTranscript('');
    }
  }, []);

  /**
   * Text-to-Speech: Read text aloud.
   * @param {string} text - The text to speak
   * @param {Object} options
   * @param {string} options.id - Optional identifier for this utterance (for UI active indicator)
   * @param {string} options.language - Language name (e.g. "English", "Spanish", "French")
   * @param {number} options.rate - Speech rate (0.8 - 1.2)
   * @param {number} options.pitch - Voice pitch (0.8 - 1.2)
   */
  const speak = useCallback((text, {
    id = null,
    language = 'English',
    rate = 1.0,
    pitch = 1.0,
  } = {}) => {
    if (!isTTSSupported || !text) return;

    // If currently speaking this exact text, toggle off (stop)
    if (isSpeaking && speakingTextId === id && id !== null) {
      stopSpeaking();
      return;
    }

    // Cancel any existing speech
    window.speechSynthesis.cancel();

    const cleanText = text.replace(/[*#_`]/g, '').trim();
    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const langCode = LANGUAGE_CODES[language] || 'en-US';
    utterance.lang = langCode;
    utterance.rate = rate;
    utterance.pitch = pitch;

    // Pick best matching voice
    const matchingVoice = availableVoices.find(v => v.lang.startsWith(langCode.slice(0, 2))) ||
      availableVoices.find(v => v.lang.includes('en')) ||
      availableVoices[0];

    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
      setSpeakingTextId(id);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setSpeakingTextId(null);
    };

    utterance.onerror = (e) => {
      console.warn('Speech synthesis error:', e);
      setIsSpeaking(false);
      setSpeakingTextId(null);
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
  };
}
