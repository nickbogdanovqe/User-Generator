"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { isTestEnv, type TestEnv } from "@/lib/provision/types";

const TEST_ENV_STORAGE_KEY = "user-generator.testEnv";

type EnvContextValue = {
  testEnv: TestEnv;
  setTestEnv: (next: TestEnv) => void;
};

const EnvContext = createContext<EnvContextValue | null>(null);

export function EnvProvider({ children }: { children: ReactNode }) {
  const [testEnv, setTestEnvState] = useState<TestEnv>("dev");

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(TEST_ENV_STORAGE_KEY);
      if (stored && isTestEnv(stored)) {
        queueMicrotask(() => setTestEnvState(stored));
      }
    } catch {
      // ignore storage access errors
    }
  }, []);

  const setTestEnv = useCallback((next: TestEnv) => {
    setTestEnvState(next);
    try {
      window.localStorage.setItem(TEST_ENV_STORAGE_KEY, next);
    } catch {
      // ignore storage access errors
    }
  }, []);

  const value = useMemo(() => ({ testEnv, setTestEnv }), [testEnv, setTestEnv]);

  return <EnvContext.Provider value={value}>{children}</EnvContext.Provider>;
}

export function useTestEnv(): EnvContextValue {
  const ctx = useContext(EnvContext);
  if (!ctx) {
    throw new Error("useTestEnv must be used within <EnvProvider>");
  }
  return ctx;
}

export function envTagClass(testEnv: TestEnv): string {
  return testEnv === "dev" ? "env-tag env-tag-dev" : "env-tag env-tag-tst";
}
