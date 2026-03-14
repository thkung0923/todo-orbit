import { useState, useEffect } from 'react';
import type { Task, TaskStatus, Priority } from '../types';
import { useTaskContext } from '../context/TaskContext';
import { createTask } from '../types';

interface TaskFormProps {
  task: Task | null;
  onClose: () => void;
}

export function TaskForm({ task, onClose }: TaskFormProps) {
  const { dispatch } = useTaskContext();
  const isEditing = task !== null;

  const [title, setTitle] = useState(task?.title ?? '');
  const [notes, setNotes] = useState(task?.notes ?? '');
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? 'backlog');
  const [priority, setPriority] = useState<Priority>(task?.priority ?? 'medium');
  const [dueAt, setDueAt] = useState(task?.dueAt?.slice(0, 10) ?? '');
  const [tagsInput, setTagsInput] = useState(task?.tags.join(', ') ?? '');
  const [estimateMinutes, setEstimateMinutes] = useState(
    task?.estimateMinutes?.toString() ?? ''
  );

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    if (isEditing && task) {
      dispatch({
        type: 'UPDATE_TASK',
        payload: {
          ...task,
          title: title.trim(),
          notes,
          status,
          priority,
          dueAt: dueAt ? new Date(dueAt).toISOString() : null,
          tags,
          estimateMinutes: estimateMinutes ? parseInt(estimateMinutes, 10) : null,
        },
      });
    } else {
      const newTask = createTask(title.trim(), {
        notes,
        status,
        priority,
        dueAt: dueAt ? new Date(dueAt).toISOString() : null,
        tags,
        estimateMinutes: estimateMinutes ? parseInt(estimateMinutes, 10) : null,
      });
      dispatch({ type: 'ADD_TASK', payload: newTask });
    }
    onClose();
  };

  const handleDelete = () => {
    if (task) {
      dispatch({ type: 'DELETE_TASK', payload: task.id });
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <form
        className="task-form"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <h2>{isEditing ? '編輯任務' : '新任務'}</h2>

        <label>
          標題
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="要做什麼？"
            autoFocus
          />
        </label>

        <label>
          備註
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="更多細節..."
            rows={3}
          />
        </label>

        <div className="form-row">
          <label>
            狀態
            <select value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)}>
              <option value="backlog">待辦</option>
              <option value="in-flight">進行中</option>
              <option value="done">已完成</option>
            </select>
          </label>

          <label>
            優先級
            <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
              <option value="low">低</option>
              <option value="medium">中</option>
              <option value="high">高</option>
              <option value="urgent">緊急</option>
            </select>
          </label>
        </div>

        <div className="form-row">
          <label>
            截止日期
            <input
              type="date"
              value={dueAt}
              onChange={(e) => setDueAt(e.target.value)}
            />
          </label>

          <label>
            預估（分鐘）
            <input
              type="number"
              value={estimateMinutes}
              onChange={(e) => setEstimateMinutes(e.target.value)}
              min="1"
              placeholder="25"
            />
          </label>
        </div>

        <label>
          標籤（逗號分隔）
          <input
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="工作, 個人, 緊急"
          />
        </label>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary">
            {isEditing ? '儲存' : '新增任務'}
          </button>
          {isEditing && (
            <button
              type="button"
              className="btn btn-danger"
              onClick={handleDelete}
            >
              刪除
            </button>
          )}
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            取消
          </button>
        </div>
      </form>
    </div>
  );
}
