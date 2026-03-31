import React, { useState, useEffect, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Plus,
  Check,
  Copy,
  Trash2,
  ChevronRight,
  Play,
  FileText,
  Pencil,
  X,
  Save,
  ArrowUp,
  ArrowDown,
  RefreshCcw
} from 'lucide-react';
import { db } from '../db/database';
import type { Workout, WorkoutExercise, WorkoutSet, Exercise, Template, TemplateExercise } from '../types';
import { v4 as uuid } from 'uuid';
import { getToday } from '../utils/date';
import { getSettings } from '../utils/settings';
import { haptic } from '../utils/haptics';
import { ExercisePicker } from '../components/ExercisePicker';
import { RestTimer } from '../components/RestTimer';
import './WorkoutPage.css';

interface ExerciseWithSets {
  workoutExercise: WorkoutExercise;
  exercise: Exercise;
  sets: WorkoutSet[];
  previousSets: WorkoutSet[];
}

type StartMode = 'empty' | 'template';

interface StartWorkoutState {
  open: boolean;
  mode: StartMode;
  workoutName: string;
  selectedTemplateId: string | null;
}

interface TemplateEditorState {
  open: boolean;
  templateId: string | null;
  name: string;
  description: string;
  exercises: TemplateExercise[];
}

interface FinishSummaryState {
  workoutName: string;
  totalSets: number;
  durationMinutes: number;
  exerciseCount: number;
  templateExercises: TemplateExercise[];
}

export function WorkoutPage() {
  const [activeWorkout, setActiveWorkout] = useState<Workout | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [showTimer, setShowTimer] = useState(false);
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);
  const [workoutStartedAt, setWorkoutStartedAt] = useState<Date | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [finishSummary, setFinishSummary] = useState<FinishSummaryState | null>(null);
  const [prSetIds, setPrSetIds] = useState<string[]>([]);
  const [lastAddedSetId, setLastAddedSetId] = useState<string | null>(null);

  const [startWorkoutState, setStartWorkoutState] = useState<StartWorkoutState>({
    open: false,
    mode: 'empty',
    workoutName: 'Workout',
    selectedTemplateId: null
  });

  const [templateEditor, setTemplateEditor] = useState<TemplateEditorState>({
    open: false,
    templateId: null,
    name: '',
    description: '',
    exercises: []
  });

  const [showTemplateExercisePicker, setShowTemplateExercisePicker] = useState(false);

  const settings = getSettings();

  const templates = useLiveQuery(() => db.templates.toArray(), []);
  const exercises = useLiveQuery(() => db.exercises.toArray(), []);

  useEffect(() => {
    const loadWorkout = async () => {
      const active = await db.workouts.toArray().then(ws => ws.find(w => !w.completedAt) ?? null);
      if (!active) return;

      setActiveWorkout(active);

      const workoutExercises = await db.workoutExercises.where('workoutId').equals(active.id).toArray();
      const workoutExerciseIds = workoutExercises.map(we => we.id);
      const sets = await db.sets.filter(s => workoutExerciseIds.includes(s.workoutExerciseId)).toArray();

      if (sets.length > 0) {
        const earliest = sets.map(s => s.completedAt).filter(Boolean).sort()[0];
        setWorkoutStartedAt(earliest ? new Date(earliest) : new Date());
      } else {
        setWorkoutStartedAt(new Date());
      }
    };

    loadWorkout();
  }, []);

  useEffect(() => {
    if (!workoutStartedAt || !activeWorkout) {
      setElapsedSeconds(0);
      return;
    }

    const update = () => {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - workoutStartedAt.getTime()) / 1000)));
    };

    update();
    const interval = window.setInterval(update, 1000);
    return () => window.clearInterval(interval);
  }, [workoutStartedAt, activeWorkout]);

  const formattedElapsed = useMemo(() => {
    const hours = Math.floor(elapsedSeconds / 3600);
    const minutes = Math.floor((elapsedSeconds % 3600) / 60);
    const seconds = elapsedSeconds % 60;

    if (hours > 0) {
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }, [elapsedSeconds]);

  const workoutExercises = useLiveQuery(async () => {
    if (!activeWorkout || !exercises) return [];

    const wExercises = await db.workoutExercises
      .where('workoutId')
      .equals(activeWorkout.id)
      .sortBy('order');

    const result: ExerciseWithSets[] = [];

    for (const we of wExercises) {
      const exercise = exercises.find(e => e.id === we.exerciseId);
      if (!exercise) continue;

      const sets = await db.sets.where('workoutExerciseId').equals(we.id).sortBy('setNumber');
      const previousSets = await getPreviousSets(exercise.id, activeWorkout.id);

      result.push({ workoutExercise: we, exercise, sets, previousSets });
    }

    return result;
  }, [activeWorkout, exercises, lastAddedSetId]);

  const getPreviousSets = async (exerciseId: string, currentWorkoutId: string): Promise<WorkoutSet[]> => {
    const allWorkouts = await db.workouts
      .orderBy('date')
      .reverse()
      .filter(w => w.id !== currentWorkoutId && !!w.completedAt)
      .toArray();

    for (const workout of allWorkouts) {
      const we = await db.workoutExercises
        .where(['workoutId', 'exerciseId'])
        .equals([workout.id, exerciseId])
        .first();

      if (we) {
        return db.sets.where('workoutExerciseId').equals(we.id).sortBy('setNumber');
      }
    }

    return [];
  };

  const estimate1RM = (weight: number, reps: number) => {
    if (weight <= 0 || reps <= 0) return 0;
    return weight * (1 + reps / 30);
  };

  const isPRSet = async (exerciseId: string, reps: number, weight: number, currentWorkoutId: string) => {
    const allWorkoutExercises = await db.workoutExercises.where('exerciseId').equals(exerciseId).toArray();

    const relatedWorkoutExerciseIds = allWorkoutExercises
      .filter(we => we.workoutId !== currentWorkoutId)
      .map(we => we.id);

    if (relatedWorkoutExerciseIds.length === 0) return true;

    const previousSets = await db.sets
      .filter(s => relatedWorkoutExerciseIds.includes(s.workoutExerciseId))
      .toArray();

    if (previousSets.length === 0) return true;

    const current1RM = estimate1RM(weight, reps);
    const bestPrevious1RM = Math.max(...previousSets.map(s => estimate1RM(s.weight, s.reps)));

    return current1RM > bestPrevious1RM;
  };

  const buildWorkoutName = async (workout: Workout, workoutExerciseRows: WorkoutExercise[]) => {
    if (workout.templateId) return workout.name;
    if (workout.name !== 'Workout') return workout.name;
    if (!exercises || workoutExerciseRows.length === 0) return workout.name;

    const ordered = [...workoutExerciseRows].sort((a, b) => a.order - b.order);
    const firstExercise = exercises.find(e => e.id === ordered[0].exerciseId);

    if (!firstExercise) return workout.name;
    if (ordered.length === 1) return firstExercise.name;
    return `${firstExercise.name} + ${ordered.length - 1} more`;
  };

  const buildTemplateExercisesFromWorkout = async (workoutId: string): Promise<TemplateExercise[]> => {
    const rows = await db.workoutExercises.where('workoutId').equals(workoutId).sortBy('order');

    const result: TemplateExercise[] = [];
    for (const row of rows) {
      const rowSets = await db.sets.where('workoutExerciseId').equals(row.id).sortBy('setNumber');
      const firstSet = rowSets[0];

      result.push({
        exerciseId: row.exerciseId,
        sets: Math.max(1, rowSets.length || 3),
        reps: firstSet?.reps || 10
      });
    }

    return result;
  };

  const startWorkout = async (name: string = 'Workout', templateId?: string) => {
    const workout: Workout = {
      id: uuid(),
      date: getToday(),
      name: name.trim() || 'Workout',
      templateId
    };

    await db.workouts.add(workout);
    setActiveWorkout(workout);
    setWorkoutStartedAt(new Date());
    setElapsedSeconds(0);
    setPrSetIds([]);
    setStartWorkoutState({
      open: false,
      mode: 'empty',
      workoutName: 'Workout',
      selectedTemplateId: null
    });

    if (templateId) {
      const template = templates?.find(t => t.id === templateId);
      if (template) {
        for (let i = 0; i < template.exercises.length; i++) {
          const te = template.exercises[i];
          const we: WorkoutExercise = {
            id: uuid(),
            workoutId: workout.id,
            exerciseId: te.exerciseId,
            order: i
          };
          await db.workoutExercises.add(we);
        }
      }
    }
  };

  const handleConfirmStartWorkout = async () => {
    if (startWorkoutState.mode === 'empty') {
      await startWorkout(startWorkoutState.workoutName || 'Workout');
      return;
    }

    const template = templates?.find(t => t.id === startWorkoutState.selectedTemplateId);
    if (!template) return;

    await startWorkout(
      startWorkoutState.workoutName.trim() || template.name,
      template.id
    );
  };

  const openStartModal = (mode: StartMode) => {
    if (mode === 'empty') {
      setStartWorkoutState({
        open: true,
        mode: 'empty',
        workoutName: 'Workout',
        selectedTemplateId: null
      });
      return;
    }

    const firstTemplate = templates?.[0] ?? null;
    setStartWorkoutState({
      open: true,
      mode: 'template',
      workoutName: firstTemplate?.name ?? 'Workout',
      selectedTemplateId: firstTemplate?.id ?? null
    });
  };

  const openTemplateEditor = (template?: Template) => {
    if (!template) {
      setTemplateEditor({
        open: true,
        templateId: null,
        name: 'New Template',
        description: '',
        exercises: []
      });
      return;
    }

    setTemplateEditor({
      open: true,
      templateId: template.id,
      name: template.name,
      description: template.description || '',
      exercises: [...template.exercises]
    });
  };

  const duplicateTemplate = async () => {
    if (!templateEditor.name.trim()) return;

    const copy: Template = {
      id: uuid(),
      name: `${templateEditor.name.trim()} Copy`,
      description: templateEditor.description.trim(),
      exercises: [...templateEditor.exercises]
    };

    await db.templates.add(copy);

    setTemplateEditor({
      open: true,
      templateId: copy.id,
      name: copy.name,
      description: copy.description || '',
      exercises: [...copy.exercises]
    });
  };

  const addExerciseToTemplate = (exercise: Exercise) => {
    const next: TemplateExercise = {
      exerciseId: exercise.id,
      sets: 3,
      reps: 10
    };

    setTemplateEditor(prev => ({
      ...prev,
      exercises: [...prev.exercises, next]
    }));
    setShowTemplateExercisePicker(false);
  };

  const updateTemplateExercise = (index: number, patch: Partial<TemplateExercise>) => {
    setTemplateEditor(prev => ({
      ...prev,
      exercises: prev.exercises.map((item, i) => i === index ? { ...item, ...patch } : item)
    }));
  };

  const moveTemplateExercise = (index: number, direction: 'up' | 'down') => {
    setTemplateEditor(prev => {
      const next = [...prev.exercises];
      const target = direction === 'up' ? index - 1 : index + 1;
      if (target < 0 || target >= next.length) return prev;

      [next[index], next[target]] = [next[target], next[index]];
      return { ...prev, exercises: next };
    });
  };

  const removeTemplateExercise = (index: number) => {
    setTemplateEditor(prev => ({
      ...prev,
      exercises: prev.exercises.filter((_, i) => i !== index)
    }));
  };

  const saveTemplate = async () => {
    const payload: Template = {
      id: templateEditor.templateId || uuid(),
      name: templateEditor.name.trim() || 'New Template',
      description: templateEditor.description.trim(),
      exercises: templateEditor.exercises
    };

    if (templateEditor.templateId) {
      await db.templates.put(payload);
    } else {
      await db.templates.add(payload);
    }

    setTemplateEditor({
      open: false,
      templateId: null,
      name: '',
      description: '',
      exercises: []
    });
  };

  const deleteTemplate = async () => {
    if (!templateEditor.templateId) {
      setTemplateEditor({
        open: false,
        templateId: null,
        name: '',
        description: '',
        exercises: []
      });
      return;
    }

    await db.templates.delete(templateEditor.templateId);
    setTemplateEditor({
      open: false,
      templateId: null,
      name: '',
      description: '',
      exercises: []
    });
  };

  const openSaveCurrentAsTemplate = async () => {
    if (!activeWorkout) return;

    const templateExercises = await buildTemplateExercisesFromWorkout(activeWorkout.id);

    setTemplateEditor({
      open: true,
      templateId: null,
      name: `${activeWorkout.name || 'Workout'} Template`,
      description: '',
      exercises: templateExercises
    });
  };

  const updateCurrentTemplateFromWorkout = async () => {
    if (!activeWorkout?.templateId) return;

    const currentTemplate = templates?.find(t => t.id === activeWorkout.templateId);
    if (!currentTemplate) return;

    const templateExercises = await buildTemplateExercisesFromWorkout(activeWorkout.id);

    await db.templates.put({
      ...currentTemplate,
      exercises: templateExercises
    });
  };

  const handleSaveWorkoutAsTemplate = () => {
    if (!finishSummary) return;

    setTemplateEditor({
      open: true,
      templateId: null,
      name: `${finishSummary.workoutName} Template`,
      description: '',
      exercises: finishSummary.templateExercises
    });
    setFinishSummary(null);
  };

  const finishWorkout = async () => {
    if (!activeWorkout) return;
    haptic('success'); // ADD THIS HERE

    const workoutExerciseRows = await db.workoutExercises.where('workoutId').equals(activeWorkout.id).toArray();
    const workoutExerciseIds = workoutExerciseRows.map(we => we.id);

    const allSets = await db.sets
      .filter(s => workoutExerciseIds.includes(s.workoutExerciseId))
      .toArray();

    const setsByExerciseId: Record<string, WorkoutSet[]> = {};
    for (const row of workoutExerciseRows) {
      setsByExerciseId[row.id] = allSets
        .filter(s => s.workoutExerciseId === row.id)
        .sort((a, b) => a.setNumber - b.setNumber);
    }

    const totalSets = allSets.length;
    const exerciseCount = workoutExerciseRows.length;

    const durationMinutes = workoutStartedAt
      ? Math.max(1, Math.round((Date.now() - workoutStartedAt.getTime()) / 60000))
      : 0;

    const finalName = await buildWorkoutName(activeWorkout, workoutExerciseRows);

    await db.workouts.update(activeWorkout.id, {
      name: finalName,
      completedAt: new Date().toISOString(),
      duration: durationMinutes
    });

    const templateExercises: TemplateExercise[] = [...workoutExerciseRows]
      .sort((a, b) => a.order - b.order)
      .map(row => {
        const rowSets = setsByExerciseId[row.id] || [];
        const firstSet = rowSets[0];

        return {
          exerciseId: row.exerciseId,
          sets: Math.max(1, rowSets.length || 3),
          reps: firstSet?.reps || 10
        };
      });

    setFinishSummary({
      workoutName: finalName,
      totalSets,
      durationMinutes,
      exerciseCount,
      templateExercises
    });

    setActiveWorkout(null);
    setShowTimer(false);
    setWorkoutStartedAt(null);
    setElapsedSeconds(0);
    setExpandedExercise(null);
  };

  const addExercise = async (exercise: Exercise) => {
    if (!activeWorkout) return;

    const currentCount = await db.workoutExercises.where('workoutId').equals(activeWorkout.id).count();
    const we: WorkoutExercise = {
      id: uuid(),
      workoutId: activeWorkout.id,
      exerciseId: exercise.id,
      order: currentCount
    };

    await db.workoutExercises.add(we);
    setShowPicker(false);
    setExpandedExercise(we.id);
  };

  const removeExercise = async (workoutExerciseId: string) => {
    await db.sets.where('workoutExerciseId').equals(workoutExerciseId).delete();
    await db.workoutExercises.delete(workoutExerciseId);
  };

  const addSet = async (
    workoutExerciseId: string,
    exerciseId: string,
    reps: number,
    weight: number,
  ) => {
    const existingSets = await db.sets.where('workoutExerciseId').equals(workoutExerciseId).count();

    const set: WorkoutSet = {
      id: uuid(),
      workoutExerciseId,
      setNumber: existingSets + 1,
      reps,
      weight,
      completedAt: new Date().toISOString()
    };

    await db.sets.add(set);
    setLastAddedSetId(set.id);

    const pr = activeWorkout
      ? await isPRSet(exerciseId, reps, weight, activeWorkout.id)
      : false;

    if (pr) {
      setPrSetIds(prev => [...prev, set.id]);
    }

    haptic(pr ? 'success' : 'light'); // ADD THIS HERE

    if (settings.timerEnabled) {
      setShowTimer(true);
    }

    window.setTimeout(() => {
      setLastAddedSetId(null);
    }, 700);
  };

  const deleteSet = async (setId: string) => {
    haptic('light'); // ADD THIS HERE
    await db.sets.delete(setId);
    setPrSetIds(prev => prev.filter(id => id !== setId));
  };

  const repeatLastSet = async (workoutExerciseId: string, exerciseId: string, sets: WorkoutSet[]) => {
    if (sets.length === 0) return;
    const lastSet = sets[sets.length - 1];
    await addSet(workoutExerciseId, exerciseId, lastSet.reps, lastSet.weight);
  };

  if (!activeWorkout) {
    return (
      <div className="page workout-page">
        <div className="page-header">
          <div>
            <h1>Workout</h1>
            <span className="workout-date">Start a session fast or use a template</span>
          </div>
        </div>

        <div className="start-options">
          <button className="start-btn primary" onClick={() => openStartModal('empty')}>
            <Play size={24} />
            <span>Empty Workout</span>
          </button>

          <button className="start-btn" onClick={() => openStartModal('template')}>
            <FileText size={24} />
            <span>From Template</span>
          </button>
        </div>

        <div className="template-list">
          <div className="template-list-head">
            <h3>Templates</h3>
            <button className="template-manage-btn" onClick={() => openTemplateEditor()}>
              <Plus size={16} />
              <span>New</span>
            </button>
          </div>

          {templates?.map(template => (
            <div key={template.id} className="template-row">
              <button
                className="template-item"
                onClick={() =>
                  setStartWorkoutState({
                    open: true,
                    mode: 'template',
                    workoutName: template.name,
                    selectedTemplateId: template.id
                  })
                }
              >
                <div className="template-info">
                  <span className="template-name">{template.name}</span>
                  <span className="template-desc">{template.description || 'Custom workout template'}</span>
                  <span className="template-exercises">
                    {template.exercises.length} exercises
                  </span>
                </div>
                <ChevronRight size={20} />
              </button>

              <button
                className="template-edit-btn"
                onClick={() => openTemplateEditor(template)}
                aria-label={`Edit ${template.name}`}
              >
                <Pencil size={16} />
              </button>
            </div>
          ))}
        </div>

        {finishSummary && (
          <div className="finish-summary-overlay" onClick={() => setFinishSummary(null)}>
            <div className="finish-summary-card" onClick={(e) => e.stopPropagation()}>
              <div className="finish-summary-badge">Workout Complete</div>
              <h2>{finishSummary.workoutName}</h2>

              <div className="finish-summary-stats">
                <div className="finish-stat">
                  <div className="finish-stat-value">{finishSummary.totalSets}</div>
                  <div className="finish-stat-label">Sets</div>
                </div>
                <div className="finish-stat">
                  <div className="finish-stat-value">{finishSummary.durationMinutes}m</div>
                  <div className="finish-stat-label">Duration</div>
                </div>
                <div className="finish-stat">
                  <div className="finish-stat-value">{finishSummary.exerciseCount}</div>
                  <div className="finish-stat-label">Exercises</div>
                </div>
              </div>

              <div className="finish-summary-actions">
                <button className="finish-summary-secondary-btn" onClick={handleSaveWorkoutAsTemplate}>
                  <Save size={16} />
                  <span>Save as Template</span>
                </button>
                <button className="finish-summary-btn" onClick={() => setFinishSummary(null)}>
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

        {startWorkoutState.open && (
          <div className="sheet-overlay" onClick={() => setStartWorkoutState(prev => ({ ...prev, open: false }))}>
            <div className="sheet-card" onClick={(e) => e.stopPropagation()}>
              <div className="sheet-head">
                <h3>{startWorkoutState.mode === 'empty' ? 'Start Workout' : 'Start from Template'}</h3>
                <button
                  className="sheet-close"
                  onClick={() => setStartWorkoutState(prev => ({ ...prev, open: false }))}
                >
                  <X size={18} />
                </button>
              </div>

              {startWorkoutState.mode === 'template' && (
                <div className="sheet-field">
                  <label>Template</label>
                  <select
                    value={startWorkoutState.selectedTemplateId || ''}
                    onChange={(e) => {
                      const template = templates?.find(t => t.id === e.target.value);
                      setStartWorkoutState(prev => ({
                        ...prev,
                        selectedTemplateId: e.target.value,
                        workoutName: template?.name || prev.workoutName
                      }));
                    }}
                  >
                    {templates?.map(template => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="sheet-field">
                <label>Workout Name</label>
                <input
                  type="text"
                  value={startWorkoutState.workoutName}
                  onChange={(e) =>
                    setStartWorkoutState(prev => ({
                      ...prev,
                      workoutName: e.target.value
                    }))
                  }
                  placeholder="Workout name"
                />
              </div>

              <button className="sheet-primary-btn" onClick={handleConfirmStartWorkout}>
                Start Workout
              </button>
            </div>
          </div>
        )}

        {templateEditor.open && (
          <div className="sheet-overlay" onClick={() => setTemplateEditor(prev => ({ ...prev, open: false }))}>
            <div className="sheet-card large" onClick={(e) => e.stopPropagation()}>
              <div className="sheet-head">
                <h3>{templateEditor.templateId ? 'Edit Template' : 'New Template'}</h3>
                <button
                  className="sheet-close"
                  onClick={() => setTemplateEditor(prev => ({ ...prev, open: false }))}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="sheet-field">
                <label>Template Name</label>
                <input
                  type="text"
                  value={templateEditor.name}
                  onChange={(e) => setTemplateEditor(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Template name"
                />
              </div>

              <div className="sheet-field">
                <label>Description</label>
                <input
                  type="text"
                  value={templateEditor.description}
                  onChange={(e) => setTemplateEditor(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Optional description"
                />
              </div>

              <div className="sheet-template-section">
                <div className="sheet-template-head">
                  <span>Exercises</span>
                  <button className="template-manage-btn" onClick={() => setShowTemplateExercisePicker(true)}>
                    <Plus size={16} />
                    <span>Add</span>
                  </button>
                </div>

                {templateEditor.exercises.length === 0 ? (
                  <div className="template-empty">No exercises yet</div>
                ) : (
                  templateEditor.exercises.map((item, index) => {
                    const exercise = exercises?.find(e => e.id === item.exerciseId);
                    return (
                      <div key={`${item.exerciseId}-${index}`} className="template-edit-row">
                        <div className="template-reorder-controls">
                          <button
                            className="template-reorder-btn"
                            onClick={() => moveTemplateExercise(index, 'up')}
                            disabled={index === 0}
                          >
                            <ArrowUp size={14} />
                          </button>
                          <button
                            className="template-reorder-btn"
                            onClick={() => moveTemplateExercise(index, 'down')}
                            disabled={index === templateEditor.exercises.length - 1}
                          >
                            <ArrowDown size={14} />
                          </button>
                        </div>

                        <div className="template-edit-main">
                          <div className="template-edit-name">{exercise?.name || 'Exercise'}</div>
                          <div className="template-edit-controls">
                            <input
                              type="number"
                              min="1"
                              value={item.sets}
                              onChange={(e) => updateTemplateExercise(index, { sets: parseInt(e.target.value) || 1 })}
                            />
                            <span>sets</span>
                            <input
                              type="number"
                              min="1"
                              value={item.reps || 0}
                              onChange={(e) => updateTemplateExercise(index, { reps: parseInt(e.target.value) || undefined })}
                            />
                            <span>reps</span>
                          </div>
                        </div>

                        <button className="template-remove-btn" onClick={() => removeTemplateExercise(index)}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="sheet-actions">
                {templateEditor.templateId && (
                  <>
                    <button className="sheet-secondary-btn" onClick={duplicateTemplate}>
                      <Copy size={16} />
                      <span>Duplicate</span>
                    </button>
                    <button className="sheet-danger-btn" onClick={deleteTemplate}>
                      <Trash2 size={16} />
                      <span>Delete</span>
                    </button>
                  </>
                )}

                <button className="sheet-primary-btn" onClick={saveTemplate}>
                  <Save size={16} />
                  <span>Save Template</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {showTemplateExercisePicker && (
          <ExercisePicker
            onSelect={addExerciseToTemplate}
            onClose={() => setShowTemplateExercisePicker(false)}
            excludeIds={templateEditor.exercises.map(e => e.exerciseId)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="page workout-page">
      <RestTimer isActive={showTimer} onClose={() => setShowTimer(false)} />

      <div className="page-header">
  <div className="workout-header-top">
    <div>
      <h1>{activeWorkout.name}</h1>
      <div className="workout-meta-row">
        <span className="workout-date">{getToday()}</span>
        <span className="workout-live-timer">{formattedElapsed}</span>
      </div>
    </div>
  </div>

  <div className="workout-header-actions">
    {activeWorkout.templateId && (
      <button className="save-template-pill" onClick={updateCurrentTemplateFromWorkout}>
        <RefreshCcw size={16} />
        <span>Update Template</span>
      </button>
    )}
    <button className="save-template-pill" onClick={openSaveCurrentAsTemplate}>
      <Save size={16} />
      <span>Save Template</span>
    </button>
    <button className="finish-btn" onClick={finishWorkout}>
      <Check size={20} /> Finish
    </button>
  </div>
</div>

      <div className="exercises-list">
        {workoutExercises?.map(({ workoutExercise, exercise, sets, previousSets }) => (
          <ExerciseCard
            key={workoutExercise.id}
            workoutExercise={workoutExercise}
            exercise={exercise}
            sets={sets}
            previousSets={previousSets}
            isExpanded={expandedExercise === workoutExercise.id}
            onToggle={() =>
              setExpandedExercise(expandedExercise === workoutExercise.id ? null : workoutExercise.id)
            }
            onAddSet={(reps, weight) => addSet(workoutExercise.id, exercise.id, reps, weight)}
            onDeleteSet={deleteSet}
            onRepeatLast={() => repeatLastSet(workoutExercise.id, exercise.id, sets)}
            onRemove={() => removeExercise(workoutExercise.id)}
            units={settings.units}
            prSetIds={prSetIds}
            lastAddedSetId={lastAddedSetId}
          />
        ))}

        <button className="add-exercise-btn" onClick={() => setShowPicker(true)}>
          <Plus size={24} />
          <span>Add Exercise</span>
        </button>
      </div>

      {showPicker && (
        <ExercisePicker
          onSelect={addExercise}
          onClose={() => setShowPicker(false)}
          excludeIds={workoutExercises?.map(we => we.exercise.id) || []}
        />
      )}

      {finishSummary && (
        <div className="finish-summary-overlay" onClick={() => setFinishSummary(null)}>
          <div className="finish-summary-card" onClick={(e) => e.stopPropagation()}>
            <div className="finish-summary-badge">Workout Complete</div>
            <h2>{finishSummary.workoutName}</h2>

            <div className="finish-summary-stats">
              <div className="finish-stat">
                <div className="finish-stat-value">{finishSummary.totalSets}</div>
                <div className="finish-stat-label">Sets</div>
              </div>
              <div className="finish-stat">
                <div className="finish-stat-value">{finishSummary.durationMinutes}m</div>
                <div className="finish-stat-label">Duration</div>
              </div>
              <div className="finish-stat">
                <div className="finish-stat-value">{finishSummary.exerciseCount}</div>
                <div className="finish-stat-label">Exercises</div>
              </div>
            </div>

            <div className="finish-summary-actions">
              <button className="finish-summary-secondary-btn" onClick={handleSaveWorkoutAsTemplate}>
                <Save size={16} />
                <span>Save as Template</span>
              </button>
              <button className="finish-summary-btn" onClick={() => setFinishSummary(null)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {templateEditor.open && (
        <div className="sheet-overlay" onClick={() => setTemplateEditor(prev => ({ ...prev, open: false }))}>
          <div className="sheet-card large" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-head">
              <h3>{templateEditor.templateId ? 'Edit Template' : 'New Template'}</h3>
              <button
                className="sheet-close"
                onClick={() => setTemplateEditor(prev => ({ ...prev, open: false }))}
              >
                <X size={18} />
              </button>
            </div>

            <div className="sheet-field">
              <label>Template Name</label>
              <input
                type="text"
                value={templateEditor.name}
                onChange={(e) => setTemplateEditor(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Template name"
              />
            </div>

            <div className="sheet-field">
              <label>Description</label>
              <input
                type="text"
                value={templateEditor.description}
                onChange={(e) => setTemplateEditor(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Optional description"
              />
            </div>

            <div className="sheet-template-section">
              <div className="sheet-template-head">
                <span>Exercises</span>
                <button className="template-manage-btn" onClick={() => setShowTemplateExercisePicker(true)}>
                  <Plus size={16} />
                  <span>Add</span>
                </button>
              </div>

              {templateEditor.exercises.length === 0 ? (
                <div className="template-empty">No exercises yet</div>
              ) : (
                templateEditor.exercises.map((item, index) => {
                  const exercise = exercises?.find(e => e.id === item.exerciseId);
                  return (
                    <div key={`${item.exerciseId}-${index}`} className="template-edit-row">
                      <div className="template-reorder-controls">
                        <button
                          className="template-reorder-btn"
                          onClick={() => moveTemplateExercise(index, 'up')}
                          disabled={index === 0}
                        >
                          <ArrowUp size={14} />
                        </button>
                        <button
                          className="template-reorder-btn"
                          onClick={() => moveTemplateExercise(index, 'down')}
                          disabled={index === templateEditor.exercises.length - 1}
                        >
                          <ArrowDown size={14} />
                        </button>
                      </div>

                      <div className="template-edit-main">
                        <div className="template-edit-name">{exercise?.name || 'Exercise'}</div>
                        <div className="template-edit-controls">
                          <input
                            type="number"
                            min="1"
                            value={item.sets}
                            onChange={(e) => updateTemplateExercise(index, { sets: parseInt(e.target.value) || 1 })}
                          />
                          <span>sets</span>
                          <input
                            type="number"
                            min="1"
                            value={item.reps || 0}
                            onChange={(e) => updateTemplateExercise(index, { reps: parseInt(e.target.value) || undefined })}
                          />
                          <span>reps</span>
                        </div>
                      </div>

                      <button className="template-remove-btn" onClick={() => removeTemplateExercise(index)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            <div className="sheet-actions">
              {templateEditor.templateId && (
                <>
                  <button className="sheet-secondary-btn" onClick={duplicateTemplate}>
                    <Copy size={16} />
                    <span>Duplicate</span>
                  </button>
                  <button className="sheet-danger-btn" onClick={deleteTemplate}>
                    <Trash2 size={16} />
                    <span>Delete</span>
                  </button>
                </>
              )}

              <button className="sheet-primary-btn" onClick={saveTemplate}>
                <Save size={16} />
                <span>Save Template</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {showTemplateExercisePicker && (
        <ExercisePicker
          onSelect={addExerciseToTemplate}
          onClose={() => setShowTemplateExercisePicker(false)}
          excludeIds={templateEditor.exercises.map(e => e.exerciseId)}
        />
      )}
    </div>
  );
}

interface ExerciseCardProps {
  workoutExercise: WorkoutExercise;
  exercise: Exercise;
  sets: WorkoutSet[];
  previousSets: WorkoutSet[];
  isExpanded: boolean;
  onToggle: () => void;
  onAddSet: (reps: number, weight: number,) => void;
  onDeleteSet: (id: string) => void;
  onRepeatLast: () => void;
  onRemove: () => void;
  units: 'lb' | 'kg';
  prSetIds: string[];
  lastAddedSetId: string | null;
}

function SwipeToDeleteRow({ children, onDelete }: { children: React.ReactNode; onDelete: () => void }) {
  const [offsetX, setOffsetX] = React.useState(0);
  const [isDragging, setIsDragging] = React.useState(false);
  const startX = React.useRef(0);
  const currentX = React.useRef(0);
  const THRESHOLD = -80;

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    currentX.current = e.touches[0].clientX;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const delta = e.touches[0].clientX - startX.current;
    currentX.current = e.touches[0].clientX;
    // Only allow swiping left
    if (delta < 0) setOffsetX(Math.max(delta, -100));
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (offsetX < THRESHOLD) {
      // Snap to fully open
      setOffsetX(-100);
      haptic('light');
    } else {
      // Snap back
      setOffsetX(0);
    }
  };

  const handleDelete = () => {
    haptic('medium');
    onDelete();
    setOffsetX(0);
  };

  return (
    <div className="swipe-row-wrapper">
      <div className="swipe-row-delete-bg">
        <button className="swipe-delete-btn" onClick={handleDelete}>
          <Trash2 size={18} />
          <span>Delete</span>
        </button>
      </div>
      <div
        className="swipe-row-content"
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: isDragging ? 'none' : 'transform 0.25s ease',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  );
}

function ExerciseCard({
  exercise,
  sets,
  previousSets,
  isExpanded,
  onToggle,
  onAddSet,
  onDeleteSet,
  onRepeatLast,
  onRemove,
  units,
  prSetIds,
  lastAddedSetId
}: ExerciseCardProps) {
  const [reps, setReps] = useState('');
  const [weight, setWeight] = useState('');
  const weightRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (previousSets.length > 0 && sets.length < previousSets.length) {
      const targetSet = previousSets[sets.length];
      if (targetSet) {
        setWeight(targetSet.weight.toString());
        setReps(targetSet.reps.toString());
      }
    }
  }, [previousSets, sets.length]);

  useEffect(() => {
    if (isExpanded) {
      window.setTimeout(() => weightRef.current?.focus(), 300);
    }
  }, [isExpanded]);

  const handleAddSet = () => {
    const r = parseInt(reps) || 0;
    const w = parseFloat(weight) || 0;

    if (r > 0) {
      onAddSet(r, w);
      haptic('medium');

      if (previousSets.length > sets.length + 1) {
        const nextPrevSet = previousSets[sets.length + 1];
        setWeight(nextPrevSet.weight.toString());
        setReps(nextPrevSet.reps.toString());
      }

      window.setTimeout(() => weightRef.current?.focus(), 100);
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    window.setTimeout(() => {
      e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 250);
  };

  return (
    <div className={`exercise-card ${isExpanded ? 'expanded' : ''}`}>
      <button className="exercise-header" onClick={onToggle}>
        <div className="exercise-title">
          <span className="exercise-name">{exercise.name}</span>
          <span className="exercise-sets-count">{sets.length} sets</span>
        </div>
        <ChevronRight size={20} className={`chevron ${isExpanded ? 'rotated' : ''}`} />
      </button>

      {isExpanded && (
        <div className="exercise-content">
          {previousSets.length > 0 && (
            <div className="previous-ref">
              <span className="ref-label">Previous</span>
              {previousSets.slice(0, 4).map((s, i) => (
                <span key={i} className="ref-set">
                  Set {i + 1}: {s.weight}{units} × {s.reps}
                </span>
              ))}
            </div>
          )}

          <div className="sets-list">
            {sets.map((set, idx) => (
              <div
                key={set.id}
                className={`set-row ${lastAddedSetId === set.id ? 'set-row-new' : ''}`}
              >
                <span className="set-number">{idx + 1}</span>
                <span className="set-weight">{set.weight} {units}</span>
                <span className="set-reps">× {set.reps}</span>
                {prSetIds.includes(set.id) && <span className="set-pr">PR</span>}
                <button className="delete-set" onClick={() => onDeleteSet(set.id)}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          <div className="add-set-form">
            <input
              ref={weightRef}
              type="number"
              placeholder="Weight"
              value={weight}
              onChange={e => setWeight(e.target.value)}
              className="input-weight"
              inputMode="decimal"
              onFocus={handleFocus}
            />
            <span className="input-unit">{units}</span>
            <span className="input-x">×</span>
            <input
              type="number"
              placeholder="Reps"
              value={reps}
              onChange={e => setReps(e.target.value)}
              className="input-reps"
              inputMode="numeric"
              onFocus={handleFocus}
            />
            <button className="add-set-btn" onClick={handleAddSet}>
              <Plus size={20} />
            </button>
          </div>

          <div className="quick-actions">
            {sets.length > 0 && (
              <button className="quick-btn" onClick={onRepeatLast}>
                <Copy size={16} /> Repeat Last
              </button>
            )}
            <button className="quick-btn danger" onClick={onRemove}>
              <Trash2 size={16} /> Remove
            </button>
          </div>
        </div>
      )}
    </div>
  );
}