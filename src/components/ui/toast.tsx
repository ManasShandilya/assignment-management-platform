"use client";
import { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";

type Toast = { id: number; kind: "success" | "error"; message: string };
const Ctx = createContext<(kind: Toast["kind"], message: string) => void>(() => {});
export const useToast = () => useContext(Ctx);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((kind: Toast["kind"], message: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, kind, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);

  return (
    <Ctx.Provider value={push}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className="flex animate-toastIn items-center gap-2 rounded-xl border border-surface-line bg-white px-4 py-3 text-sm shadow-pop">
            {t.kind === "success"
              ? <CheckCircle2 className="h-4 w-4 text-status-green" aria-hidden />
              : <XCircle className="h-4 w-4 text-status-red" aria-hidden />}
            {t.message}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
