import { useMemo } from 'react';
import { useTaskContext } from '../context/TaskContext';

export function Momentum() {
  const { state } = useTaskContext();

  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);

    const todayCompleted = state.tasks.filter(
      (t) => t.completedAt?.slice(0, 10) === today
    ).length;

    const todaySprints = state.sprints.filter(
      (s) => s.completed && s.endedAt?.slice(0, 10) === today
    ).length;

    // Calculate streak: consecutive days with at least 1 task completion
    const completionDays = new Set<string>();
    state.tasks.forEach((t) => {
      if (t.completedAt) completionDays.add(t.completedAt.slice(0, 10));
    });

    let streak = 0;
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    // Check today first, then go backwards
    while (true) {
      const dateStr = d.toISOString().slice(0, 10);
      if (completionDays.has(dateStr)) {
        streak++;
        d.setDate(d.getDate() - 1);
      } else {
        // If today has no completions yet, check if yesterday starts a streak
        if (streak === 0) {
          d.setDate(d.getDate() - 1);
          const yesterday = d.toISOString().slice(0, 10);
          if (completionDays.has(yesterday)) {
            streak++;
            d.setDate(d.getDate() - 1);
            continue;
          }
        }
        break;
      }
    }

    // Recent completions
    const recentCompletions = state.tasks
      .filter((t) => t.completedAt)
      .sort((a, b) => (b.completedAt! > a.completedAt! ? 1 : -1))
      .slice(0, 5);

    // Total focus minutes today
    const todayFocusMinutes = state.sprints
      .filter((s) => s.completed && s.endedAt?.slice(0, 10) === today)
      .reduce((sum, s) => sum + s.plannedMinutes, 0);

    return { todayCompleted, todaySprints, streak, recentCompletions, todayFocusMinutes };
  }, [state.tasks, state.sprints]);

  return (
    <div className="momentum">
      <h3>動力</h3>
      <div className="momentum-stats">
        <div className="stat-card">
          <span className="stat-value">{stats.todayCompleted}</span>
          <span className="stat-label">今日完成</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats.streak}</span>
          <span className="stat-label">連續天數</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats.todayFocusMinutes}</span>
          <span className="stat-label">專注分鐘</span>
        </div>
      </div>

      {stats.recentCompletions.length > 0 && (
        <div className="recent-completions">
          <h4>最近完成</h4>
          <ul>
            {stats.recentCompletions.map((task) => (
              <li key={task.id}>
                <span className="completion-title">{task.title}</span>
                <span className="completion-date">
                  {new Date(task.completedAt!).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
