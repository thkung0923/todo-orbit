import { useState, useEffect, useCallback } from 'react';
import type { Task } from './types';
import { TaskProvider } from './context/TaskContext';
import { Hero } from './components/Hero';
import { Board } from './components/Board';
import { FocusTimer } from './components/FocusTimer';
import { Heatmap } from './components/Heatmap';
import { Momentum } from './components/Momentum';
import { TaskForm } from './components/TaskForm';
import { CommandPalette } from './components/CommandPalette';

function AppContent() {
  const [editingTask, setEditingTask] = useState<Task | null | 'new'>(null);
  const [showPalette, setShowPalette] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleNewTask = useCallback(() => setEditingTask('new'), []);
  const handleEditTask = useCallback((task: Task) => setEditingTask(task), []);
  const handleCloseForm = useCallback(() => setEditingTask(null), []);
  const handleClosePalette = useCallback(() => setShowPalette(false), []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowPalette((v) => !v);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="app">
      <Hero onNewTask={handleNewTask} />

      <div className="main-content">
        <Board onEditTask={handleEditTask} />

        <aside className={`sidebar${sidebarOpen ? ' sidebar-open' : ''}`}>
          <button
            className="sidebar-toggle"
            onClick={() => setSidebarOpen((v) => !v)}
          >
            {sidebarOpen ? '✕' : '☰'}
          </button>
          <FocusTimer />
          <Heatmap />
          <Momentum />
        </aside>
      </div>

      {editingTask !== null && (
        <TaskForm
          task={editingTask === 'new' ? null : editingTask}
          onClose={handleCloseForm}
        />
      )}

      {showPalette && (
        <CommandPalette onClose={handleClosePalette} onNewTask={handleNewTask} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <TaskProvider>
      <AppContent />
    </TaskProvider>
  );
}
