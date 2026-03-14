import { useState, useEffect, useRef, useCallback } from 'react';
import { useTaskContext, createTask } from '../context/TaskContext';

interface CommandPaletteProps {
  onClose: () => void;
  onNewTask: () => void;
}

interface Command {
  id: string;
  label: string;
  shortcut?: string;
  action: () => void;
}

export function CommandPalette({ onClose, onNewTask }: CommandPaletteProps) {
  const { dispatch } = useTaskContext();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands: Command[] = [
    {
      id: 'new-task',
      label: '新任務',
      shortcut: 'N',
      action: () => { onClose(); onNewTask(); },
    },
    {
      id: 'quick-add',
      label: '快速新增...',
      action: () => {
        if (query.startsWith('>')) {
          const title = query.slice(1).trim();
          if (title) {
            dispatch({ type: 'ADD_TASK', payload: createTask(title) });
          }
        }
        onClose();
      },
    },
    {
      id: 'filter-today',
      label: '只看今天',
      shortcut: 'T',
      action: () => {
        dispatch({
          type: 'SET_FILTER',
          payload: { showTodayOnly: true },
        });
        onClose();
      },
    },
    {
      id: 'filter-starred',
      label: '只看星標',
      shortcut: 'S',
      action: () => {
        dispatch({
          type: 'SET_FILTER',
          payload: { showStarredOnly: true },
        });
        onClose();
      },
    },
    {
      id: 'filter-clear',
      label: '清除所有篩選',
      shortcut: 'X',
      action: () => {
        dispatch({
          type: 'SET_FILTER',
          payload: {
            search: '',
            tags: [],
            showStarredOnly: false,
            showTodayOnly: false,
            status: null,
          },
        });
        onClose();
      },
    },
    {
      id: 'clear-done',
      label: '清空已完成',
      action: () => {
        dispatch({ type: 'CLEAR_COMPLETED' });
        onClose();
      },
    },
  ];

  const filtered = query.startsWith('>')
    ? commands.filter((c) => c.id === 'quick-add')
    : commands.filter((c) =>
        c.label.toLowerCase().includes(query.toLowerCase())
      );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          filtered[selectedIndex].action();
        }
      }
    },
    [filtered, selectedIndex, onClose]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleQueryChange = (newQuery: string) => {
    setQuery(newQuery);
    setSelectedIndex(0);
  };

  return (
    <div className="modal-overlay command-overlay" onClick={onClose}>
      <div className="command-palette" onClick={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          type="text"
          className="command-input"
          placeholder="輸入指令...（> 快速新增）"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
        />
        <div className="command-list">
          {filtered.map((cmd, i) => (
            <button
              key={cmd.id}
              className={`command-item${i === selectedIndex ? ' selected' : ''}`}
              onClick={cmd.action}
              onMouseEnter={() => setSelectedIndex(i)}
            >
              <span>{cmd.label}</span>
              {cmd.shortcut && (
                <kbd className="command-shortcut">{cmd.shortcut}</kbd>
              )}
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="command-empty">沒有匹配的指令</div>
          )}
        </div>
      </div>
    </div>
  );
}
