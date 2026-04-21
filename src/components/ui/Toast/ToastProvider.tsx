"use client";

import { createContext, useCallback, useContext, useState } from "react";
import Toast from "./Toast";

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface ToastData {
  id: number;
  message: string;
  action?: ToastAction;
}

interface ToastContextValue {
  showToast: (message: string, action?: ToastAction) => void;
}

const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

let nextId = 0;

export default function ToastProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const showToast = useCallback(
    (message: string, action?: ToastAction) => {
      const id = nextId++;
      setToasts((prev) => [...prev, { id, message, action }]);
    },
    [],
  );

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        aria-live="polite"
        style={{
          position: "fixed",
          bottom: "1.5rem",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "0.5rem",
          pointerEvents: "none",
        }}
      >
        {toasts.map((t) => (
          <Toast
            key={t.id}
            message={t.message}
            action={t.action}
            onDismiss={() => dismiss(t.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
