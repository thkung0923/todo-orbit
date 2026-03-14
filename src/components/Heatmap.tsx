import { useMemo } from 'react';
import { useTaskContext } from '../context/TaskContext';
import { toLocalDate } from '../utils/date';

export function Heatmap() {
  const { state } = useTaskContext();

  const heatmapData = useMemo(() => {
    const days = 56; // 8 weeks
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const counts: Record<string, number> = {};

    // Count completed tasks per day (only task completions, not sprints)
    state.tasks.forEach((task) => {
      if (task.completedAt) {
        const day = toLocalDate(new Date(task.completedAt));
        counts[day] = (counts[day] ?? 0) + 1;
      }
    });

    const cells: { date: string; count: number; dayOfWeek: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = toLocalDate(d);
      cells.push({
        date: dateStr,
        count: counts[dateStr] ?? 0,
        dayOfWeek: d.getDay(),
      });
    }

    return cells;
  }, [state.tasks]);

  const maxCount = Math.max(1, ...heatmapData.map((d) => d.count));

  const getLevel = (count: number): number => {
    if (count === 0) return 0;
    const ratio = count / maxCount;
    if (ratio <= 0.25) return 1;
    if (ratio <= 0.5) return 2;
    if (ratio <= 0.75) return 3;
    return 4;
  };

  // Organize into weeks (columns)
  const weeks: typeof heatmapData[] = [];
  let currentWeek: typeof heatmapData = [];
  heatmapData.forEach((cell) => {
    if (cell.dayOfWeek === 0 && currentWeek.length > 0) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    currentWeek.push(cell);
  });
  if (currentWeek.length > 0) weeks.push(currentWeek);

  return (
    <div className="heatmap">
      <h3>活動紀錄</h3>
      <div className="heatmap-grid">
        {weeks.map((week, wi) => (
          <div key={wi} className="heatmap-week">
            {week.map((cell) => (
              <div
                key={cell.date}
                className={`heatmap-cell level-${getLevel(cell.count)}`}
                title={`${cell.date}: ${cell.count} 項活動`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="heatmap-legend">
        <span>少</span>
        {[0, 1, 2, 3, 4].map((level) => (
          <div key={level} className={`heatmap-cell level-${level}`} />
        ))}
        <span>多</span>
      </div>
    </div>
  );
}
