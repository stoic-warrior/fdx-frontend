import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

interface ToastMessage {
  id: number;
  text: string;
}

interface ToastContextValue {
  showToast: (text: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [messages, setMessages] = useState<ToastMessage[]>([]);

  const showToast = useCallback((text: string) => {
    setMessages((prev) => {
      const id = Date.now();
      return [...prev, { id, text }];
    });
    setTimeout(() => {
      setMessages((prev) => prev.slice(1));
    }, 3000);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed right-6 top-6 z-50 space-y-2">
        {messages.map((message) => (
          <div
            key={message.id}
            className="rounded-lg bg-slate-900 px-4 py-3 text-sm text-white shadow-lg"
          >
            {message.text}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
};
