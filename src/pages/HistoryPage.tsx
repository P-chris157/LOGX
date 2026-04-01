import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { ChevronRight, Calendar, Trash2, ChevronLeft, Clock3, Dumbbell, Copy, Check } from 'lucide-react';
import { db } from '../db/database';
import { formatDate } from '../utils/date';
import { getSettings } from '../utils/settings';
import { haptic } from '../utils/haptics';
import './HistoryPage.css';

export function HistoryPage() {
  const [selectedWorkout, setSelectedWorkout] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const settings = getSettings();

  const workouts = useLiveQuery(
    () => db.workouts.orderBy('date').reverse().toArray(),
    []
  );

  const exercises = useLiveQuery(() => db.exercises.toArray(), []);

  const selectedData = useLiveQuery(async () => {
    if (!selectedWorkout || !exercises) return null;

    const workout = await db.workouts.get(selectedWorkout);
    if (!workout) return null;

    const workoutExercises = await db.workoutExercises
      .where('workoutId')
      .equals(selectedWorkout)
      .sortBy('order');

    const exerciseData = await Promise.all(
      workoutExercises.map(async (we) => {
        const exercise = exercises.find(e => e.id === we.exerciseId);
        const sets = await db.sets.where('workoutExerciseId').equals(we.id).sortBy('setNumber');
        const volume = sets.reduce((sum, set) => sum + (set.weight * set.reps), 0);
        return { exercise, sets, volume };
      })
    );

    const totalSets = exerciseData.reduce((sum, item) => sum + item.sets.length, 0);
    const totalVolume = exerciseData.reduce((sum, item) => sum + item.volume, 0);

    return { workout, exerciseData, totalSets, totalVolume };
  }, [selectedWorkout, exercises]);

  const completedWorkouts = useMemo(() => {
    return workouts?.filter(w => !!w.completedAt) ?? [];
  }, [workouts]);

  const handleDelete = async (workoutId: string) => {
    if (!confirm('Delete this workout?')) return;

    const workoutExercises = await db.workoutExercises.where('workoutId').equals(workoutId).toArray();
    for (const we of workoutExercises) {
      await db.sets.where('workoutExerciseId').equals(we.id).delete();
    }
    await db.workoutExercises.where('workoutId').equals(workoutId).delete();
    await db.workouts.delete(workoutId);

    if (selectedWorkout === workoutId) {
      setSelectedWorkout(null);
    }
  };

  const handleCopyWorkout = () => {
    if (!selectedData) return;
    const { workout, exerciseData, totalSets, totalVolume } = selectedData;

    let text = `Workout: ${workout.name}\n`;
    text += `Date: ${formatDate(workout.date)}\n`;
    if (workout.duration) text += `Duration: ${workout.duration} minutes\n`;
    text += `\n`;

    exerciseData.forEach(({ exercise, sets, volume }) => {
      if (!exercise) return;
      text += `${exercise.name}\n`;
      sets.forEach((set, i) => {
        text += `  Set ${i + 1}: ${set.weight}${settings.units} × ${set.reps}\n`;
      });
      text += `  Volume: ${volume}${settings.units}\n\n`;
    });

    text += `Total Sets: ${totalSets}\n`;
    text += `Total Volume: ${totalVolume}${settings.units}\n`;

    navigator.clipboard.writeText(text).then(() => {
      haptic('success');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (selectedWorkout && selectedData) {
    const { workout, exerciseData, totalSets, totalVolume } = selectedData;

    return (
      <div className="page history-page">
        <div className="page-header detail-header">
          <button className="back-btn" onClick={() => setSelectedWorkout(null)}>
            <ChevronLeft size={22} />
          </button>

          <div className="detail-header-main">
            <h1>{workout.name}</h1>
            <span className="workout-date">{formatDate(workout.date)}</span>
          </div>

          <button className="delete-btn" onClick={() => handleDelete(selectedWorkout)}>
            <Trash2 size={18} />
          </button>
        </div>

        <div className="history-summary-grid">
          <div className="history-summary-card">
            <div className="summary-icon-wrap">
              <Dumbbell size={18} />
            </div>
            <div className="summary-value">{totalSets}</div>
            <div className="summary-label">Total Sets</div>
          </div>

          <div className="history-summary-card">
            <div className="summary-icon-wrap">
              <Clock3 size={18} />
            </div>
            <div className="summary-value">{workout.duration ?? 0}m</div>
            <div className="summary-label">Duration</div>
          </div>
        </div>

        <div className="history-summary-wide">
          <span className="history-summary-wide-label">Total Volume</span>
          <span className="history-summary-wide-value">
            {totalVolume} {settings.units}
          </span>
        </div>

        <button className="copy-workout-btn" onClick={handleCopyWorkout}>
          {copied ? <Check size={18} /> : <Copy size={18} />}
          <span>{copied ? 'Copied!' : 'Copy workout to paste into ChatGPT'}</span>
        </button>

        <div className="workout-detail">
          {exerciseData.map(({ exercise, sets, volume }, idx) =>
            exercise ? (
              <div key={idx} className="detail-exercise">
                <div className="detail-exercise-head">
                  <div>
                    <h3>{exercise.name}</h3>
                    <span className="detail-exercise-meta">
                      {sets.length} sets • {volume} {settings.units}
                    </span>
                  </div>
                </div>

                <div className="detail-sets">
                  {sets.map((set, i) => (
                    <div key={set.id} className="detail-set">
                      <span className="set-num">{i + 1}</span>
                      <div className="set-main">
                        <span className="set-info">
                          {set.weight} {settings.units} × {set.reps}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="page history-page">
      <div className="page-header">
        <h1>History</h1>
      </div>

      {completedWorkouts.length === 0 ? (
        <div className="empty-state">
          <Calendar size={48} />
          <p>No workouts yet</p>
          <span>Start your first workout to see it here</span>
        </div>
      ) : (
        <div className="workout-list">
          {completedWorkouts.map(workout => (
            <button
              key={workout.id}
              className="workout-item"
              onClick={() => setSelectedWorkout(workout.id)}
            >
              <div className="workout-info">
                <span className="workout-name">{workout.name}</span>
                <span className="workout-date">
                  {formatDate(workout.date)}
                  {workout.duration ? ` • ${workout.duration}m` : ''}
                </span>
              </div>
              <ChevronRight size={20} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}