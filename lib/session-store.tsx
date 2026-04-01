import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Session } from "./types";
import { analyzeSentiment } from "./sentiment";
import { generateDummySessions } from "./dummy-data";
const STORAGE_KEY = "emotion_sessions";
interface SessionStoreContextType {
  sessions: Session[]; loading: boolean;
  addSession: (input: { speechText: string; selfReport: { valence: number; arousal: number }; biometrics: { heartRate: number; skinConductance: number } }) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  loadDummyData: () => Promise<void>;
  clearAll: () => Promise<void>;
}
const SessionStoreContext = createContext<SessionStoreContextType | null>(null);
function uuid(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0; return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}
export function SessionStoreProvider({ children }: { children: ReactNode }) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      try { const raw = await AsyncStorage.getItem(STORAGE_KEY); if (raw) setSessions(JSON.parse(raw)); } catch (e) { console.error("Failed to load sessions", e); }
      setLoading(false);
    })();
  }, []);
  const persist = useCallback(async (data: Session[]) => {
    setSessions(data); await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, []);
  const addSession = useCallback(async (input: { speechText: string; selfReport: { valence: number; arousal: number }; biometrics: { heartRate: number; skinConductance: number } }) => {
    const result = analyzeSentiment(input.speechText);
    const session: Session = { id: uuid(), timestamp: new Date().toISOString(), speech: { text: input.speechText, sentimentScore: result.score, sentimentLabel: result.label }, selfReport: input.selfReport, biometrics: input.biometrics };
    const updated = [session, ...sessions]; await persist(updated);
  }, [sessions, persist]);
  const deleteSession = useCallback(async (id: string) => { await persist(sessions.filter((s) => s.id !== id)); }, [sessions, persist]);
  const loadDummyData = useCallback(async () => { const dummy = generateDummySessions(20); await persist([...dummy, ...sessions]); }, [sessions, persist]);
  const clearAll = useCallback(async () => { await persist([]); }, [persist]);
  return (<SessionStoreContext.Provider value={{ sessions, loading, addSession, deleteSession, loadDummyData, clearAll }}>{children}</SessionStoreContext.Provider>);
}
export function useSessionStore(): SessionStoreContextType {
  const ctx = useContext(SessionStoreContext);
  if (!ctx) throw new Error("useSessionStore must be used within SessionStoreProvider");
  return ctx;
}
