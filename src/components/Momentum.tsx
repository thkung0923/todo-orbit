import { useTaskContext } from '../context/TaskContext';
import { useStats } from '../hooks/useStats';

export function Momentum() {
  const { state } = useTaskContext();
  const stats = useStats(state.tasks, state.sprints);

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
