import React, { useState, useMemo } from 'react';
import { Search, Plus, X, Check, ChevronRight, ChevronLeft, Trash2 } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import type { Exercise } from '../types';
import { v4 as uuid } from 'uuid';
import { haptic } from '../utils/haptics';
import './ExercisePicker.css';

interface Props {
  onSelect: (exercise: Exercise) => void;
  onClose: () => void;
  excludeIds?: string[];
}

const MUSCLE_GROUPS = [
  'Chest', 'Back', 'Shoulders', 'Legs', 'Biceps',
  'Triceps', 'Core', 'Glutes', 'Calves', 'Cardio', 'Forearms'
];

export function ExercisePicker({ onSelect, onClose, excludeIds = [] }: Props) {
  const [search, setSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [showAddNew, setShowAddNew] = useState(false);
  const [newExercise, setNewExercise] = useState({ name: '', muscleGroup: 'Chest', equipment: 'Barbell' });
  const [confirmDelete, setConfirmDelete] = useState<Exercise | null>(null);

  const exercises = useLiveQuery(() => db.exercises.toArray(), []);

  const availableExercises = useMemo(() => {
    if (!exercises) return [];
    return exercises.filter(e => !excludeIds.includes(e.id));
  }, [exercises, excludeIds]);

  const filteredExercises = useMemo(() => {
    if (!availableExercises || !selectedGroup) return [];
    return availableExercises
      .filter(e => e.muscleGroup === selectedGroup)
      .filter(e => e.name.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [availableExercises, selectedGroup, search]);

  const groupCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const group of MUSCLE_GROUPS) {
      counts[group] = availableExercises.filter(e => e.muscleGroup === group).length;
    }
    return counts;
  }, [availableExercises]);

  const handleAddExercise = async () => {
    if (!newExercise.name.trim()) return;
    haptic('medium');

    const exercise: Exercise = {
      id: uuid(),
      name: newExercise.name.trim(),
      muscleGroup: newExercise.muscleGroup,
      equipment: newExercise.equipment,
      isCustom: true
    };

    await db.exercises.add(exercise);
    setShowAddNew(false);
    setNewExercise({ name: '', muscleGroup: 'Chest', equipment: 'Barbell' });
    onSelect(exercise);
  };

  const handleDeleteExercise = async (exercise: Exercise) => {
    haptic('warning');
    // Remove the exercise and any workout data referencing it
    const workoutExercises = await db.workoutExercises.where('exerciseId').equals(exercise.id).toArray();
    for (const we of workoutExercises) {
      await db.sets.where('workoutExerciseId').equals(we.id).delete();
    }
    await db.workoutExercises.where('exerciseId').equals(exercise.id).delete();
    await db.exercises.delete(exercise.id);
    setConfirmDelete(null);
    haptic('success');
  };

  return (
    <div className="picker-overlay">
      <div className="picker-modal">
        <div className="picker-header">
          <div className="picker-header-left">
            {selectedGroup && !showAddNew && (
              <button
                onClick={() => { setSelectedGroup(null); setSearch(''); haptic('light'); }}
                className="back-btn"
              >
                <ChevronLeft size={20} />
              </button>
            )}
            <h2>{showAddNew ? 'Add Exercise' : selectedGroup ?? 'Select Exercise'}</h2>
          </div>
          <button onClick={() => { haptic('light'); onClose(); }} className="close-btn">
            <X size={24} />
          </button>
        </div>

        {!showAddNew && (
          <>
            {selectedGroup && (
              <div className="search-bar">
                <Search size={20} />
                <input
                  type="text"
                  placeholder={`Search ${selectedGroup.toLowerCase()} exercises...`}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            )}

            <div className="exercise-list">
              {!selectedGroup ? (
                <>
                  <button className="add-new-btn" onClick={() => { haptic('light'); setShowAddNew(true); }}>
                    <Plus size={20} />
                    <span>Add New Exercise</span>
                  </button>

                  {MUSCLE_GROUPS.map(group => (
                    <button
                      key={group}
                      className="exercise-item group-item"
                      onClick={() => { haptic('light'); setSelectedGroup(group); }}
                    >
                      <div className="exercise-info">
                        <span className="exercise-name">{group}</span>
                        <span className="exercise-meta">{groupCounts[group] || 0} exercises</span>
                      </div>
                      <ChevronRight size={18} className="group-chevron" />
                    </button>
                  ))}
                </>
              ) : (
                <>
                  <button className="add-new-btn" onClick={() => { haptic('light'); setShowAddNew(true); }}>
                    <Plus size={20} />
                    <span>Add New Exercise</span>
                  </button>

                  {filteredExercises.map(exercise => (
                    <div key={exercise.id} className="exercise-item-row">
                      <button
                        className="exercise-item"
                        onClick={() => { haptic('medium'); onSelect(exercise); }}
                      >
                        <div className="exercise-info">
                          <span className="exercise-name">{exercise.name}</span>
                          <span className="exercise-meta">{exercise.muscleGroup} • {exercise.equipment}</span>
                        </div>
                        {exercise.isCustom && <span className="custom-badge">Custom</span>}
                      </button>

                      <button
                        className="exercise-delete-btn"
                        onClick={e => { e.stopPropagation(); haptic('light'); setConfirmDelete(exercise); }}
                        aria-label={`Delete ${exercise.name}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}

                  {filteredExercises.length === 0 && (
                    <div className="picker-empty-state">
                      <p>No exercises found</p>
                      <span>Try another search or add a custom exercise.</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}

        {showAddNew && (
          <div className="add-new-form">
            <h3>Add New Exercise</h3>
            <input
              type="text"
              placeholder="Exercise name"
              value={newExercise.name}
              onChange={e => setNewExercise({ ...newExercise, name: e.target.value })}
              autoFocus
            />
            <select
              value={newExercise.muscleGroup}
              onChange={e => setNewExercise({ ...newExercise, muscleGroup: e.target.value })}
            >
              {MUSCLE_GROUPS.map(mg => <option key={mg} value={mg}>{mg}</option>)}
            </select>
            <select
              value={newExercise.equipment}
              onChange={e => setNewExercise({ ...newExercise, equipment: e.target.value })}
            >
              {['Barbell', 'Dumbbell', 'Cable', 'Machine', 'Bodyweight', 'Other'].map(eq => (
                <option key={eq} value={eq}>{eq}</option>
              ))}
            </select>
            <div className="form-actions">
              <button onClick={() => setShowAddNew(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleAddExercise} className="btn-primary">
                <Check size={18} /> Add
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="delete-confirm-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="delete-confirm-card" onClick={e => e.stopPropagation()}>
            <h3>Delete "{confirmDelete.name}"?</h3>
            <p>This will also remove it from any workouts it appears in. This can't be undone.</p>
            <div className="delete-confirm-actions">
              <button className="btn-secondary" onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button className="btn-danger" onClick={() => handleDeleteExercise(confirmDelete)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}