import { useState, useEffect, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Task } from '../types';
import { useTaskContext } from '../context/TaskContext';

type TimerPhase = 'idle' | 'running' | 'paused' | 'finished';

export function FocusTimer() {
  const { state, dispatch } = useTaskContext();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [plannedMinutes, setPlannedMinutes] = useState(25);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [phase, setPhase] = useState<TimerPhase>('idle');
  const [, setSessionId] = useState<string | null>(null);
  const intervalRef = useRef<number | null>(null);
  const startTimeRef = useRef<string | null>(null);
  const selectedTaskIdRef = useRef<string | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const plannedMinutesRef = useRef(25);

  const inFlightTasks = state.tasks.filter((t) => t.status === 'in-flight');
  const boundTask = selectedTaskId
    ? state.tasks.find((t) => t.id === selectedTaskId)
    : null;

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Record sprint session to DB
  const recordSprint = useCallback(
    (completed: boolean) => {
      if (sessionIdRef.current && startTimeRef.current) {
        dispatch({
          type: 'UPDATE_SPRINT',
          payload: {
            id: sessionIdRef.current,
            taskId: selectedTaskIdRef.current,
            startedAt: startTimeRef.current,
            endedAt: new Date().toISOString(),
            plannedMinutes: plannedMinutesRef.current,
            completed,
          },
        });
      }
    },
    [dispatch]
  );

  // Timer naturally finished → show post-sprint options
  const onTimerDone = useCallback(() => {
    clearTimer();
    setPhase('finished');
  }, [clearTimer]);

  const onTimerDoneRef = useRef(onTimerDone);
  useEffect(() => {
    onTimerDoneRef.current = onTimerDone;
  }, [onTimerDone]);

  const startTimer = () => {
    const id = uuidv4();
    const now = new Date().toISOString();
    setSessionId(id);
    sessionIdRef.current = id;
    selectedTaskIdRef.current = selectedTaskId;
    plannedMinutesRef.current = plannedMinutes;
    startTimeRef.current = now;
    setSecondsLeft(plannedMinutes * 60);
    setPhase('running');

    dispatch({
      type: 'ADD_SPRINT',
      payload: {
        id,
        taskId: selectedTaskId,
        startedAt: now,
        endedAt: null,
        plannedMinutes,
        completed: false,
      },
    });

    intervalRef.current = window.setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          onTimerDoneRef.current();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };

  const togglePause = () => {
    if (phase === 'running') {
      clearTimer();
      setPhase('paused');
    } else if (phase === 'paused' && secondsLeft > 0) {
      setPhase('running');
      intervalRef.current = window.setInterval(() => {
        setSecondsLeft((s) => {
          if (s <= 1) {
            onTimerDoneRef.current();
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    }
  };

  // Post-sprint: just record the session
  const handleRecord = () => {
    recordSprint(true);
    resetToIdle();
  };

  // Post-sprint: record session AND complete the bound task
  const handleCompleteTask = () => {
    recordSprint(true);
    if (selectedTaskIdRef.current) {
      const task = state.tasks.find((t) => t.id === selectedTaskIdRef.current);
      if (task && task.status !== 'done') {
        dispatch({
          type: 'MOVE_TASK',
          payload: { id: selectedTaskIdRef.current, status: 'done' },
        });
      }
    }
    resetToIdle();
  };

  // Cancel / abort sprint
  const handleCancel = () => {
    clearTimer();
    recordSprint(false);
    resetToIdle();
  };

  const resetToIdle = () => {
    setSessionId(null);
    sessionIdRef.current = null;
    setSecondsLeft(0);
    setPhase('idle');
    startTimeRef.current = null;
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const progress =
    plannedMinutes > 0 ? 1 - secondsLeft / (plannedMinutes * 60) : 0;
  const circumference = 2 * Math.PI * 54;

  return (
    <div className="focus-timer">
      <h3>專注衝刺</h3>

      {phase === 'idle' && (
        <>
          <select
            value={selectedTaskId ?? ''}
            onChange={(e) => setSelectedTaskId(e.target.value || null)}
            className="timer-task-select"
          >
            <option value="">無任務（自由專注）</option>
            {inFlightTasks.map((t: Task) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>

          <div className="timer-duration">
            {[15, 25, 45, 60].map((m) => (
              <button
                key={m}
                className={`btn btn-ghost${plannedMinutes === m ? ' active' : ''}`}
                onClick={() => setPlannedMinutes(m)}
              >
                {m}m
              </button>
            ))}
          </div>
        </>
      )}

      <div className="timer-display">
        <svg viewBox="0 0 120 120" className="timer-ring">
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke="var(--surface-2)"
            strokeWidth="6"
          />
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="6"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress)}
            strokeLinecap="round"
            transform="rotate(-90 60 60)"
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
        </svg>
        <span className="timer-time">
          {phase === 'finished'
            ? '完成!'
            : `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`}
        </span>
      </div>

      <div className="timer-controls">
        {phase === 'idle' && (
          <button className="btn btn-primary" onClick={startTimer}>
            開始專注
          </button>
        )}

        {(phase === 'running' || phase === 'paused') && (
          <>
            <button className="btn btn-secondary" onClick={togglePause}>
              {phase === 'running' ? '暫停' : '繼續'}
            </button>
            <button className="btn btn-danger" onClick={handleCancel}>
              取消
            </button>
          </>
        )}

        {phase === 'finished' && (
          <div className="timer-post-actions">
            <button className="btn btn-primary" onClick={handleRecord}>
              記錄
            </button>
            {boundTask && boundTask.status !== 'done' && (
              <button className="btn btn-secondary" onClick={handleCompleteTask}>
                完成任務
              </button>
            )}
            <button className="btn btn-ghost" onClick={handleCancel}>
              放棄
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
