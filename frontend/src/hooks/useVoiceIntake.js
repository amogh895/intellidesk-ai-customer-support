import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Swappable Voice Intake Hook.
 * Currently uses Web Speech API SpeechRecognition with live transcription preview.
 * Cleanly abstracted interface so server-side Whisper or Google Speech-to-Text STT 
 * can replace it seamlessly.
 */
export function useVoiceIntake() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if ("SpeechRecognition" in window || "webkitSpeechRecognition" in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = "en-US";

      rec.onresult = (event) => {
        let currentInterim = "";
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const res = event.results[i];
          if (res.isFinal) {
            finalTranscript += res[0].transcript + " ";
          } else {
            currentInterim += res[0].transcript;
          }
        }

        if (finalTranscript) {
          setTranscript((prev) => (prev ? `${prev} ${finalTranscript}` : finalTranscript).trim());
        }
        setInterimTranscript(currentInterim);
      };

      rec.onerror = (err) => {
        console.warn("SpeechRecognition error:", err.error);
        setError(err.error);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  const startListening = useCallback(() => {
    setError(null);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.warn("Recognition start failed, re-initializing:", err);
      }
    } else {
      // Mock fallback if browser SpeechRecognition unsupported
      setIsListening(true);
      setTimeout(() => {
        setTranscript("Hello, I had a minor collision in the parking lot last night. What is the deductible for policy POL-NB-2026-9921?");
        setIsListening(false);
      }, 2000);
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  }, [isListening]);

  const resetTranscript = useCallback(() => {
    setTranscript("");
    setInterimTranscript("");
    setError(null);
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    error,
    startListening,
    stopListening,
    resetTranscript,
    setTranscript
  };
}
