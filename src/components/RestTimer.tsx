import React, { useState, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw, X } from 'lucide-react';
import { formatTime } from '../utils/date';
import { getSettings } from '../utils/settings';
import './RestTimer.css';

interface Props {
  isActive: boolean;
  onClose: () => void;
}

export function RestTimer({ isActive, onClose }: Props) {
  const settings = getSettings();
  const [timeLeft, setTimeLeft] = useState(settings.timerDuration);
  const [isRunning, setIsRunning] = useState(true);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    if (!isActive) {
      setTimeLeft(settings.timerDuration);
      setIsRunning(true);
      setIsDone(false);
    }
  }, [isActive, settings.timerDuration]);

  useEffect(() => {
    if (!isRunning || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          setIsRunning(false);
          setIsDone(true);
          if (navigator.vibrate) {
            navigator.vibrate([200, 100, 200]);
          }
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const handleReset = useCallback(() => {
    setTimeLeft(settings.timerDuration);
    setIsRunning(true);
    setIsDone(false);
  }, [settings.timerDuration]);

  const handleToggle = useCallback(() => {
    if (isDone) {
      handleReset();
      return;
    }
    setIsRunning(r => !r);
  }, [isDone, handleReset]);

  if (!isActive) return null;

  return (
    <div className={`rest-pill ${isDone ? 'done' : ''}`}>
      <div className="rest-pill-main">
        <span className="rest-pill-label">{isDone ? 'Rest' : 'Rest'}</span>
        <span className="rest-pill-value">
          {isDone ? 'Timer done' : formatTime(timeLeft)}
        </span>
      </div>

      <div className="rest-pill-actions">
        <button onClick={handleToggle} className="rest-pill-btn">
          {isRunning ? <Pause size={16} /> : <Play size={16} />}
        </button>
        <button onClick={handleReset} className="rest-pill-btn">
          <RotateCcw size={16} />
        </button>
        <button onClick={onClose} className="rest-pill-btn rest-pill-close">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}