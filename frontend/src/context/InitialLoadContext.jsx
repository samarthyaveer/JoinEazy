import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const STEP_KEYS = ["auth", "route", "page"];

const InitialLoadContext = createContext(null);

export function InitialLoadProvider({ children }) {
  const [steps, setSteps] = useState(() => ({
    auth: false,
    route: false,
    page: false,
  }));

  const markStepReady = useCallback((step) => {
    if (!STEP_KEYS.includes(step)) return;
    setSteps((prev) => {
      if (prev[step]) return prev;
      return { ...prev, [step]: true };
    });
  }, []);

  const completedCount = STEP_KEYS.reduce(
    (acc, key) => acc + (steps[key] ? 1 : 0),
    0,
  );
  const progress = Math.round((completedCount / STEP_KEYS.length) * 100);
  const complete = steps.auth && steps.route && steps.page;

  const value = useMemo(
    () => ({
      progress,
      complete,
      inProgress: !complete,
      markStepReady,
    }),
    [progress, complete, markStepReady],
  );

  return (
    <InitialLoadContext.Provider value={value}>
      {children}
    </InitialLoadContext.Provider>
  );
}

export function useInitialLoad() {
  const ctx = useContext(InitialLoadContext);
  if (!ctx) {
    throw new Error("useInitialLoad must be used within InitialLoadProvider");
  }
  return ctx;
}

export function usePageReady(isReady = true) {
  const { markStepReady } = useInitialLoad();

  useEffect(() => {
    if (isReady) {
      markStepReady("page");
    }
  }, [isReady, markStepReady]);
}
