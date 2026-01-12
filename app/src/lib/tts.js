// useTTS.ts
import { useEffect, useRef, useState, useCallback } from 'react';

export function useTTS() {
  const [ready, setReady] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const unlockedRef = useRef(false);
  const queueRef = useRef([]);
  const speakingRef = useRef(false);

  // Unlock TTS after user interaction (required on many browsers)
  useEffect(() => {
    const unlock = () => {
      try {
        window.speechSynthesis.resume();
      } catch {}
      setIsUnlocked(true);
      unlockedRef.current = true;
      document.removeEventListener('click', unlock);
      document.removeEventListener('keydown', unlock);
      document.removeEventListener('touchstart', unlock);
    };
    document.addEventListener('click', unlock);
    document.addEventListener('keydown', unlock);
    document.addEventListener('touchstart', unlock);

    // Resume when tab becomes visible again
    const onVis = () => {
      if (document.visibilityState === 'visible') {
        try {
          window.speechSynthesis.resume();
        } catch {}
      }
    };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      document.removeEventListener('click', unlock);
      document.removeEventListener('keydown', unlock);
      document.removeEventListener('touchstart', unlock);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  // Wait for voices to be available (once per page)
  useEffect(() => {
    let voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      setReady(true);
      return;
    }
    const onVoices = () => {
      setReady(true);
      window.speechSynthesis.removeEventListener('voiceschanged', onVoices);
    };
    window.speechSynthesis.addEventListener('voiceschanged', onVoices);
    // Fallback tick to poke voices on some Chromium builds
    const t = setTimeout(() => {
      voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) setReady(true);
    }, 500);
    return () => clearTimeout(t);
  }, []);

  const speakNext = useCallback(() => {
    if (speakingRef.current) return;
    const text = queueRef.current.shift();
    if (!text) return;

    speakingRef.current = true;
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1; // customize
    u.pitch = 1; // customize
    u.volume = 1;

    u.onend = () => {
      speakingRef.current = false;
      speakNext();
    };
    u.onerror = () => {
      speakingRef.current = false;
      speakNext();
    };

    window.speechSynthesis.speak(u);
  }, []);

  const speak = useCallback(
    (text, { interrupt = false } = {}) => {
      if (!ready || !unlockedRef.current) {
        // queue until ready/unlocked
        queueRef.current.push(text);
        return;
      }
      if (interrupt) {
        try {
          window.speechSynthesis.cancel();
        } catch {}
        speakingRef.current = false;
      }
      queueRef.current.push(text);
      speakNext();
    },
    [ready, speakNext],
  );

  return { speak, ready, isUnlocked };
}
