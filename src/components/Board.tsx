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
  type DragOverEvent,
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

  const filteredTasks = state.tasks.filter((task) => {
    const f = state.filter;
    if (f.search && !task.title.toLowerCase().includes(f.search.toLowerCase())) return false;
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

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeStatus = getColumnFromId(active.id as string);
    const overStatus = getColumnFromId(over.id as string);

    if (activeStatus && overStatus && activeStatus !== overStatus) {
      dispatch({
        type: 'MOVE_TASK',
        payload: { id: active.id as string, status: overStatus },
      });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    const activeTask = findTaskById(activeId);
    const overTask = findTaskById(overId);

    if (activeTask && overTask && activeTask.status === overTask.status) {
      const columnTasks = tasksByStatus(activeTask.status);
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
      onDragOver={handleDragOver}
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
