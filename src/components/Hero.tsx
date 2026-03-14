import { useMemo } from 'react';
import { useTaskContext } from '../context/TaskContext';

interface HeroProps {
  onNewTask: () => void;
}

export function Hero({ onNewTask }: HeroProps) {
  const { state } = useTaskContext();

  const summary = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const inFlight = state.tasks.filter((t) => t.status === 'in-flight').length;
    const doneToday = state.tasks.filter(
      (t) => t.completedAt?.slice(0, 10) === today
    ).length;
    const totalBacklog = state.tasks.filter((t) => t.status === 'backlog').length;

    // Streak: only count task completions
    const completionDays = new Set<string>();
    state.tasks.forEach((t) => {
      if (t.completedAt) completionDays.add(t.completedAt.slice(0, 10));
    });

    let streak = 0;
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    while (true) {
      const dateStr = d.toISOString().slice(0, 10);
      if (completionDays.has(dateStr)) {
        streak++;
        d.setDate(d.getDate() - 1);
      } else if (streak === 0) {
        d.setDate(d.getDate() - 1);
        if (completionDays.has(d.toISOString().slice(0, 10))) {
          streak++;
          d.setDate(d.getDate() - 1);
          continue;
        }
        break;
      } else {
        break;
      }
    }

    return { inFlight, doneToday, totalBacklog, streak };
  }, [state.tasks]);

  const { filter } = state;
  const { dispatch } = useTaskContext();
  const hasActiveFilters =
    filter.search || filter.showStarredOnly || filter.showTodayOnly || filter.tags.length > 0;

  return (
    <div className="hero">
      <div className="hero-left">
        <h1>Todo Orbit</h1>
        <div className="hero-stats">
          <span className="hero-stat">
            <strong>{summary.inFlight}</strong> 進行中
          </span>
          <span className="hero-stat">
            <strong>{summary.doneToday}</strong> 今日完成
          </span>
          <span className="hero-stat">
            <strong>{summary.totalBacklog}</strong> 待辦
          </span>
          {summary.streak > 0 && (
            <span className="hero-stat streak">
              🔥 <strong>{summary.streak}</strong> 天連續
            </span>
          )}
        </div>
      </div>
      <div className="hero-right">
        {hasActiveFilters && (
          <div className="filter-bar">
            {filter.showStarredOnly && (
              <span className="filter-pill">★ 星標</span>
            )}
            {filter.showTodayOnly && (
              <span className="filter-pill">📅 今天</span>
            )}
            {filter.search && (
              <span className="filter-pill">🔍 {filter.search}</span>
            )}
            <button
              className="btn btn-ghost btn-sm"
              onClick={() =>
                dispatch({
                  type: 'SET_FILTER',
                  payload: {
                    search: '',
                    tags: [],
                    showStarredOnly: false,
                    showTodayOnly: false,
                    status: null,
                  },
                })
              }
            >
              清除
            </button>
          </div>
        )}
        <button className="btn btn-primary" onClick={onNewTask}>
          + 新任務
        </button>
        <span className="hero-hint">Ctrl+K 指令列</span>
      </div>
    </div>
  );
}
