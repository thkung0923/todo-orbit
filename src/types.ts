export type TaskStatus = 'backlog' | 'in-flight' | 'done';
export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id: string;
  title: string;
  notes: string;
  status: TaskStatus;
  priority: Priority;
  dueAt: string | null;
  tags: string[];
  starred: boolean;
  estimateMinutes: number | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  order: number;
}

export interface SprintSession {
  id: string;
  taskId: string | null;
  startedAt: string;
  endedAt: string | null;
  plannedMinutes: number;
  completed: boolean;
}

export interface DailyStat {
  date: string; // YYYY-MM-DD
  tasksCompleted: number;
  sprintMinutes: number;
}

export { createTask } from './context/TaskContext';
