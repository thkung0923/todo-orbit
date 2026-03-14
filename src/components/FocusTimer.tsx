import { useState, useEffect, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Task } from '../types';
import { useTaskContext } from '../context/TaskContext';

export function FocusTimer() {
  const { state, dispatch } = useTaskContext();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [plannedMinutes, setPlannedMinutes] = useState(25);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const intervalRef = useRef<number | null>(null);
  const startTimeRef = useRef<string | null>(null);

  const inFlightTasks = state.tasks.filter((t) => t.status === 'in-flight');

  const stopTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
  }, []);

  const completeSession = useCallback(
    (completed: boolean) => {
      stopTimer();
      if (sessionId && startTimeRef.current) {
        dispatch({
          type: 'UPDATE_SPRINT',
          payload: {
            id: sessionId,
            taskId: selectedTaskId,
            startedAt: startTimeRef.current,
            endedAt: new Date().toISOString(),
            plannedMinutes,
            completed,
          },
        });
      }
      setSessionId(null);
      setSecondsLeft(0);
      startTimeRef.current = null;
    },
    [sessionId, selectedTaskId, plannedMinutes, dispatch, stopTimer]
  );

  const completeSessionRef = useRef(completeSession);
  useEffect(() => {
    completeSessionRef.current = completeSession;
  }, [completeSession]);

  const startTimer = () => {
    const id = uuidv4();
    const now = new Date().toISOString();
    setSessionId(id);
    startTimeRef.current = now;
    setSecondsLeft(plannedMinutes * 60);
    setIsRunning(true);

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
          completeSessionRef.current(true);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };

  const togglePause = () => {
    if (isRunning) {
      stopTimer();
    } else if (secondsLeft > 0) {
      setIsRunning(true);
      intervalRef.current = window.setInterval(() => {
        setSecondsLeft((s) => {
          if (s <= 1) {
            completeSessionRef.current(true);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    }
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

      {!sessionId && (
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
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </span>
      </div>

      <div className="timer-controls">
        {!sessionId ? (
          <button className="btn btn-primary" onClick={startTimer}>
            開始專注
          </button>
        ) : (
          <>
            <button className="btn btn-secondary" onClick={togglePause}>
              {isRunning ? '暫停' : '繼續'}
            </button>
            <button
              className="btn btn-danger"
              onClick={() => completeSession(false)}
            >
              停止
            </button>
          </>
        )}
      </div>
    </div>
  );
}
