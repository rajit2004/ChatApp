import {
  createContext,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { registerLoadingHandlers } from "../services/api";
import Loader from "../components/ui/Loader";

interface LoadingContextValue {
  show: () => void;
  hide: () => void;
}

const LoadingContext = createContext<LoadingContextValue | null>(null);

const SHOW_DELAY_MS = 400;

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const pendingRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const show = useCallback(() => {
    pendingRef.current += 1;
    if (pendingRef.current === 1 && !timerRef.current) {
      timerRef.current = setTimeout(() => {
        if (pendingRef.current > 0) setVisible(true);
        timerRef.current = null;
      }, SHOW_DELAY_MS);
    }
  }, []);

  const hide = useCallback(() => {
    pendingRef.current = Math.max(0, pendingRef.current - 1);
    if (pendingRef.current === 0) {
      clearTimer();
      setVisible(false);
    }
  }, []);

  useEffect(() => {
    registerLoadingHandlers(show, hide);
    return () => registerLoadingHandlers(null, null);
  }, [show, hide]);

  return (
    <LoadingContext.Provider value={{ show, hide }}>
      {children}
      {visible && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center backdrop-blur-[2px]"
          style={{ backgroundColor: "var(--theme-overlay)" }}
          aria-live="polite"
          aria-busy="true"
        >
          <Loader message="Please wait..." size="lg" />
        </div>
      )}
    </LoadingContext.Provider>
  );
}