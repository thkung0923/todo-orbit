import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import { TaskProvider, useTaskContext, createTask } from '../context/TaskContext';

// Mock IndexedDB
vi.mock('../db', () => ({
  getAllTasks: vi.fn(() => Promise.resolve([])),
  getAllSprints: vi.fn(() => Promise.resolve([])),
  saveTask: vi.fn(() => Promise.resolve()),
  deleteTask: vi.fn(() => Promise.resolve()),
  saveSprint: vi.fn(() => Promise.resolve()),
  clearCompletedTasks: vi.fn(() => Promise.resolve()),
}));

function wrapper({ children }: { children: ReactNode }) {
  return <TaskProvider>{children}</TaskProvider>;
}

describe('createTask', () => {
  it('creates a task with sensible defaults', () => {
    const task = createTask('Test task');
    expect(task.title).toBe('Test task');
    expect(task.status).toBe('backlog');
    expect(task.priority).toBe('medium');
    expect(task.starred).toBe(false);
    expect(task.notes).toBe('');
    expect(task.tags).toEqual([]);
    expect(task.id).toBeTruthy();
  });

  it('accepts overrides', () => {
    const task = createTask('Urgent', { priority: 'urgent', starred: true });
    expect(task.priority).toBe('urgent');
    expect(task.starred).toBe(true);
  });
});

describe('TaskContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('provides initial state', async () => {
    const { result } = renderHook(() => useTaskContext(), { wrapper });
    // Wait for loading to complete
    await vi.waitFor(() => {
      expect(result.current.state.loading).toBe(false);
    });
    expect(result.current.state.tasks).toEqual([]);
    expect(result.current.state.sprints).toEqual([]);
  });

  it('adds a task', async () => {
    const { result } = renderHook(() => useTaskContext(), { wrapper });
    await vi.waitFor(() => {
      expect(result.current.state.loading).toBe(false);
    });

    const task = createTask('New task');
    act(() => {
      result.current.dispatch({ type: 'ADD_TASK', payload: task });
    });

    expect(result.current.state.tasks).toHaveLength(1);
    expect(result.current.state.tasks[0].title).toBe('New task');
  });

  it('deletes a task', async () => {
    const { result } = renderHook(() => useTaskContext(), { wrapper });
    await vi.waitFor(() => {
      expect(result.current.state.loading).toBe(false);
    });

    const task = createTask('To delete');
    act(() => {
      result.current.dispatch({ type: 'ADD_TASK', payload: task });
    });
    act(() => {
      result.current.dispatch({ type: 'DELETE_TASK', payload: task.id });
    });

    expect(result.current.state.tasks).toHaveLength(0);
  });

  it('moves task to done and sets completedAt', async () => {
    const { result } = renderHook(() => useTaskContext(), { wrapper });
    await vi.waitFor(() => {
      expect(result.current.state.loading).toBe(false);
    });

    const task = createTask('Move me');
    act(() => {
      result.current.dispatch({ type: 'ADD_TASK', payload: task });
    });
    act(() => {
      result.current.dispatch({
        type: 'MOVE_TASK',
        payload: { id: task.id, status: 'done' },
      });
    });

    const moved = result.current.state.tasks[0];
    expect(moved.status).toBe('done');
    expect(moved.completedAt).toBeTruthy();
  });

  it('clears completed tasks', async () => {
    const { result } = renderHook(() => useTaskContext(), { wrapper });
    await vi.waitFor(() => {
      expect(result.current.state.loading).toBe(false);
    });

    const t1 = createTask('Keep', { status: 'backlog' });
    const t2 = createTask('Remove', { status: 'done', completedAt: new Date().toISOString() });
    act(() => {
      result.current.dispatch({ type: 'ADD_TASK', payload: t1 });
      result.current.dispatch({ type: 'ADD_TASK', payload: t2 });
    });
    act(() => {
      result.current.dispatch({ type: 'CLEAR_COMPLETED' });
    });

    expect(result.current.state.tasks).toHaveLength(1);
    expect(result.current.state.tasks[0].title).toBe('Keep');
  });

  it('sets filters', async () => {
    const { result } = renderHook(() => useTaskContext(), { wrapper });
    await vi.waitFor(() => {
      expect(result.current.state.loading).toBe(false);
    });

    act(() => {
      result.current.dispatch({
        type: 'SET_FILTER',
        payload: { showStarredOnly: true },
      });
    });

    expect(result.current.state.filter.showStarredOnly).toBe(true);
    expect(result.current.state.filter.showTodayOnly).toBe(false);
  });

  it('adds and updates sprint', async () => {
    const { result } = renderHook(() => useTaskContext(), { wrapper });
    await vi.waitFor(() => {
      expect(result.current.state.loading).toBe(false);
    });

    const sprint = {
      id: 'sprint-1',
      taskId: null,
      startedAt: new Date().toISOString(),
      endedAt: null,
      plannedMinutes: 25,
      completed: false,
    };

    act(() => {
      result.current.dispatch({ type: 'ADD_SPRINT', payload: sprint });
    });
    expect(result.current.state.sprints).toHaveLength(1);

    act(() => {
      result.current.dispatch({
        type: 'UPDATE_SPRINT',
        payload: { ...sprint, completed: true, endedAt: new Date().toISOString() },
      });
    });
    expect(result.current.state.sprints[0].completed).toBe(true);
  });
});
