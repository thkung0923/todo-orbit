import { useMemo } from 'react';
import type { Task, SprintSession } from '../types';
import { toLocalDate } from '../utils/date';

export function useStats(tasks: Task[], sprints: SprintSession[]) {
  return useMemo(() => {
    const today = toLocalDate(new Date());

    const todayCompleted = tasks.filter(
      (t) => t.completedAt && toLocalDate(new Date(t.completedAt)) === today
    ).length;

    // Streak: consecutive days with at least 1 task completion
    const completionDays = new Set<string>();
    tasks.forEach((t) => {
      if (t.completedAt) completionDays.add(toLocalDate(new Date(t.completedAt)));
    });

    let streak = 0;
    const d = new Date();
    d.setHours(0, 0, 0, 0);

    // If today has no completions, start checking from yesterday
    if (!completionDays.has(toLocalDate(d))) {
      d.setDate(d.getDate() - 1);
    }

    // Count consecutive days backwards
    while (completionDays.has(toLocalDate(d))) {
      streak++;
      d.setDate(d.getDate() - 1);
    }

    // Recent completions
    const recentCompletions = tasks
      .filter((t) => t.completedAt)
      .sort((a, b) => (b.completedAt! > a.completedAt! ? 1 : -1))
      .slice(0, 5);

    // Total focus minutes today
    const todayFocusMinutes = sprints
      .filter((s) => s.completed && s.endedAt && toLocalDate(new Date(s.endedAt)) === today)
      .reduce((sum, s) => sum + s.plannedMinutes, 0);

    const inFlight = tasks.filter((t) => t.status === 'in-flight').length;
    const totalBacklog = tasks.filter((t) => t.status === 'backlog').length;

    return {
      todayCompleted,
      streak,
      recentCompletions,
      todayFocusMinutes,
      inFlight,
      totalBacklog,
    };
  }, [tasks, sprints]);
}
