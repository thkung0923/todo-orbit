import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task, TaskStatus } from '../types';
import { useTaskContext } from '../context/TaskContext';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
}

const NEXT_STATUS: Record<TaskStatus, TaskStatus | null> = {
  backlog: 'in-flight',
  'in-flight': 'done',
  done: null,
};

const PREV_STATUS: Record<TaskStatus, TaskStatus | null> = {
  backlog: null,
  'in-flight': 'backlog',
  done: 'in-flight',
};

const MOVE_LABELS: Record<TaskStatus, string> = {
  backlog: '待辦',
  'in-flight': '進行中',
  done: '已完成',
};

export function TaskCard({ task, onEdit }: TaskCardProps) {
  const { dispatch } = useTaskContext();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isOverdue =
    task.dueAt && new Date(task.dueAt) < new Date() && task.status !== 'done';

  const toggleStar = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch({
      type: 'UPDATE_TASK',
      payload: { ...task, starred: !task.starred },
    });
  };

  const moveTask = (e: React.MouseEvent, newStatus: TaskStatus) => {
    e.stopPropagation();
    dispatch({
      type: 'MOVE_TASK',
      payload: { id: task.id, status: newStatus },
    });
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const month = d.getMonth() + 1;
    const day = d.getDate();
    return `${month}/${day}`;
  };

  const next = NEXT_STATUS[task.status];
  const prev = PREV_STATUS[task.status];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`task-card priority-${task.priority}${isDragging ? ' dragging' : ''}`}
      onClick={() => onEdit(task)}
      {...attributes}
      {...listeners}
    >
      <div className="task-card-header">
        <span className="task-title">{task.title}</span>
        <button
          className={`star-btn${task.starred ? ' starred' : ''}`}
          onClick={toggleStar}
          aria-label={task.starred ? 'Unstar' : 'Star'}
        >
          {task.starred ? '★' : '☆'}
        </button>
      </div>

      {task.notes && <p className="task-notes">{task.notes}</p>}

      <div className="task-meta">
        {task.dueAt && (
          <span className={`due-date${isOverdue ? ' overdue' : ''}`}>
            {isOverdue ? '⚠ ' : ''}
            {formatDate(task.dueAt)}
          </span>
        )}
        {task.estimateMinutes && (
          <span className="estimate">{task.estimateMinutes}m</span>
        )}
        {task.tags.map((tag) => (
          <span key={tag} className="tag">
            {tag}
          </span>
        ))}
      </div>

      <div className="task-actions">
        {prev && (
          <button
            className="btn btn-ghost btn-sm move-btn"
            onClick={(e) => moveTask(e, prev)}
            aria-label={`移到${MOVE_LABELS[prev]}`}
          >
            ← {MOVE_LABELS[prev]}
          </button>
        )}
        {next && (
          <button
            className="btn btn-ghost btn-sm move-btn"
            onClick={(e) => moveTask(e, next)}
            aria-label={`移到${MOVE_LABELS[next]}`}
          >
            {MOVE_LABELS[next]} →
          </button>
        )}
      </div>
    </div>
  );
}
