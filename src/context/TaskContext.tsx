import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useRef,
  type ReactNode,
  type Dispatch,
} from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Task, TaskStatus, SprintSession } from '../types';
import {
  getAllTasks,
  getAllSprints,
  saveTask,
  deleteTask as dbDeleteTask,
  saveSprint,
  clearCompletedTasks as dbClearCompleted,
} from '../db';

// ---------------------------------------------------------------------------
// Filter state
// ---------------------------------------------------------------------------
export interface FilterState {
  search: string;
  tags: string[];
  showStarredOnly: boolean;
  showTodayOnly: boolean;
  status: TaskStatus | null;
}

const defaultFilter: FilterState = {
  search: '',
  tags: [],
  showStarredOnly: false,
  showTodayOnly: false,
  status: null,
};

// ---------------------------------------------------------------------------
// App state
// ---------------------------------------------------------------------------
export interface TaskState {
  tasks: Task[];
  sprints: SprintSession[];
  filter: FilterState;
  loading: boolean;
}

const initialState: TaskState = {
  tasks: [],
  sprints: [],
  filter: defaultFilter,
  loading: true,
};

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------
type Action =
  | { type: 'SET_TASKS'; payload: Task[] }
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'UPDATE_TASK'; payload: Task }
  | { type: 'DELETE_TASK'; payload: string }
  | { type: 'MOVE_TASK'; payload: { id: string; status: TaskStatus } }
  | { type: 'REORDER_TASKS'; payload: Task[] }
  | { type: 'CLEAR_COMPLETED' }
  | { type: 'SET_FILTER'; payload: Partial<FilterState> }
  | { type: 'SET_SPRINTS'; payload: SprintSession[] }
  | { type: 'ADD_SPRINT'; payload: SprintSession }
  | { type: 'UPDATE_SPRINT'; payload: SprintSession }
  | { type: 'SET_LOADING'; payload: boolean };

function now(): string {
  return new Date().toISOString();
}

function taskReducer(state: TaskState, action: Action): TaskState {
  switch (action.type) {
    case 'SET_TASKS':
      return { ...state, tasks: action.payload, loading: false };

    case 'ADD_TASK':
      return { ...state, tasks: [...state.tasks, action.payload] };

    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.payload.id
            ? { ...action.payload, updatedAt: now() }
            : t,
        ),
      };

    case 'DELETE_TASK':
      return {
        ...state,
        tasks: state.tasks.filter((t) => t.id !== action.payload),
      };

    case 'MOVE_TASK': {
      const { id, status } = action.payload;
      return {
        ...state,
        tasks: state.tasks.map((t) => {
          if (t.id !== id) return t;
          const completedAt =
            status === 'done' ? now() : null;
          return { ...t, status, completedAt, updatedAt: now() };
        }),
      };
    }

    case 'REORDER_TASKS':
      return {
        ...state,
        tasks: state.tasks.map((t) => {
          const updated = action.payload.find((u) => u.id === t.id);
          return updated ? { ...updated, updatedAt: now() } : t;
        }),
      };

    case 'CLEAR_COMPLETED':
      return {
        ...state,
        tasks: state.tasks.filter((t) => t.status !== 'done'),
      };

    case 'SET_FILTER':
      return {
        ...state,
        filter: { ...state.filter, ...action.payload },
      };

    case 'SET_SPRINTS':
      return { ...state, sprints: action.payload };

    case 'ADD_SPRINT':
      return { ...state, sprints: [...state.sprints, action.payload] };

    case 'UPDATE_SPRINT':
      return {
        ...state,
        sprints: state.sprints.map((s) =>
          s.id === action.payload.id ? action.payload : s,
        ),
      };

    case 'SET_LOADING':
      return { ...state, loading: action.payload };

    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------
interface TaskContextValue {
  state: TaskState;
  dispatch: Dispatch<Action>;
}

const TaskContext = createContext<TaskContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
export function TaskProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(taskReducer, initialState);
  const initialized = useRef(false);

  // Load data from IndexedDB on mount
  useEffect(() => {
    async function load() {
      try {
        const [tasks, sprints] = await Promise.all([
          getAllTasks(),
          getAllSprints(),
        ]);
        dispatch({ type: 'SET_TASKS', payload: tasks });
        dispatch({ type: 'SET_SPRINTS', payload: sprints });
      } catch (err) {
        console.error('Failed to load from IndexedDB:', err);
        dispatch({ type: 'SET_LOADING', payload: false });
      } finally {
        initialized.current = true;
      }
    }
    load();
  }, []);

  // Persist tasks to IndexedDB whenever they change
  useEffect(() => {
    if (!initialized.current) return;
    state.tasks.forEach((task) => {
      saveTask(task).catch((err) =>
        console.error('Failed to save task:', err),
      );
    });
  }, [state.tasks]);

  // Persist sprints to IndexedDB whenever they change
  useEffect(() => {
    if (!initialized.current) return;
    state.sprints.forEach((sprint) => {
      saveSprint(sprint).catch((err) =>
        console.error('Failed to save sprint:', err),
      );
    });
  }, [state.sprints]);

  return (
    <TaskContext.Provider value={{ state, dispatch }}>
      {children}
    </TaskContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
// eslint-disable-next-line react-refresh/only-export-components
export function useTaskContext(): TaskContextValue {
  const ctx = useContext(TaskContext);
  if (!ctx) {
    throw new Error('useTaskContext must be used within a TaskProvider');
  }

  const { dispatch } = ctx;

  // Wrap dispatch to handle async DB side-effects for delete / clear
  const wrappedDispatch: Dispatch<Action> = (action) => {
    if (action.type === 'DELETE_TASK') {
      dbDeleteTask(action.payload).catch((err) =>
        console.error('Failed to delete task from DB:', err),
      );
    }
    if (action.type === 'CLEAR_COMPLETED') {
      dbClearCompleted().catch((err) =>
        console.error('Failed to clear completed from DB:', err),
      );
    }
    dispatch(action);
  };

  return { state: ctx.state, dispatch: wrappedDispatch };
}

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------
// eslint-disable-next-line react-refresh/only-export-components
export function createTask(
  title: string,
  overrides?: Partial<Task>,
): Task {
  const timestamp = now();
  return {
    id: uuidv4(),
    title,
    notes: '',
    status: 'backlog',
    priority: 'medium',
    dueAt: null,
    tags: [],
    starred: false,
    estimateMinutes: null,
    completedAt: null,
    createdAt: timestamp,
    updatedAt: timestamp,
    order: Date.now(),
    ...overrides,
  };
}
