import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { generateDummySessions } from "./dummy-data";
import { analyzeSentiment } from "./sentiment";
import type { Session } from "./types";

const STORAGE_KEY = "emotion_sessions";

type AddSessionInput = {
  speechText: string;
  selfReport: {
    valence: number;
    arousal: number;
  };
  biometrics: {
    heartRate: number;
    skinConductance: number;
  };
};

type SessionStoreContextType = {
  sessions: Session[];
  loading: boolean;
  addSession: (input: AddSessionInput) => Promise<void>;
  importSessions: (items: Session[]) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  loadDummyData: () => Promise<void>;
  clearAll: () => Promise<void>;
};

const SessionStoreContext = createContext<SessionStoreContextType | null>(null);

export function SessionStoreProvider({ children }: { children: ReactNode }) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const sessionsRef = useRef<Session[]>([]);

  useEffect(() => {
    void (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);

        if (raw) {
          const parsed = JSON.parse(raw) as Session[];
          sessionsRef.current = parsed;
          setSessions(parsed);
        }
      } catch (error) {
        console.error("Failed to load sessions", error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const persist = useCallback(async (nextSessions: Session[]) => {
    sessionsRef.current = nextSessions;
    setSessions(nextSessions);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextSessions));
  }, []);

  const updateSessions = useCallback(
    async (updater: (current: Session[]) => Session[]) => {
      const nextSessions = updater(sessionsRef.current);
      await persist(nextSessions);
    },
    [persist],
  );

  const addSession = useCallback(
    async (input: AddSessionInput) => {
      const sentiment = analyzeSentiment(input.speechText);

      const session: Session = {
        id: uuid(),
        timestamp: new Date().toISOString(),
        speech: {
          text: input.speechText,
          sentimentScore: sentiment.score,
          sentimentLabel: sentiment.label,
        },
        selfReport: input.selfReport,
        biometrics: input.biometrics,
      };

      await updateSessions((current) => [session, ...current]);
    },
    [updateSessions],
  );

  const importSessions = useCallback(
    async (items: Session[]) => {
      if (items.length === 0) {
        return;
      }

      await updateSessions((current) => [...items, ...current]);
    },
    [updateSessions],
  );

  const deleteSession = useCallback(
    async (id: string) => {
      await updateSessions((current) => current.filter((session) => session.id !== id));
    },
    [updateSessions],
  );

  const loadDummyData = useCallback(async () => {
    const dummySessions = generateDummySessions(20);
    await updateSessions((current) => [...dummySessions, ...current]);
  }, [updateSessions]);

  const clearAll = useCallback(async () => {
    await persist([]);
  }, [persist]);

  return (
    <SessionStoreContext.Provider
      value={{
        sessions,
        loading,
        addSession,
        importSessions,
        deleteSession,
        loadDummyData,
        clearAll,
      }}
    >
      {children}
    </SessionStoreContext.Provider>
  );
}

export function useSessionStore(): SessionStoreContextType {
  const context = useContext(SessionStoreContext);

  if (!context) {
    throw new Error("useSessionStore must be used within SessionStoreProvider");
  }

  return context;
}

function uuid(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (character) => {
    const random = (Math.random() * 16) | 0;
    const value = character === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}
