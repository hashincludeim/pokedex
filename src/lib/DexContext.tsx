import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { loadDexData, type DexData, type DexEntry } from './api';
import { useAsync } from './hooks';

interface DexContextValue {
  data: DexData | undefined;
  byId: Map<number, DexEntry>;
  error: Error | undefined;
  loading: boolean;
  retry: () => void;
}

const DexContext = createContext<DexContextValue | null>(null);

export function DexProvider({ children }: { children: ReactNode }) {
  const { data, error, loading, retry } = useAsync(loadDexData, []);
  const value = useMemo(
    () => ({ data, error, loading, retry, byId: new Map(data?.entries.map((e) => [e.id, e])) }),
    [data, error, loading, retry],
  );
  return <DexContext.Provider value={value}>{children}</DexContext.Provider>;
}

export function useDex(): DexContextValue {
  const ctx = useContext(DexContext);
  if (!ctx) throw new Error('useDex must be used inside <DexProvider>');
  return ctx;
}
