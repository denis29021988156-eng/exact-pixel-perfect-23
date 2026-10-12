// Голос: прочитать сводку вслух и надиктовать вопрос. Только встроенные возможности браузера.

import { useCallback, useEffect, useRef, useState } from "react";

// ── Чтение вслух ──────────────────────────────────────────────────────────

export const canSpeak = () => typeof window !== "undefined" && "speechSynthesis" in window;

function pickRussianVoice(): SpeechSynthesisVoice | null {
  if (!canSpeak()) return null;
  const voices = window.speechSynthesis.getVoices().filter((v) => v.lang?.toLowerCase().startsWith("ru"));
  if (!voices.length) return null;
  const preferred = ["Milena", "Yuri", "Google русский", "Microsoft Svetlana", "Microsoft Dmitry"];
  for (const name of preferred) {
    const v = voices.find((x) => x.name.includes(name));
    if (v) return v;
  }
  return voices.find((v) => v.localService) ?? voices[0];
}

/** Состояние чтения: speak(text) начинает, stop() останавливает. */
export function useSpeaker() {
  const [speaking, setSpeaking] = useState(false);
  const supported = canSpeak();

  useEffect(() => {
    if (!supported) return;
    // Голоса подгружаются асинхронно — просим список заранее.
    window.speechSynthesis.getVoices();
    return () => window.speechSynthesis.cancel();
  }, [supported]);

  const stop = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, [supported]);

  const speak = useCallback(
    (text: string) => {
      if (!supported || !text.trim()) return;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "ru-RU";
      const voice = pickRussianVoice();
      if (voice) u.voice = voice;
      u.rate = 1;
      u.onend = () => setSpeaking(false);
      u.onerror = () => setSpeaking(false);
      setSpeaking(true);
      window.speechSynthesis.speak(u);
    },
    [supported],
  );

  return { supported, speaking, speak, stop };
}

// ── Диктовка ──────────────────────────────────────────────────────────────

interface RecognitionResultEvent {
  resultIndex: number;
  results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }>;
}

interface Recognition {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: RecognitionResultEvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
}

type RecognitionCtor = new () => Recognition;

function getRecognitionCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export const canListen = () => getRecognitionCtor() !== null;

/**
 * Диктовка по-русски. onFinal получает распознанный текст целиком,
 * interim — то, что слышно прямо сейчас.
 */
export function useDictation(onFinal: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<Recognition | null>(null);
  const finalRef = useRef("");
  const onFinalRef = useRef(onFinal);
  onFinalRef.current = onFinal;
  const supported = canListen();

  useEffect(() => () => recRef.current?.abort(), []);

  const stop = useCallback(() => {
    recRef.current?.stop();
  }, []);

  const start = useCallback(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) return;
    recRef.current?.abort();
    const rec = new Ctor();
    rec.lang = "ru-RU";
    rec.interimResults = true;
    rec.continuous = false;
    rec.maxAlternatives = 1;
    finalRef.current = "";
    setInterim("");
    setError(null);

    rec.onresult = (e) => {
      let text = "";
      let fin = "";
      for (let i = 0; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) fin += r[0].transcript;
        else text += r[0].transcript;
      }
      // Safari иногда не помечает результат финальным — запоминаем последний услышанный текст.
      finalRef.current = (fin || text).trim();
      setInterim(finalRef.current);
    };
    rec.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        setError("Нет доступа к микрофону. Разрешите его в настройках браузера.");
      } else if (e.error === "no-speech") {
        setError("Не расслышал. Попробуйте ещё раз.");
      } else if (e.error !== "aborted") {
        setError("Не удалось распознать речь.");
      }
    };
    rec.onend = () => {
      setListening(false);
      const text = finalRef.current.trim();
      setInterim("");
      if (text) onFinalRef.current(text);
    };

    recRef.current = rec;
    try {
      rec.start();
      setListening(true);
    } catch {
      setListening(false);
      setError("Не удалось включить микрофон.");
    }
  }, []);

  return { supported, listening, interim, error, start, stop };
}
