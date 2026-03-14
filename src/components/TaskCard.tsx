import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task } from '../types';
import { useTaskContext } from '../context/TaskContext';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
}

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

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const month = d.getMonth() + 1;
    const day = d.getDate();
    return `${month}/${day}`;
  };

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
    </div>
  );
}
