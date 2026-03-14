import { useTaskContext } from '../context/TaskContext';
import { useStats } from '../hooks/useStats';

interface HeroProps {
  onNewTask: () => void;
}

export function Hero({ onNewTask }: HeroProps) {
  const { state, dispatch } = useTaskContext();
  const stats = useStats(state.tasks, state.sprints);

  const { filter } = state;
  const hasActiveFilters =
    filter.search || filter.showStarredOnly || filter.showTodayOnly || filter.tags.length > 0;

  return (
    <div className="hero">
      <div className="hero-left">
        <h1>Todo Orbit</h1>
        <div className="hero-stats">
          <span className="hero-stat">
            <strong>{stats.inFlight}</strong> 進行中
          </span>
          <span className="hero-stat">
            <strong>{stats.todayCompleted}</strong> 今日完成
          </span>
          <span className="hero-stat">
            <strong>{stats.totalBacklog}</strong> 待辦
          </span>
          {stats.streak > 0 && (
            <span className="hero-stat streak">
              🔥 <strong>{stats.streak}</strong> 天連續
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
