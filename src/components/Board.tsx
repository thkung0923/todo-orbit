import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import type { Task, TaskStatus } from '../types';
import { useTaskContext } from '../context/TaskContext';
import { Column } from './Column';
import { TaskCard } from './TaskCard';

const STATUSES: TaskStatus[] = ['backlog', 'in-flight', 'done'];

interface BoardProps {
  onEditTask: (task: Task) => void;
}

export function Board({ onEditTask }: BoardProps) {
  const { state, dispatch } = useTaskContext();
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const searchLower = state.filter.search.toLowerCase();

  const filteredTasks = state.tasks.filter((task) => {
    const f = state.filter;
    if (f.search) {
      const matchTitle = task.title.toLowerCase().includes(searchLower);
      const matchNotes = task.notes.toLowerCase().includes(searchLower);
      const matchTags = task.tags.some((t) => t.toLowerCase().includes(searchLower));
      if (!matchTitle && !matchNotes && !matchTags) return false;
    }
    if (f.showStarredOnly && !task.starred) return false;
    if (f.showTodayOnly) {
      const today = new Date().toISOString().slice(0, 10);
      if (task.dueAt?.slice(0, 10) !== today) return false;
    }
    if (f.tags.length > 0 && !f.tags.some((t) => task.tags.includes(t))) return false;
    if (f.status && task.status !== f.status) return false;
    return true;
  });

  const tasksByStatus = (status: TaskStatus) =>
    filteredTasks
      .filter((t) => t.status === status)
      .sort((a, b) => a.order - b.order);

  const findTaskById = (id: string) => state.tasks.find((t) => t.id === id);

  const getColumnFromId = (id: string): TaskStatus | null => {
    if (typeof id === 'string' && id.startsWith('column-')) {
      return id.replace('column-', '') as TaskStatus;
    }
    const task = findTaskById(id as string);
    return task?.status ?? null;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const task = findTaskById(event.active.id as string);
    if (task) setActiveTask(task);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeStatus = getColumnFromId(activeId);
    const overStatus = getColumnFromId(overId);

    // Cross-column move: only commit on drop, not on hover
    if (activeStatus && overStatus && activeStatus !== overStatus) {
      dispatch({
        type: 'MOVE_TASK',
        payload: { id: activeId, status: overStatus },
      });
      return;
    }

    // Same-column reorder
    if (activeId === overId) return;
    const draggedTask = findTaskById(activeId);
    const overTask = findTaskById(overId);

    if (draggedTask && overTask && draggedTask.status === overTask.status) {
      const columnTasks = tasksByStatus(draggedTask.status);
      const oldIndex = columnTasks.findIndex((t) => t.id === activeId);
      const newIndex = columnTasks.findIndex((t) => t.id === overId);
      if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = arrayMove(columnTasks, oldIndex, newIndex);
        dispatch({
          type: 'REORDER_TASKS',
          payload: reordered.map((t, i) => ({ ...t, order: i })),
        });
      }
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="board">
        {STATUSES.map((status) => (
          <Column
            key={status}
            status={status}
            tasks={tasksByStatus(status)}
            onEditTask={onEditTask}
          />
        ))}
      </div>
      <DragOverlay>
        {activeTask ? (
          <TaskCard task={activeTask} onEdit={() => {}} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
