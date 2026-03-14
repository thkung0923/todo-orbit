import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import type { Task, TaskStatus } from '../types';
import { TaskCard } from './TaskCard';

const COLUMN_LABELS: Record<TaskStatus, string> = {
  backlog: '待辦',
  'in-flight': '進行中',
  done: '已完成',
};

const COLUMN_ICONS: Record<TaskStatus, string> = {
  backlog: '📋',
  'in-flight': '🚀',
  done: '✅',
};

interface ColumnProps {
  status: TaskStatus;
  tasks: Task[];
  onEditTask: (task: Task) => void;
}

export function Column({ status, tasks, onEditTask }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: `column-${status}` });

  return (
    <div className={`column${isOver ? ' column-over' : ''}`}>
      <div className="column-header">
        <span>
          {COLUMN_ICONS[status]} {COLUMN_LABELS[status]}
        </span>
        <span className="column-count">{tasks.length}</span>
      </div>
      <div className="column-body" ref={setNodeRef}>
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onEdit={onEditTask} />
          ))}
        </SortableContext>
        {tasks.length === 0 && (
          <div className="empty-state">
            {status === 'backlog' && '新增任務開始'}
            {status === 'in-flight' && '拖曳任務到這裡開始'}
            {status === 'done' && '完成的任務會出現在這裡'}
          </div>
        )}
      </div>
    </div>
  );
}
