import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { useLivePrices, PriceTick } from "@/hooks/use-live-prices";

export interface PriceAlert {
  id: string;
  symbol: string;
  targetPrice: number;
  condition: "above" | "below";
  note?: string;
  createdAt: string;
  triggered: boolean;
  triggeredAt?: string;
  triggeredPrice?: number;
}

export interface AlertNotification {
  id: string;
  alert: PriceAlert;
  triggeredPrice: number;
}

interface AlertContextValue {
  alerts: PriceAlert[];
  notifications: AlertNotification[];
  addAlert: (alert: Omit<PriceAlert, "id" | "createdAt" | "triggered">) => void;
  removeAlert: (id: string) => void;
  clearTriggered: () => void;
  dismissNotification: (id: string) => void;
  activeCount: number;
}

const AlertContext = createContext<AlertContextValue | null>(null);

const LS_KEY = "nexusflow-alerts";

function loadFromStorage(): PriceAlert[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveToStorage(alerts: PriceAlert[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(alerts));
  } catch {}
}

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [alerts, setAlerts] = useState<PriceAlert[]>(loadFromStorage);
  const [notifications, setNotifications] = useState<AlertNotification[]>([]);
  const checkedRef = useRef<Set<string>>(new Set(
    loadFromStorage().filter(a => a.triggered).map(a => a.id)
  ));

  const { prices } = useLivePrices(3000);

  // Persist on change
  useEffect(() => {
    saveToStorage(alerts);
  }, [alerts]);

  // Check alerts whenever prices tick
  useEffect(() => {
    if (prices.size === 0) return;

    setAlerts(prev => {
      let changed = false;
      const next = prev.map(alert => {
        if (alert.triggered || checkedRef.current.has(alert.id)) return alert;
        const tick = prices.get(alert.symbol);
        if (!tick) return alert;

        const fired =
          alert.condition === "above"
            ? tick.price >= alert.targetPrice
            : tick.price <= alert.targetPrice;

        if (fired) {
          checkedRef.current.add(alert.id);
          changed = true;
          const triggered: PriceAlert = {
            ...alert,
            triggered: true,
            triggeredAt: new Date().toISOString(),
            triggeredPrice: tick.price,
          };
          setNotifications(n => [
            { id: `notif-${Date.now()}`, alert: triggered, triggeredPrice: tick.price },
            ...n,
          ].slice(0, 6));
          return triggered;
        }
        return alert;
      });
      return changed ? next : prev;
    });
  }, [prices]);

  const addAlert = useCallback((data: Omit<PriceAlert, "id" | "createdAt" | "triggered">) => {
    const alert: PriceAlert = {
      ...data,
      id: `alert-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString(),
      triggered: false,
    };
    setAlerts(prev => [alert, ...prev]);
  }, []);

  const removeAlert = useCallback((id: string) => {
    checkedRef.current.delete(id);
    setAlerts(prev => prev.filter(a => a.id !== id));
  }, []);

  const clearTriggered = useCallback(() => {
    setAlerts(prev => prev.filter(a => !a.triggered));
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const activeCount = alerts.filter(a => !a.triggered).length;

  return (
    <AlertContext.Provider value={{ alerts, notifications, addAlert, removeAlert, clearTriggered, dismissNotification, activeCount }}>
      {children}
    </AlertContext.Provider>
  );
}

export function useAlerts() {
  const ctx = useContext(AlertContext);
  if (!ctx) throw new Error("useAlerts must be used within AlertProvider");
  return ctx;
}
