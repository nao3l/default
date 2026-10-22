import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Annotation, Expression } from '../domain/expression';
import type { Repository } from '../store/repository';

interface AppState {
  repository: Repository;
  expressions: Expression[];
  annotations: Map<string, Annotation>;
  loading: boolean;
  reload: () => Promise<void>;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({
  repository,
  children,
}: {
  repository: Repository;
  children: ReactNode;
}) {
  const [expressions, setExpressions] = useState<Expression[]>([]);
  const [annotations, setAnnotations] = useState<Map<string, Annotation>>(new Map());
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const [list, notes] = await Promise.all([
      repository.listExpressions(),
      repository.listAnnotations(),
    ]);
    setExpressions(list);
    setAnnotations(notes);
    setLoading(false);
  }, [repository]);

  useEffect(() => {
    // 初回読み込み。完了時に state を更新する
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void reload();
  }, [reload]);

  const value = useMemo(
    () => ({ repository, expressions, annotations, loading, reload }),
    [repository, expressions, annotations, loading, reload],
  );
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useApp(): AppState {
  const state = useContext(AppContext);
  if (!state) throw new Error('useApp は AppProvider の内側で使ってください');
  return state;
}
