import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { TrendingUp, Award, Calendar, Dumbbell } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { db } from '../db/database';
import { getSettings } from '../utils/settings';
import { formatDateShort, getStartOfWeek } from '../utils/date';
import './ProgressPage.css';

export function ProgressPage() {
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const settings = getSettings();

  const exercises = useLiveQuery(() => db.exercises.toArray(), []);
  const workouts = useLiveQuery(() => db.workouts.toArray(), []);
  const allSets = useLiveQuery(() => db.sets.toArray(), []);
  const workoutExercises = useLiveQuery(() => db.workoutExercises.toArray(), []);

  const weeklyStats = useMemo(() => {
    if (!workouts || !allSets || !workoutExercises) {
      return { count: 0, totalSets: 0 };
    }

    const startOfWeek = getStartOfWeek();
    const weekWorkouts = workouts.filter(
      w => w.completedAt && new Date(w.date) >= startOfWeek
    );

    const weekWorkoutIds = weekWorkouts.map(w => w.id);
    const weekWorkoutExerciseIds = workoutExercises
      .filter(we => weekWorkoutIds.includes(we.workoutId))
      .map(we => we.id);

    const weekSets = allSets.filter(s => weekWorkoutExerciseIds.includes(s.workoutExerciseId));

    return {
      count: weekWorkouts.length,
      totalSets: weekSets.length,
    };
  }, [workouts, allSets, workoutExercises]);

  const exercisesWithData = useMemo(() => {
    if (!exercises || !workoutExercises || !allSets) return [];

    return exercises
      .filter(e => {
        const weIds = workoutExercises.filter(we => we.exerciseId === e.id).map(we => we.id);
        return allSets.some(s => weIds.includes(s.workoutExerciseId));
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [exercises, workoutExercises, allSets]);

  const exerciseProgress = useMemo(() => {
    if (!selectedExercise || !workouts || !workoutExercises || !allSets) return null;

    const relatedWorkoutExercises = workoutExercises.filter(w => w.exerciseId === selectedExercise);
    const dataPoints: { date: string; maxWeight: number; maxReps: number; volume: number }[] = [];

    for (const workout of [...workouts].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())) {
      const workoutWe = relatedWorkoutExercises.filter(w => w.workoutId === workout.id);
      if (workoutWe.length === 0) continue;

      const sets = allSets.filter(s => workoutWe.some(w => w.id === s.workoutExerciseId));
      if (sets.length === 0) continue;

      const maxWeight = Math.max(...sets.map(s => s.weight));
      const maxReps = Math.max(...sets.map(s => s.reps));
      const volume = sets.reduce((sum, s) => sum + s.weight * s.reps, 0);

      dataPoints.push({
        date: formatDateShort(workout.date),
        maxWeight,
        maxReps,
        volume
      });
    }

    const allMaxWeight = dataPoints.length > 0 ? Math.max(...dataPoints.map(d => d.maxWeight)) : 0;
    const allMaxReps = dataPoints.length > 0 ? Math.max(...dataPoints.map(d => d.maxReps)) : 0;

    return {
      dataPoints,
      maxWeight: allMaxWeight,
      maxReps: allMaxReps
    };
  }, [selectedExercise, workouts, workoutExercises, allSets]);

  const selectedExerciseData = exercises?.find(e => e.id === selectedExercise);

  return (
    <div className="page progress-page">
      <div className="page-header">
        <h1>Progress</h1>
      </div>

      <div className="progress-summary-grid">
        <div className="progress-summary-card">
          <div className="summary-icon-wrap">
            <Calendar size={22} />
          </div>
          <div className="summary-value">{weeklyStats.count}</div>
          <div className="summary-label">Workouts This Week</div>
        </div>

        <div className="progress-summary-card">
          <div className="summary-icon-wrap">
            <Dumbbell size={22} />
          </div>
          <div className="summary-value">{weeklyStats.totalSets}</div>
          <div className="summary-label">Sets This Week</div>
        </div>
      </div>

      <div className="section progress-section-card">
        <div className="section-head">
          <h2>Exercise Progress</h2>
          <p>Pick an exercise to view progress and PRs</p>
        </div>

        <select
          value={selectedExercise || ''}
          onChange={e => setSelectedExercise(e.target.value || null)}
          className="exercise-select"
        >
          <option value="">Select an exercise...</option>
          {exercisesWithData.map(exercise => (
            <option key={exercise.id} value={exercise.id}>
              {exercise.name}
            </option>
          ))}
        </select>
      </div>

      {selectedExercise && exerciseProgress && (
        <div className="section progress-section-card">
          <div className="section-head">
            <h2>{selectedExerciseData?.name}</h2>
            <p>Your best recent numbers</p>
          </div>

          <div className="prs">
            <div className="pr-card">
              <Award size={20} />
              <span className="pr-value">{exerciseProgress.maxWeight} {settings.units}</span>
              <span className="pr-label">Max Weight</span>
            </div>

            <div className="pr-card">
              <TrendingUp size={20} />
              <span className="pr-value">{exerciseProgress.maxReps}</span>
              <span className="pr-label">Max Reps</span>
            </div>
          </div>

          {exerciseProgress.dataPoints.length > 1 ? (
            <div className="chart-container">
              <div className="chart-title">Weight Trend</div>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={exerciseProgress.dataPoints}>
                  <XAxis
                    dataKey="date"
                    stroke="rgba(215,223,255,0.5)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="rgba(215,223,255,0.5)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(18, 28, 58, 0.98)',
                      border: '1px solid rgba(124, 144, 255, 0.14)',
                      borderRadius: '14px',
                      color: '#f5f7ff'
                    }}
                    labelStyle={{ color: '#f5f7ff' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="maxWeight"
                    stroke="#5b88ff"
                    strokeWidth={3}
                    dot={{ fill: '#7aa2ff', strokeWidth: 0, r: 4 }}
                    activeDot={{ r: 6 }}
                    name={`Weight (${settings.units})`}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="empty-inline-state">
              <TrendingUp size={36} />
              <p>Need at least 2 workouts to show a progress chart</p>
              <span>Log this exercise again and your trend will show up here.</span>
            </div>
          )}
        </div>
      )}

      {!selectedExercise && (
        <div className="progress-empty-state">
          <TrendingUp size={48} />
          <p>Select an exercise to view progress</p>
          <span>See weight trends, best reps, and overall consistency.</span>
        </div>
      )}
    </div>
  );
}