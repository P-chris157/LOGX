import React, { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import './HomePage.css';

type HomePageProps = {
  onOpenWorkout: () => void;
};

function formatElapsed(seconds: number) {
  if (seconds < 60) return 'Just started';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function pluralize(count: number, singular: string, plural?: string) {
  if (count === 1) return `${count} ${singular}`;
  return `${count} ${plural ?? `${singular}s`}`;
}

export function HomePage({ onOpenWorkout }: HomePageProps) {
  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const activeWorkout = useLiveQuery(async () => {
    const workouts = await db.workouts.toArray();
    const active = workouts.find(w => !w.completedAt) ?? null;
    if (!active) return null;

    const workoutExercises = await db.workoutExercises.where('workoutId').equals(active.id).toArray();
    const workoutExerciseIds = workoutExercises.map(we => we.id);
    const sets = await db.sets.filter(s => workoutExerciseIds.includes(s.workoutExerciseId)).toArray();

    let startedAt = new Date();
    if (sets.length > 0) {
      const earliest = sets.map(s => s.completedAt).filter(Boolean).sort()[0];
      if (earliest) startedAt = new Date(earliest);
    }

    return {
      ...active,
      exerciseCount: workoutExercises.length,
      elapsedSeconds: Math.max(0, Math.floor((Date.now() - startedAt.getTime()) / 1000))
    };
  }, []);

  const weeklyStats = useLiveQuery(async () => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - 6);
    const startStr = start.toISOString().slice(0, 10);

    const workouts = await db.workouts
      .filter(w => w.date >= startStr && !!w.completedAt)
      .toArray();

    const totalMinutes = workouts.reduce((sum, w) => sum + (w.duration ?? 0), 0);

    return {
      workouts: workouts.length,
      minutes: totalMinutes,
    };
  }, []);

  const recentWorkouts = useLiveQuery(async () => {
    const workouts = await db.workouts.orderBy('date').reverse().toArray();
    return workouts.filter(w => !!w.completedAt).slice(0, 3);
  }, []);

  const streak = useLiveQuery(async () => {
    const workouts = await db.workouts.orderBy('date').reverse().toArray();
    const completedDates = [...new Set(workouts.filter(w => !!w.completedAt).map(w => w.date))].sort().reverse();

    if (completedDates.length === 0) return 0;

    let count = 0;
    let cursor = new Date();
    cursor.setHours(0, 0, 0, 0);

    for (;;) {
      const iso = cursor.toISOString().slice(0, 10);

      if (completedDates.includes(iso)) {
        count++;
        cursor.setDate(cursor.getDate() - 1);
        continue;
      }

      if (count === 0) {
        cursor.setDate(cursor.getDate() - 1);
        const yesterday = cursor.toISOString().slice(0, 10);
        if (completedDates.includes(yesterday)) {
          count++;
          cursor.setDate(cursor.getDate() - 1);
          continue;
        }
      }

      break;
    }

    return count;
  }, []);

  const activeMeta = useMemo(() => {
    if (!activeWorkout) return null;

    const exerciseText = pluralize(activeWorkout.exerciseCount, 'exercise');
    const timeText = formatElapsed(activeWorkout.elapsedSeconds);

    return `${exerciseText} • ${timeText}`;
  }, [activeWorkout]);

  return (
    <div className="home-page">
      <header className="home-header">
        <h1 className="home-title">LOGX</h1>
        <p className="home-date">{today}</p>
      </header>

      <section className="hero-card">
        <div className="hero-badge">
          {activeWorkout ? 'Active Session' : 'Ready to Train'}
        </div>

        <h2 className="hero-title">
          {activeWorkout ? activeWorkout.name : 'Start your next workout'}
        </h2>

        <p className="hero-subtitle">
          {activeWorkout
            ? 'Jump back in and keep logging where you left off.'
            : 'Log sets fast, track progress, and stay consistent.'}
        </p>

        {activeMeta && <p className="hero-meta">{activeMeta}</p>}

        <button className="hero-button" onClick={onOpenWorkout}>
          {activeWorkout ? 'Continue Workout' : 'Start Workout'}
        </button>
      </section>

      <section className="stats-section">
        <h3 className="section-title">This Week</h3>
        <div className="stats-grid two-up">
          <div className="stat-card">
            <div className="stat-value">{weeklyStats?.workouts ?? 0}</div>
            <div className="stat-label">Workouts</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{weeklyStats?.minutes ?? 0}</div>
            <div className="stat-label">Minutes</div>
          </div>
        </div>
      </section>

      <section className="stats-section">
        <h3 className="section-title">Consistency</h3>
        <div className="stats-grid one-up">
          <div className="stat-card streak-card">
            <div className="stat-value">{streak ?? 0}</div>
            <div className="stat-label">Day Streak</div>
          </div>
        </div>
      </section>

      <section className="recent-section">
        <div className="section-row">
          <h3 className="section-title">Recent Workouts</h3>
        </div>

        {recentWorkouts && recentWorkouts.length > 0 ? (
          recentWorkouts.map(workout => (
            <div key={workout.id} className="recent-workout-card">
              <div>
                <p className="recent-workout-title">{workout.name}</p>
                <p className="recent-workout-date">
                  {workout.date}
                  {workout.duration ? ` • ${workout.duration}m` : ''}
                </p>
              </div>
              <span className="recent-workout-badge">Done</span>
            </div>
          ))
        ) : (
          <div className="recent-empty">
            <div className="recent-empty-icon">⌁</div>
            <p className="recent-empty-title">No workouts yet</p>
            <p className="recent-empty-subtitle">
              Start your first workout and your recent sessions will show up here.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}